import { getBuiltInModifier } from "./modifiers";
import { Expansion, ExpansionModifierCall, Grammar, Lexeme, MarkovSymbol, Rule, Variable } from "./grammar";
import { parseLexeme } from "./parse";

const MaxRecursionDepth: number = 20;

class ExpansionContext {
    recursionDepth: number = 0;
    grammar: Grammar;
    variableStack: (Map<string, string> | undefined)[] = [];
    uniqueTrackers: Set<Lexeme>[] = [];

    constructor(grammar: Grammar) {
        this.grammar = grammar;
    }

    pushUniqueTracker(): void {
        this.uniqueTrackers.push(new Set<Lexeme>());
    }

    popUniqueTracker(): void {
        this.uniqueTrackers.pop();
    }

    markLexemeAsSeen(lexeme: Lexeme): void {
        this.uniqueTrackers.forEach((seen) => seen.add(lexeme));
    }

    hasSeenLexeme(lexeme: Lexeme): boolean {
        return this.uniqueTrackers.some((set) => set.has(lexeme));
    }
}

function pickLexeme(rule: Rule, context: ExpansionContext): Lexeme | undefined {
    if (rule.weightedLexemes.length === 0) {
        return undefined;
    }
    const unseenLexemes = rule.weightedLexemes.filter((x) => !context.hasSeenLexeme(x.lexeme));
    const totalWeight = unseenLexemes.reduce((acc, next) => acc + next.weight, 0);
    if (totalWeight === 0) {
        return undefined;
    }

    const weight = context.grammar.random.random() * totalWeight;

    let current = 0;

    for (const elem of unseenLexemes) {
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

function evaluateExpansion(expansion: Expansion, context: ExpansionContext, trackUniqueExpansions: boolean): string | undefined {
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
        if (rule.weightedLexemes.every((x) => context.hasSeenLexeme(x.lexeme))) {
            return undefined;
        }

        const lexeme = pickLexeme(rule, context);
        if (!lexeme) {
            expandedString = '';
        } else {
            const expandedLexeme = expandLexeme(lexeme, context, trackUniqueExpansions);
            if (expandedLexeme === undefined) {
                return undefined;
            }
            expandedString = expandedLexeme;
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
        const expandedLexeme = expandLexeme(variable.lexeme, context, false);
        if (expandedLexeme !== undefined) {
            expandedVariables.set(variable.name, expandedLexeme);
        }
    });
    return expandedVariables;
}

function expandLexeme(lexeme: Lexeme, context: ExpansionContext, trackUniqueExpansions: boolean): string | undefined {
    try {
        context.variableStack.push(expandVariables(lexeme.variables, context));

        if (context.recursionDepth > MaxRecursionDepth) {
            throw new Error(`Failed to expand lexeme ${lexeme.originalString}. Stack overflow.`);
        }

        context.recursionDepth++;

        const expansions = lexeme.expansions.map((expansion) => evaluateExpansion(expansion, context, trackUniqueExpansions));
        if (trackUniqueExpansions && expansions.some((x) => x === undefined)) {
            context.markLexemeAsSeen(lexeme);
            return undefined;
        }

        if (trackUniqueExpansions && !lexeme.expansions.some((x) => x.name && !x.isDecorator)) {
            context.markLexemeAsSeen(lexeme);
        }

        context.recursionDepth--;

        return formatString(lexeme.formatString, expansions.map((x) => x!));
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
        return expandLexeme(lexeme, context, false) ?? '';
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
