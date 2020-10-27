interface ExpansionModifierCall {
    name: string;
    args: Array<string>;
}

interface Expansion {
    name: string;
    modifierCalls: Array<ExpansionModifierCall>;
}

interface Lexeme {
    originalString: string;
    formatString: string;
    expansions: Array<Expansion>;
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
    weightedLexemes: Array<WeightedLexeme>;
    totalWeight: number;
}

interface Grammar {
    rules: Map<string, Rule>;
    variables: Map<string, Variable>;
    modifiers: Map<string, Function>;
}

export {
    Grammar,
    Rule,
    Variable,
    Expansion,
    ExpansionModifierCall,
    Lexeme,
    WeightedLexeme,
};
