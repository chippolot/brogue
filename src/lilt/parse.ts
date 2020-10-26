import fs from 'fs';
import path from 'path';

import JSON5 from 'json5';

import { Expansion, ExpansionFunctionCall, Grammar, Lexeme, Rule, Variable, WeightedLexeme } from './grammar';

function parseExansion(data: string): Expansion {
    const expansion: Expansion = { name: "", functionCalls: [] };

    const tokens = data.split('.');
    expansion.name = tokens[0];

    for (let i = 1; i < tokens.length; ++i) {
        const callData = tokens[i];
        const callMatches = callData.match(/(?<func>[^()]+)(?:\((?<args>.*)\))?/);
        if (!callMatches || !callMatches.groups?.func) {
            throw new Error(`Failed to parse expression function call: ${data}`);
        }

        const call: ExpansionFunctionCall = { name: callMatches.groups.func, args: [] };
        if (callMatches.groups.args) {
            call.args = callMatches.groups.args.split(',');
        }
        expansion.functionCalls.push(call);
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

function parseRule(name: string, data: any): Rule {
    if (!Array.isArray(data)) {
        throw new Error(`Expected value of rule ${name} to be array but was ${typeof data}`);
    }

    const rule: Rule = { name, totalWeight: 0.0, weightedLexemes: [] };
    for (const lexemeElement of data) {
        let lexemeString: string;
        let weight = 1.0;

        if (typeof lexemeElement === 'string') {
            lexemeString = lexemeElement;
        } else if (typeof lexemeElement === 'object') {
            lexemeString = Object.keys(lexemeElement)[0];
            weight = lexemeElement[lexemeString];
        } else {
            throw new Error(`Lexeme has unexpected type: ${typeof lexemeElement}`);
        }

        const lexeme = parseLexeme(lexemeString);
        const weightedLexeme: WeightedLexeme = { lexeme, weight };
        rule.weightedLexemes.push(weightedLexeme);
        rule.totalWeight += weightedLexeme.weight;
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
    other.functions.forEach((v, k) => {
        into.functions.set(k, v);
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

function parseGrammarString(text: string): any {
    try {
        return JSON5.parse(text);
    } catch (e) {
        throw new Error(`JSON5: Failed to parse text ${text}`);
    }
}

function parseGrammarFile(fileName: string): Grammar {
    // 1. Open and parse file
    const grammarString = readGrammarFile(fileName);
    const grammarObject = parseGrammarString(grammarString);
    const grammarDirName = path.dirname(fileName);

    let grammar: Grammar = {
        rules: new Map<string, Rule>(),
        variables: new Map<string, Variable>(),
        functions: new Map<string, Function>(),
    };

    // 2. Handle inheritance
    const baseFileName: string = grammarObject._extends;
    if (baseFileName) {
        const absoluteBaseFileName = path.resolve(grammarDirName, baseFileName);
        grammar = parseGrammarFile(absoluteBaseFileName);
    }

    // 3. Handle includes
    const includeFileNames: Array<string> = grammarObject._includes;
    if (includeFileNames) {
        for (const includeFileName of includeFileNames) {
            const absoluteIncludeFileName = path.resolve(grammarDirName, includeFileName);
            const includeGrammar = parseGrammarFile(absoluteIncludeFileName);
            _mergeGrammars(grammar, includeGrammar);
        }
    }

    // 4. Parse variables
    const variableStrings: Object = grammarObject._variables;
    if (variableStrings) {
        for (const [name, value] of Object.entries(variableStrings)) {
            const variable: Variable = { name, lexeme: parseLexeme(value) };
            grammar.variables.set(variable.name, variable);
        }
    }

    // 5. Parse rules
    for (const [name, value] of Object.entries(grammarObject)) {
        // Ignore reserved id names
        if (name.startsWith('_')) {
            continue;
        }
        const rule = parseRule(name, value);
        grammar.rules.set(rule.name, rule);
    }

    return grammar;
}

export {
    parseGrammarFile,
    readGrammarFile,
    parseGrammarString,
};
