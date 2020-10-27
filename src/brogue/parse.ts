import fs from 'fs';
import path from 'path';

import JSON5 from 'json5';

import { Expansion, ExpansionModifierCall, Grammar, Lexeme, Rule, Variable, WeightedLexeme } from './grammar';

function parseExansion(data: string): Expansion {
    const expansion: Expansion = { name: "", modifierCalls: [] };

    const tokens = data.split('.');
    expansion.name = tokens[0];

    for (let i = 1; i < tokens.length; ++i) {
        const callData = tokens[i];
        const callMatches = callData.match(/(?<func>[^()]+)(?:\((?<args>.*)\))?/);
        if (!callMatches || !callMatches.groups?.func) {
            throw new Error(`Failed to parse expression function call: ${data}`);
        }

        const call: ExpansionModifierCall = { name: callMatches.groups.func, args: [] };
        if (callMatches.groups.args) {
            call.args = callMatches.groups.args.split(',');
        }
        expansion.modifierCalls.push(call);
    }

    return expansion;
}

function parseLexeme(data: string): Lexeme {
    const lexeme: Lexeme = { originalString: data, formatString: "", expansions: [] };

    let replacementCounter = 0;
    lexeme.formatString = data.replace(/{([^}]+)}/g, (_, innerMatch) => {
        lexeme.expansions.push(parseExansion(innerMatch));
        return `{${replacementCounter++}}`;
    });

    return lexeme;
}

function parseWeightedLexeme(data: any): WeightedLexeme {
    let lexemeString: string;
    let weight = 1.0;

    if (typeof data === 'string') {
        lexemeString = data;
    } else if (typeof data === 'object') {
        lexemeString = Object.keys(data)[0];
        weight = data[lexemeString];
    } else {
        throw new Error(`Lexeme has unexpected type: ${typeof data}`);
    }

    const lexeme = parseLexeme(lexemeString);
    return { lexeme, weight };
}

function parseRule(name: string, data: any): Rule {
    const rule: Rule = { name, totalWeight: 0.0, weightedLexemes: [] };

    if (Array.isArray(data)) {
        for (const element of data) {
            const weightedLexeme = parseWeightedLexeme(element);
            rule.weightedLexemes.push(weightedLexeme);
            rule.totalWeight += weightedLexeme.weight;
        }
    } else if (typeof data === 'string' || typeof data === 'object') {
        const weightedLexeme = parseWeightedLexeme(data);
        rule.weightedLexemes.push(weightedLexeme);
        rule.totalWeight += weightedLexeme.weight;
    } else {
        throw new Error(`Expected value of rule ${name} to be array or string or object but was ${typeof data}`);
    }

    return rule;
}

function _mergeGrammars(into: Grammar, other: Grammar): void {
    other.rules.forEach((v, k) => {
        into.rules.set(k, v);
    });
    other.variables.forEach((v, k) => {
        into.variables.set(k, v);
    });
    other.modifiers.forEach((v, k) => {
        into.modifiers.set(k, v);
    });
}

function readGrammarFile(fileName: string): string {
    let grammarString: string;
    try {
        grammarString = fs.readFileSync(fileName, 'utf8');
    } catch (error) {
        throw new Error(`Failed to load grammar file: ${fileName}`);
    }
    return grammarString;
}

function parseGrammarObject(obj: any, basePath?: string): Grammar {
    const grammarDirName = basePath ? path.dirname(basePath) : process.cwd();

    const grammar: Grammar = {
        rules: new Map<string, Rule>(),
        variables: new Map<string, Variable>(),
        modifiers: new Map<string, Function>(),
    };

    // Handle includes
    const includeFileNames: Array<string> = obj._includes;
    if (includeFileNames) {
        for (const includeFileName of includeFileNames) {
            const absoluteIncludeFileName = path.resolve(grammarDirName, includeFileName);
            const includeGrammar = parseGrammarFile(absoluteIncludeFileName);
            _mergeGrammars(grammar, includeGrammar);
        }
    }

    // Parse variables
    const variableStrings: Object = obj._variables;
    if (variableStrings) {
        for (const [name, value] of Object.entries(variableStrings)) {
            const variable: Variable = { name, lexeme: parseLexeme(value) };
            grammar.variables.set(variable.name, variable);
        }
    }

    // Parse rules
    for (const [name, value] of Object.entries(obj)) {
        // Ignore reserved id names
        if (name.startsWith('_')) {
            continue;
        }
        const rule = parseRule(name, value);
        grammar.rules.set(rule.name, rule);
    }

    return grammar;
}

function parseGrammarString(text: string, basePath?: string): Grammar {
    let grammarObject;
    try {
        grammarObject = JSON5.parse(text);
    } catch (e) {
        throw new Error(`Failed to parse JSON5 text ${text.slice(0, 256)}... Internal error: ${e}`);
    }
    return parseGrammarObject(grammarObject, basePath);
}

function parseGrammarFile(fileName: string): Grammar {
    const grammarString = readGrammarFile(fileName);
    return parseGrammarString(grammarString, fileName);
}

export {
    parseGrammarFile,
    parseGrammarString,
    parseGrammarObject,
    parseLexeme,
};
