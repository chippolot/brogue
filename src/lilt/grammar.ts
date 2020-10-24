class ExpansionFunctionCall {
    name: string = "";
    args: Array<string> = [];
}

class Expansion {
    name: string = "";
    functionCalls: Array<ExpansionFunctionCall> = [];
}

class Lexeme {
    originalString: string;
    formatString: string = "";
    expansions: Array<Expansion> = [];

    constructor(originalString: string) {
        this.originalString = originalString;
    }
}

class WeightedLexeme {
    lexeme: Lexeme;
    weight: number;

    constructor(lexeme: Lexeme, weight: number) {
        this.lexeme = lexeme;
        this.weight = weight;
    }
}

class Variable {
    name: string;
    lexeme: Lexeme;

    constructor(name: string, lexeme: Lexeme) {
        this.name = name;
        this.lexeme = lexeme;
    }
}

class Rule {
    name: string = "";
    weightedLexemes: Array<WeightedLexeme> = [];
    totalWeight: number = 0.0;
}

class Grammar {
    rules: Map<string, Rule> = new Map<string, Rule>();
    variables: Map<string, Variable> = new Map<string, Variable>();
    functions: Map<string, Function> = new Map<string, Function>();

    registerFuction(name: string, func: Function): void {
        this.functions.set(name, func);
    }

    merge(grammar: Grammar): void {
        grammar.rules.forEach((v, k) => {
            this.rules.set(k, v);
        });
        grammar.variables.forEach((v, k) => {
            this.variables.set(k, v);
        });
        grammar.functions.forEach((v, k) => {
            this.functions.set(k, v);
        });
    }
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
