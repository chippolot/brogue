/* eslint-disable no-use-before-define */
import { RandomSeed } from 'random-seed';

import { Markov } from './markov';

interface ExpansionModifierCall {
    name: string;
    args: any[];
}

interface Expansion {
    name: string;
    modifierCalls: ExpansionModifierCall[];
}

interface Lexeme {
    originalString: string;
    formatString: string;
    expansions: Expansion[];
    variables: Map<string, Variable> | undefined;
}

interface WeightedLexeme {
    lexeme: Lexeme;
    weight: number;
}

interface Variable {
    name: string;
    lexeme: Lexeme;
}

interface Rule {
    name: string;
    weightedLexemes: WeightedLexeme[];
    totalWeight: number;
}

interface MarkovSymbol {
    name: string;
    markov: Markov;
}

interface Grammar {
    random: RandomSeed,
    rules: Map<string, Rule>;
    variables: Map<string, Variable>;
    modifiers: Map<string, Function>;
    markovSymbols: Map<string, MarkovSymbol>;
}

export {
    Grammar,
    Rule,
    Variable,
    Expansion,
    ExpansionModifierCall,
    Lexeme,
    WeightedLexeme,
    MarkovSymbol,
};
