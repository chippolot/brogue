import { Markov } from './markov';

interface ExpansionModifierCall {
    name: string;
    args: string[];
}

interface Expansion {
    name: string;
    modifierCalls: ExpansionModifierCall[];
}

interface Lexeme {
    originalString: string;
    formatString: string;
    expansions: Expansion[];
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
