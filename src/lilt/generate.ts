import { Expansion, ExpansionFunctionCall, Grammar, Lexeme, Rule } from "./grammar";

class GenerationContext {
    grammar: Grammar;
    variables: Map<string, string> = new Map<string, string>();

    constructor(grammar: Grammar) {
        this.grammar = grammar;
    }
}

function pickLexeme(rule: Rule): Lexeme {
    const weight = Math.random() * rule.totalWeight;

    let current = 0;
    for (const elem of rule.weightedLexemes) {
        current += elem.weight;
        if (weight < current) {
            return elem.lexeme;
        }
    }

    throw new Error(`Failed to pick lexeme for rule ${rule.name}`);
}

function callExpansionFunction(call: ExpansionFunctionCall, str: string): string {
    
}

function evaluateExpansion(expansion: Expansion, context: GenerationContext): string {
    // 1. Run expansion
    let expandedString;
    if (context.variables.has(expansion.name)) {
        expandedString = context.variables.get(expansion.name);
    } else if (context.grammar.rules.has(expansion.name)) {
        const rule = context.grammar.rules.get(expansion.name);
        const lexeme = pickLexeme(rule);
        expandedString = expandLexeme(lexeme, context);
    } else {
        throw new Error(`Expansion of ${expansion.name} failed -- Could not find associated variable or rule with same name.`);
    }

    // 2. Process functions
    expandedString = expansion.functionCalls.reduce((str, call) => callExpansionFunction(call, str));

    return expandedString;
}

function expandLexeme(lexeme: Lexeme, context: GenerationContext): string {
    const expansions = lexeme.expansions.map((expansion) => evaluateExpansion(expansion, context));
}

function generate(grammar: Grammar, ruleName: string): string {

    const context = new GenerationContext(grammar);

    // 1. Expand variables
    grammar.variables.forEach((variable) => {
        context.variables.set(variable.name, expandLexeme(variable.lexeme));
    });

    // 2. Pick lexeme
    const rule = grammar.rules.get(ruleName);
    if (!rule) {
        throw new Error(`Grammer does not contain rule ${ruleName}`);
    }
    const lexeme = pickLexeme(rule);

    // 3. Expand lexeme
    return expandLexeme(lexeme, context);
}

export {
    generate,
};