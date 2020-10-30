import { expect } from 'chai';
import sinon from 'sinon';

import 'mocha';
import { expand } from '../src/brogue/expand';
import { parseGrammarObject } from '../src/brogue/parse';
import { Grammar } from '../src/brogue/grammar';

describe('expand', () => {
    let grammar: Grammar;

    beforeEach(() => {
        grammar = parseGrammarObject({
            _variables: {
                $ruleA: '{ruleA}',
            },
            ruleA: ['a', 'b'],
            ruleB: ['c', 'd'],
        });
    });

    it('should expand empty string', () => {
        const expanded = expand(grammar, '');
        expect(expanded).to.equal('');
    });

    it('should expand expansion', () => {
        sinon.stub(grammar.random, 'random').returns(0);

        const expanded = expand(grammar, '{ruleA}');
        expect(expanded).to.equal('a');
    });

    it('should expand multiple expansions', () => {
        sinon.stub(grammar.random, 'random').returns(0);

        const expanded = expand(grammar, '{ruleA} {ruleB}');
        expect(expanded).to.equal('a c');
    });

    it('should expand variables', () => {
        sinon.stub(grammar.random, 'random')
            .onCall(0).returns(0)
            .returns(0.999);

        const expanded = expand(grammar, '{$ruleA} {$ruleA} {ruleA}');
        expect(expanded).to.equal('a a b');
    });
});
