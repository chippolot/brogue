import { expect } from 'chai';
import sinon from 'sinon';

import 'mocha';
import { expand } from '../src/brogue/expand';
import { parseGrammarObject } from '../src/brogue/parse';

describe('expand', () => {
    let grammarObject: any;

    beforeEach(() => {
        grammarObject = {
            ruleA: ['a', 'b'],
            ruleB: ['c', 'd'],
            ruleSentence: 'a cat and dog',
        };
    });

    it('should expand empty string', () => {
        const grammar = parseGrammarObject(grammarObject);
        const expanded = expand(grammar, '');
        expect(expanded).to.equal('');
    });

    it('should expand expansion', () => {
        const grammar = parseGrammarObject(grammarObject);
        sinon.stub(grammar.random, 'random').returns(0);

        const expanded = expand(grammar, '{ruleA}');
        expect(expanded).to.equal('a');
    });

    it('should expand multiple expansions', () => {
        const grammar = parseGrammarObject(grammarObject);
        sinon.stub(grammar.random, 'random').returns(0);

        const expanded = expand(grammar, '{ruleA} {ruleB}');
        expect(expanded).to.equal('a c');
    });

    describe('modifiers', () => {
        it('fails to invoke unrecognized modifiers', () => {
            const grammar = parseGrammarObject(grammarObject);

            expect(() => expand(grammar, '{ruleA.unrecognizedModifier}')).to.throw();
            expect(() => expand(grammar, '{ruleA.unrecognizedModifier()}')).to.throw();
        });

        it('invokes custom modifiers', () => {
            const grammar = parseGrammarObject(grammarObject);
            grammar.modifiers.set('test', (s: string) => `${s}_test`);

            sinon.stub(grammar.random, 'random').returns(0);

            expect(expand(grammar, '{ruleA.test}')).to.equal('a_test');
        });

        describe('built-in modifiers', () => {
            it('invokes capitalize modifier', () => {
                const grammar = parseGrammarObject(grammarObject);
                sinon.stub(grammar.random, 'random').returns(0);

                expect(expand(grammar, '{ruleSentence.capitalize}')).to.equal('A cat and dog');
            });

            it('invokes capitalizeall modifier', () => {
                const grammar = parseGrammarObject(grammarObject);
                sinon.stub(grammar.random, 'random').returns(0);

                expect(expand(grammar, '{ruleSentence.capitalizeall}')).to.equal('A Cat And Dog');
            });

            it('invokes quotes modifier', () => {
                const grammar = parseGrammarObject(grammarObject);
                sinon.stub(grammar.random, 'random').returns(0);

                expect(expand(grammar, '{ruleSentence.quotes}')).to.equal('"a cat and dog"');
            });

            it('invokes times modifier', () => {
                const grammar = parseGrammarObject(grammarObject);
                sinon.stub(grammar.random, 'random').returns(0);

                expect(expand(grammar, '{ruleA.times(3)}')).to.equal('a a a');

                expect(() => expand(grammar, '{ruleA.times}')).to.throw();
                expect(() => expand(grammar, '{ruleA.times("cat")}')).to.throw();
            });

            it('invokes OTHER', () => {
                expect.fail();
            });
        });
    });

    describe('variables', () => {
        it('expands global variables', () => {
            grammarObject._variables = [
                '{$ruleA= {ruleA}}',
            ];

            const grammar = parseGrammarObject(grammarObject);
            sinon.stub(grammar.random, 'random')
                .onCall(0).returns(0)
                .returns(0.999);

            expect(expand(grammar, '{$ruleA} {$ruleA} {ruleA}')).to.equal('a a b');
        });

        it('expands scoped variables in same scope', () => {
            const grammar = parseGrammarObject(grammarObject);
            sinon.stub(grammar.random, 'random')
                .onCall(0).returns(0)
                .returns(0.999);

            expect(expand(grammar, '{$ruleA= {ruleA}}{$ruleA} {$ruleA} {ruleA}')).to.equal('a a b');

            (grammar.random.random as any).restore();
            sinon.stub(grammar.random, 'random')
                .onCall(0).returns(0)
                .returns(0.999);

            expect(expand(grammar, '{$ruleA} {$ruleA} {ruleA}{$ruleA= {ruleA}}')).to.equal('a a b');
        });

        it('fails to expand scoped variables in parent scope', () => {
            const grammar = parseGrammarObject({
                outer: '{inner} {var}',
                inner: '{var= cat}',
            });
            expect(() => expand(grammar, '{outer}')).to.throw();
        });

        it('expands scoped variables in child scope', () => {
            const grammar = parseGrammarObject({
                outer: '{var= cat}{inner}',
                inner: '{var}',
            });
            expect(expand(grammar, '{outer}')).to.equal('cat');
        });
    });
});
