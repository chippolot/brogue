/* eslint-disable babel/no-unused-expressions */
import { expect } from 'chai';

import 'mocha';
import { Lexeme } from '../src/brogue/grammar';
import { parseLexeme } from '../src/brogue/parse';

describe('parseLexeme', () => {
    it('parses empty lexeme', () => {
        const lexeme = parseLexeme("");
        expect(lexeme.originalString).to.equal('');
        expect(lexeme.formatString).to.equal('');
        expect(lexeme.expansions).to.have.lengthOf(0);
    });

    describe('parsing expansions', () => {

        it('fails to parse invalid expansions', () => {
            expect(() => { parseLexeme("}cat.a"); }).to.throw();
            expect(() => { parseLexeme("{cat.a"); }).to.throw();
            expect(() => { parseLexeme("{cat.a{}"); }).to.throw();
            expect(() => { parseLexeme("{cat.a}}"); }).to.throw();
        });

        it('parses lexeme with standard expansions', () => {
            const str = '{cat} {dog}';
            const lexeme = parseLexeme(str);
            expect(lexeme.expansions).to.have.lengthOf(2);

            const expansionNames = lexeme.expansions.map((x) => x.name);
            expect(expansionNames).to.include.members(['cat', 'dog']);
            expect(lexeme.expansions.every((l) => !l.isDecorator)).to.be.true;

            expect(lexeme.originalString).to.equal(str);
            expect(lexeme.formatString).to.equal('{0} {1}');
        });

        it('parses lexeme with decorator expansions', () => {
            const str = '{{cat}} {{dog}}';
            const lexeme = parseLexeme(str);
            expect(lexeme.expansions).to.have.lengthOf(2);

            const expansionNames = lexeme.expansions.map((x) => x.name);
            expect(expansionNames).to.include.members(['cat', 'dog']);
            expect(lexeme.expansions.every((l) => l.isDecorator)).to.be.true;

            expect(lexeme.originalString).to.equal(str);
            expect(lexeme.formatString).to.equal('{0} {1}');
        });

        describe('parsing modifiers', () => {

            it('fails to parse invalid modifiers', () => {
                expect(() => { parseLexeme("{cat..}"); }).to.throw();
                expect(() => { parseLexeme("{cat. .}"); }).to.throw();
                expect(() => { parseLexeme("{cat.(}"); }).to.throw();
                expect(() => { parseLexeme("{cat.)}"); }).to.throw();
                expect(() => { parseLexeme("{cat.())}"); }).to.throw();
            });

            it('parses modifiers without argument lists', () => {
                const lexeme = parseLexeme("{cat.a} {cat.a()}");

                expect(lexeme.expansions[0].modifierCalls).to.have.lengthOf(1);
                expect(lexeme.expansions[0].modifierCalls[0].name).to.equal('a');
                expect(lexeme.expansions[0].modifierCalls[0].args).to.have.lengthOf(0);

                expect(lexeme.expansions[1].modifierCalls).to.have.lengthOf(1);
                expect(lexeme.expansions[1].modifierCalls[0].name).to.equal('a');
                expect(lexeme.expansions[1].modifierCalls[0].args).to.have.lengthOf(0);

                expect(lexeme.formatString).to.equal('{0} {1}');
            });

            it('parses chained modifiers', () => {
                const lexeme = parseLexeme("{cat.a.b().c}");

                expect(lexeme.expansions[0].modifierCalls).to.have.lengthOf(3);
                expect(lexeme.expansions[0].modifierCalls[0].name).to.equal('a');
                expect(lexeme.expansions[0].modifierCalls[1].name).to.equal('b');
                expect(lexeme.expansions[0].modifierCalls[2].name).to.equal('c');
            });

            it('parses modifiers with arguments', () => {
                function expectArguments(lexeme: Lexeme, ...args: any[]): void {
                    expect(lexeme.expansions[0].modifierCalls).to.have.lengthOf(1);
                    expect(lexeme.expansions[0].modifierCalls[0].name).to.equal('a');
                    expect(lexeme.expansions[0].modifierCalls[0].args).to.have.lengthOf(args.length);
                    for (let i = 0; i < args.length; ++i) {
                        expect(lexeme.expansions[0].modifierCalls[0].args[i]).to.equal(args[i]);
                    }
                }

                expectArguments(parseLexeme("{cat.a('string')}"), 'string');
                expectArguments(parseLexeme('{cat.a("string")}'), 'string');
                expectArguments(parseLexeme('{cat.a("\\"string\\"")}'), '"string"');
                expectArguments(parseLexeme('{cat.a(", )")}'), ', )');
                expectArguments(parseLexeme('{cat.a(1)}'), 1);
                expectArguments(parseLexeme('{cat.a(2.5)}'), 2.5);
                expectArguments(parseLexeme('{cat.a("string", 1, 30)}'), 'string', 1, 30);
                expectArguments(parseLexeme('{cat.a("string {thing}")}'), 'string {thing}');
            });

            it('parses chained modifiers with arguments', () => {
                function expectModifier(lexeme: Lexeme, i: number, funcName: string, ...args: any[]): void {
                    expect(lexeme.expansions[0].modifierCalls[i].name).to.equal(funcName);
                    expect(lexeme.expansions[0].modifierCalls[i].args).to.have.lengthOf(args.length);
                    for (let j = 0; j < args.length; ++j) {
                        expect(lexeme.expansions[0].modifierCalls[i].args[j]).to.equal(args[j]);
                    }
                }

                const lexeme = parseLexeme('{cat.a(1,2).b("string")}');

                expectModifier(lexeme, 0, 'a', 1, 2);
                expectModifier(lexeme, 1, 'b', 'string');
            });
        });

        describe('parsing inline variables', () => {
            function expectVariables(lexeme: Lexeme, variables: any): void {
                expect(lexeme.variables).to.not.be.undefined;
                if (!lexeme.variables) {
                    return;
                }
                expect(lexeme.variables).to.be.lengthOf(Object.keys(variables).length);
                for (const key of Object.keys(variables)) {
                    const value: any = variables[key];
                    expect(lexeme.variables).has.key(key);
                    expect(lexeme.variables.get(key)!.lexeme.originalString).to.equal(value.originalString);
                    expect(lexeme.variables.get(key)!.lexeme.formatString).to.equal(value.formatString);
                }
            }

            it('fails to parse invalid variables', () => {
                expect(() => { parseLexeme('{='); }).to.throw();
                expect(() => { parseLexeme('{= '); }).to.throw();
                expect(() => { parseLexeme('{=}'); }).to.throw();
                expect(() => { parseLexeme('{= }'); }).to.throw();
                expect(() => { parseLexeme('{ =}'); }).to.throw();
                expect(() => { parseLexeme('{ = }'); }).to.throw();
                expect(() => { parseLexeme('{a=b}'); }).to.throw();
            });

            it('parses inline variables', () => {
                expectVariables(parseLexeme('{var= {cat}}'), { var: { originalString: '{cat}', formatString: '{0}' } });
                expectVariables(parseLexeme('{var= {cat.a}}'), { var: { originalString: '{cat.a}', formatString: '{0}' } });
                expectVariables(parseLexeme('{var= {cat}{dog}}'), { var: { originalString: '{cat}{dog}', formatString: '{0}{1}' } });
                expectVariables(parseLexeme('{var= {cat} dog}'), { var: { originalString: '{cat} dog', formatString: '{0} dog' } });
                expectVariables(parseLexeme('{var= cat=dog}'), { var: { originalString: 'cat=dog', formatString: 'cat=dog' } });
            });

            it('strips inline variables from lexeme format string', () => {
                let lexeme = parseLexeme('{var= {cat}}');
                expect(lexeme.formatString).to.equal('');

                lexeme = parseLexeme('{var= {cat}} {cat}');
                expect(lexeme.formatString).to.equal(' {0}');
            });
        });
    });
});
