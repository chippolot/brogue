import { getBuiltInModifier } from "./modifiers";
import { Expansion, ExpansionModifierCall, Grammar, Lexeme, Rule } from "./grammar";
import { parseLexeme } from "./parse";

const MaxRecursionDepth: number = 20;

class ExpansionContext {
    recursionDepth: number = 0;
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

function callExpansionModifier(call: ExpansionModifierCall, str: string, context: ExpansionContext): string {
    const func = context.grammar.modifiers.get(call.name) ?? getBuiltInModifier(call.name);
    if (func) {
        return func(str, ...call.args);
    }
    throw new Error(`Unrecognized function ${call.name}`);
}

function evaluateExpansion(expansion: Expansion, context: ExpansionContext): string {
    // 1. Run expansion
    let expandedString: string;
    if (context.variables.has(expansion.name)) {
        expandedString = context.variables.get(expansion.name)!;
    } else if (context.grammar.rules.has(expansion.name)) {
        const rule = context.grammar.rules.get(expansion.name)!;
        const lexeme = pickLexeme(rule);
        expandedString = expandLexeme(lexeme, context);
    } else {
        throw new Error(`Expansion of ${expansion.name} failed -- Could not find associated variable or rule with same name.`);
    }

    // 2. Process modifiers
    for (const call of expansion.modifierCalls) {
        expandedString = callExpansionModifier(call, expandedString, context);
    }

    return expandedString;
}

function formatString(format: string, args: Array<string>): string {
    return format.replace(/{(\d+)}/g, (match, number) => {
        return typeof args[number] === 'undefined' ? match : args[number];
    });
}

function expandLexeme(lexeme: Lexeme, context: ExpansionContext): string {
    if (context.recursionDepth > MaxRecursionDepth) {
        throw new Error(`Failed to expand lexeme ${lexeme.originalString}. Stack overflow.`);
    }

    context.recursionDepth++;
    const expansions = lexeme.expansions.map((expansion) => evaluateExpansion(expansion, context));
    context.recursionDepth--;
    return formatString(lexeme.formatString, expansions);

}

function expand(grammar: Grammar, text: string): string {

    const context = new ExpansionContext(grammar);
    const lexeme = parseLexeme(text);

    // Expand variables
    grammar.variables.forEach((variable) => {
        context.variables.set(variable.name, expandLexeme(variable.lexeme, context));
    });

    // Expand lexeme
    return expandLexeme(lexeme, context);
}

export {
    expand,
};
