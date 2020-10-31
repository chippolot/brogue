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

        expect(expand(grammar, '')).to.equal('');
    });

    it('should expand expansion', () => {
        const grammar = parseGrammarObject(grammarObject);
        sinon.stub(grammar.random, 'random').returns(0);

        expect(expand(grammar, '{ruleA}')).to.equal('a');
    });

    it('should expand multiple expansions', () => {
        const grammar = parseGrammarObject(grammarObject);
        sinon.stub(grammar.random, 'random').returns(0);

        expect(expand(grammar, '{ruleA} {ruleB}')).to.equal('a c');
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
            it('"capitalize" modifier', () => {
                const grammar = parseGrammarObject({ sentence: 'a cat and dog' });

                expect(expand(grammar, '{sentence.capitalize}')).to.equal('A cat and dog');
            });

            it('"capitalizeall" modifier', () => {
                const grammar = parseGrammarObject({ sentence: 'a cat and dog' });

                expect(expand(grammar, '{sentence.capitalizeall}')).to.equal('A Cat And Dog');
            });

            it('"quotes" modifier', () => {
                const grammar = parseGrammarObject({ sentence: 'a cat and dog' });

                expect(expand(grammar, '{sentence.quotes}')).to.equal('"a cat and dog"');
            });

            it('"times" modifier', () => {
                const grammar = parseGrammarObject({ letter: 'a' });

                expect(expand(grammar, '{letter.times(3)}')).to.equal('a a a');

                expect(() => expand(grammar, '{letter.times}')).to.throw();
                expect(() => expand(grammar, '{letter.times("cat")}')).to.throw();
            });

            it('"a" modifier', () => {
                const grammar = parseGrammarObject({ noun: 'cat' });

                expect(expand(grammar, '{noun.a}')).to.equal('a cat');
            });

            it('"s" modifier', () => {
                const grammar = parseGrammarObject({ noun: 'cat' });

                expect(expand(grammar, '{noun.s}')).to.equal('cats');
            });

            it('"singular" modifier', () => {
                const grammar = parseGrammarObject({ nounPlural: 'cats' });

                expect(expand(grammar, '{nounPlural.singular}')).to.equal('cat');
            });

            it('"past" modifier', () => {
                const grammar = parseGrammarObject({ verb: 'run' });

                expect(expand(grammar, '{verb.past}')).to.equal('ran');
            });

            it('"present" modifier', () => {
                const grammar = parseGrammarObject({ verb: 'run' });

                expect(expand(grammar, '{verb.present}')).to.equal('runs');
            });

            it('"future" modifier', () => {
                const grammar = parseGrammarObject({ verb: 'run' });

                expect(expand(grammar, '{verb.future}')).to.equal('will run');
            });

            it('"ing" modifier', () => {
                const grammar = parseGrammarObject({ verb: 'run' });

                expect(expand(grammar, '{verb.ing}')).to.equal('running');
            });

            it('"infinitive" modifier', () => {
                const grammar = parseGrammarObject({ verb: 'runs' });

                expect(expand(grammar, '{verb.infinitive}')).to.equal('run');
            });

            it('"nounify" modifier', () => {
                const grammar = parseGrammarObject({
                    verbA: 'run',
                    verbB: 'paint',
                    verbC: 'debate',
                });

                expect(expand(grammar, '{verbA.nounify}')).to.equal('runner');
                expect(expand(grammar, '{verbB.nounify}')).to.equal('painter');
                expect(expand(grammar, '{verbC.nounify}')).to.equal('debater');
            });

            it('"possessive" modifier', () => {
                const grammar = parseGrammarObject({ noun: 'cat' });

                expect(expand(grammar, '{noun.possessive}')).to.equal('cat\'s');
            });

            it('"positive" modifier', () => {
                const grammar = parseGrammarObject({
                    verbNegative: 'does not run'
                });

                expect(expand(grammar, '{verbNegative.positive}')).to.equal('does run');
            });

            it('"negative" modifier', () => {
                const grammar = parseGrammarObject({ verb: 'run' });

                expect(expand(grammar, '{verb.negative}')).to.equal('does not run');
            });

            it('"numberToWords" modifier', () => {
                const grammar = parseGrammarObject({ number: '3' });

                expect(expand(grammar, '{number.numberToWords}')).to.equal('three');
            });

            it('"randomNumber" modifier', () => {
                const grammar = parseGrammarObject({});
                sinon.stub(grammar.random, 'intBetween').returns(3);

                expect(expand(grammar, '{.randomNumber(1,5)}')).to.equal('3');
            });

            it('"roll" modifier', () => {
                const grammar = parseGrammarObject({});

                let randStub = sinon.stub(grammar.random, 'intBetween');
                randStub.onCall(0).returns(1);
                randStub.onCall(1).returns(2);
                expect(expand(grammar, '{.roll("2d4+1")}')).to.equal('4');

                (grammar.random.intBetween as any).restore();
                randStub = sinon.stub(grammar.random, 'intBetween');
                randStub.onCall(0).returns(1);
                randStub.onCall(1).returns(2);
                expect(expand(grammar, '{.roll("2d4-1")}')).to.equal('2');

            });

            it('"uniques" modifier', () => {
                const grammar = parseGrammarObject({
                    choices: [
                        { a: 9999 },
                        { b: 0.0001 },
                        { c: 0.0001 },
                    ],
                });
                sinon.stub(grammar.random, 'random').returns(0);
                expect(expand(grammar, '{.uniques("choices", 3, ", ")}')).to.equal('a, b, c');
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
