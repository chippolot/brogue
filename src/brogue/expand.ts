import { getBuiltInModifier } from "./modifiers";
import { Expansion, ExpansionModifierCall, Grammar, Lexeme, MarkovSymbol, Rule } from "./grammar";
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

function pickLexeme(rule: Rule, lexemesToIgnore?: Lexeme[]): Lexeme | undefined {
    let totalWeight = rule.totalWeight;
    let validSet = rule.weightedLexemes;

    if (lexemesToIgnore) {
        validSet = [...validSet];
        lexemesToIgnore.forEach((lexeme) => {
            const index = validSet.findIndex((x) => x.lexeme === lexeme);
            if (index !== -1) {
                totalWeight -= validSet[index].weight;
                validSet.splice(index, 1);
            }
        });
    }
    if (validSet.length === 0) {
        return undefined;
    }

    const weight = Math.random() * totalWeight;

    let current = 0;
    for (const elem of validSet) {
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
        return func(str, context, ...call.args);
    }
    throw new Error(`Unrecognized function ${call.name}`);
}

function generateMarkovString(markovSymbol: MarkovSymbol): string {
    const settings = markovSymbol.markov.settings;
    for (let i = 0; i < settings.maxTries; ++i) {
        const str = markovSymbol.markov.generate();
        if (str === undefined) {
            continue;
        }
        if (str.length < settings.minCharacters) {
            continue;
        }
        if (settings.uniqueOutput && markovSymbol.markov.sentences.includes(str)) {
            continue;
        }
        return str;
    }
    console.log(`Failed to generate markov string for symbol ${markovSymbol.name} after ${settings.maxTries} tries`);
    return '';
}

function evaluateExpansion(expansion: Expansion, context: ExpansionContext): string {
    const grammar = context.grammar;
    const expansionName = expansion.name;

    // 1. Run expansion
    let expandedString: string = '';
    if (context.variables.has(expansionName)) {
        expandedString = context.variables.get(expansionName)!;
    } else if (grammar.markovSymbols.has(expansionName)) {
        const markovSymbol = grammar.markovSymbols.get(expansionName)!;
        expandedString = generateMarkovString(markovSymbol);
    } else if (grammar.rules.has(expansionName)) {
        const rule = grammar.rules.get(expansionName)!;
        const lexeme = pickLexeme(rule);
        if (!lexeme) {
            expandedString = '';
        } else {
            expandedString = expandLexeme(lexeme, context);
        }
    } else if (expansionName) {
        throw new Error(`Expansion of ${expansionName} failed -- Could not find associated variable or rule or markov symbol with same name.`);
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
    pickLexeme,
    expandLexeme,
    ExpansionContext,
};
