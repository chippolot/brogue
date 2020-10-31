import { getBuiltInModifier } from "./modifiers";
import { Expansion, ExpansionModifierCall, Grammar, Lexeme, MarkovSymbol, Rule, Variable } from "./grammar";
import { parseLexeme } from "./parse";

const MaxRecursionDepth: number = 20;

class ExpansionContext {
    recursionDepth: number = 0;
    grammar: Grammar;
    variableStack: (Map<string, string> | undefined)[] = [];

    constructor(grammar: Grammar) {
        this.grammar = grammar;
    }
}

function pickLexeme(rule: Rule, context: ExpansionContext, lexemesToIgnore?: Lexeme[]): Lexeme | undefined {
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

    const weight = context.grammar.random.random() * totalWeight;

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
    if (context.grammar.modifiers.has(call.name)) {
        const func = context.grammar.modifiers.get(call.name)!;
        return func(str, ...call.args);
    }
    const builtInFunc = getBuiltInModifier(call.name);
    if (builtInFunc) {
        return builtInFunc(str, context, ...call.args);
    }
    throw new Error(`Unrecognized function ${call.name}`);
}

function generateMarkovString(markovSymbol: MarkovSymbol, context: ExpansionContext): string {
    const settings = markovSymbol.markov.settings;
    for (let i = 0; i < settings.maxTries; ++i) {
        const str = markovSymbol.markov.generate(context);
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

function findVariableExpansion(name: string, context: ExpansionContext): string | undefined {
    for (let i = context.variableStack.length - 1; i >= 0; --i) {
        const value = context.variableStack[i]!.get(name);
        if (value !== undefined) {
            return value;
        }
    }
    return undefined;
}

function evaluateExpansion(expansion: Expansion, context: ExpansionContext): string {
    const grammar = context.grammar;
    const expansionName = expansion.name;

    // Run expansion
    let expandedString: string = '';
    const expandedVariable = findVariableExpansion(expansionName, context);
    if (expandedVariable !== undefined) {
        expandedString = expandedVariable;
    } else if (grammar.markovSymbols.has(expansionName)) {
        const markovSymbol = grammar.markovSymbols.get(expansionName)!;
        expandedString = generateMarkovString(markovSymbol, context);
    } else if (grammar.rules.has(expansionName)) {
        const rule = grammar.rules.get(expansionName)!;
        const lexeme = pickLexeme(rule, context);
        if (!lexeme) {
            expandedString = '';
        } else {
            expandedString = expandLexeme(lexeme, context);
        }
    } else if (expansionName) {
        throw new Error(`Expansion of ${expansionName} failed -- Could not find associated variable or rule or markov symbol with same name.`);
    }

    // Process modifiers
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

function expandVariables(variables: (Map<string, Variable> | undefined), context: ExpansionContext): (Map<string, any> | undefined) {
    if (!variables) {
        return undefined;
    }

    const expandedVariables = new Map<string, any>();
    variables.forEach((variable) => {
        expandedVariables.set(variable.name, expandLexeme(variable.lexeme, context));
    });
    return expandedVariables;
}

function expandLexeme(lexeme: Lexeme, context: ExpansionContext): string {
    try {
        context.variableStack.push(expandVariables(lexeme.variables, context));

        if (context.recursionDepth > MaxRecursionDepth) {
            throw new Error(`Failed to expand lexeme ${lexeme.originalString}. Stack overflow.`);
        }

        context.recursionDepth++;
        const expansions = lexeme.expansions.map((expansion) => evaluateExpansion(expansion, context));
        context.recursionDepth--;
        return formatString(lexeme.formatString, expansions);
    } finally {
        context.variableStack.pop();
    }
}

let activeExpansionContext: ExpansionContext | undefined;
let expansionDepth = 0;

function expand(grammar: Grammar, text: string): string {
    const context = activeExpansionContext ?? new ExpansionContext(grammar);
    activeExpansionContext = context;
    expansionDepth++;

    try {
        const lexeme = parseLexeme(text);

        // Expand global variables
        if (expansionDepth === 1) {
            context.variableStack.push(expandVariables(grammar.variables, context));
        }

        // Expand lexeme
        return expandLexeme(lexeme, context);
    } finally {
        if (--expansionDepth === 0) {
            activeExpansionContext = undefined;
        }
    }
}

export {
    expand,
    pickLexeme,
    expandLexeme,
    ExpansionContext,
};
