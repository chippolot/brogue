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

    describe('variables', () => {
        it('expands global variables', () => {
            grammarObject._variables = [
                '{$ruleA= {ruleA}}',
            ];

            const grammar = parseGrammarObject(grammarObject);
            sinon.stub(grammar.random, 'random')
                .onCall(0).returns(0)
                .returns(0.999);

            const expanded = expand(grammar, '{$ruleA} {$ruleA} {ruleA}');
            expect(expanded).to.equal('a a b');
        });

        it('expands scoped variables in same scope', () => {
            const grammar = parseGrammarObject(grammarObject);
            sinon.stub(grammar.random, 'random')
                .onCall(0).returns(0)
                .returns(0.999);

            let expanded = expand(grammar, '{$ruleA= {ruleA}}{$ruleA} {$ruleA} {ruleA}');
            expect(expanded).to.equal('a a b');

            (grammar.random.random as any).restore();
            sinon.stub(grammar.random, 'random')
                .onCall(0).returns(0)
                .returns(0.999);

            expanded = expand(grammar, '{$ruleA} {$ruleA} {ruleA}{$ruleA= {ruleA}}');
            expect(expanded).to.equal('a a b');
        });

        it('fails to expand scoped variables in parent scope', () => {
            expect.fail();
        });

        it('expands scoped variables in child scope', () => {
            expect.fail();
        });
    });
});
