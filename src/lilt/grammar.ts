interface ExpansionFunctionCall {
    name: string;
    args: Array<string>;
}

interface Expansion {
    name: string;
    functionCalls: Array<ExpansionFunctionCall>;
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
    functions: Map<string, Function>;
}

export {
    Grammar,
    Rule,
    Variable,
    Expansion,
    ExpansionFunctionCall,
    Lexeme,
    WeightedLexeme,
};
