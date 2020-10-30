import fs from 'fs';
import path from 'path';

import JSON5 from 'json5';

import { Expansion, ExpansionModifierCall, Grammar, Lexeme, MarkovSymbol, Rule, Variable, WeightedLexeme } from './grammar';
import { Markov } from './markov';

function parseLexeme(data: string): Lexeme {
    const lexeme: Lexeme = { originalString: data, formatString: "", expansions: [] };

    let i = 0;
    let j = -1;
    let numReplacements = 0;

    function parseError(errorString: string): Error {
        return new Error(`[Parsing] ${errorString}: ${data.slice(0, 255)}...`);
    }

    function parseExpansionModifierArgs(): any[] {
        let inString = false;
        let stringChar = '';

        while (++j < data.length) {
            const c = data[j];

            if (!inString) {
                // When we detect that the param list closes, json parse the contents to handle all arg types
                if (c === ')') {
                    const argListJSON = data.slice(i, j);
                    i = j + 1;
                    return JSON5.parse(`[${argListJSON}]`);
                // Start tracking string (where we don't care about ending the argument list)
                } else if (c === '\'' || c === '"') {
                    inString = true;
                    stringChar = c;
                }
            } else {
                // Next character is escaped, skip it
                if (c === '\\') {
                    j++;
                // Detected end of string
                } else if (c === stringChar) {
                    inString = false;
                }
            }
        }
        throw parseError('Reached end of string before closing argument list');
    }

    function parseExpansionModifier(): ExpansionModifierCall {
        const modifier: ExpansionModifierCall = { name: "", args: [] };

        let didParseArgs = false;

        while (++j < data.length) {
            const c = data[j];

            if (c === '(') {
                modifier.name = data.slice(i, j);
                i = j + 1;
                modifier.args = parseExpansionModifierArgs();
                didParseArgs = true;
            } else if (c === '}' || c === '.') {
                if (!didParseArgs) {
                    modifier.name = data.slice(i, j);
                }
                i = j-- + 1;
                if (!modifier.name) {
                    throw parseError(`Empty modifier name`);
                }
                return modifier;
            } else if (c === ')') {
                throw parseError(`Encountered invalid ')' character when outside arg list`);
            } else if (c === '{') {
                throw parseError(`Encountered invalid '{' character when parsing modifier`);
            }
        }
        throw parseError(`Reached end of string before before closing expansion`);
    }

    function parseExpansion(): Expansion {
        const expansion: Expansion = { name: "", modifierCalls: [] };

        while (++j < data.length) {
            const c = data[j];

            if (c === '}') {
                lexeme.formatString += `{${numReplacements++}}`;
                if (expansion.modifierCalls.length === 0) {
                    expansion.name = data.slice(i, j);
                }
                i = j + 1;
                return expansion;
            } else if (c === '.') {
                expansion.name = data.slice(i, j);
                i = j + 1;
                expansion.modifierCalls.push(parseExpansionModifier());
            } else if (c === '{') {
                throw parseError(`Encountered invalid '{' character when parsing expansion`);
            }
        }
        throw parseError(`Reached end of string before before closing expansion`);
    }

    while (++j < data.length) {
        const c = data[j];

        if (c === '{') {
            lexeme.formatString += data.slice(i, j);
            i = j + 1;
            lexeme.expansions.push(parseExpansion());
        } else if (c === '}') {
            throw parseError(`Encountered invalid '}' character when outside expansion`);
        }
    }
    lexeme.formatString += data.slice(i, j);

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

function trainMarkovSymbol(markovSymbol: MarkovSymbol, grammar: Grammar) {
    const expandedSentences = markovSymbol.markov.sentences.flatMap((s) => {
        if (s.startsWith('{') && s.endsWith('}')) {
            const ruleName = s.slice(1, -1);
            const rule = grammar.rules.get(ruleName);
            if (!rule) {
                throw new Error(`Could not find rule ${ruleName} when training markov synbol ${markovSymbol.name}`);
            }
            return rule.weightedLexemes.map((wl) => wl.lexeme.originalString);
        } else {
            return s;
        }
    });
    markovSymbol.markov.setSentences(expandedSentences);

    markovSymbol.markov.train();
}

function parseMarkovSymbol(name: string, data: any): MarkovSymbol {
    let sentences: string[];
    const settings = Markov.DefaultSettings;

    if (typeof data === 'string') {
        sentences = [data];
    } else if (Array.isArray(data)) {
        sentences = data;
    } else if (typeof data === 'object') {
        if (typeof data.sentences === 'string') {
            sentences = [data.sentences];
        } else if (data) {
            sentences = data.sentences;
        } else {
            throw new Error(`Failed to parse markov state data.`);
        }
        if (data.maxCharacters) {
            settings.maxCharacters = data.maxCharacters;
        }
        if (data.minCharacters) {
            settings.minCharacters = data.minCharacters;
        }
        if (data.maxTries) {
            settings.maxTries = data.maxTries;
        }
        if (data.uniqueOutput) {
            settings.uniqueOutput = data.uniqueOutput;
        }
        if (data.order) {
            settings.order = data.order;
        }
    } else {
        throw new Error(`Expected markov state to be string or object but found type: ${typeof data}`);
    }

    return { name, markov: new Markov(sentences, settings) };
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
    other.markovSymbols.forEach((v, k) => {
        into.markovSymbols.set(k, v);
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
        markovSymbols: new Map<string, MarkovSymbol>(),
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

    // Parse markov symbols
    const markovSymbols: Object = obj._markov;
    if (markovSymbols) {
        for (const [name, value] of Object.entries(markovSymbols)) {
            const markovSymbol = parseMarkovSymbol(name, value);
            grammar.markovSymbols.set(markovSymbol.name, markovSymbol);
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
        throw new Error(`Failed to parse JSON5 text ${text.slice(0, 256)}...\nInternal error: ${e}`);
    }
    return parseGrammarObject(grammarObject, basePath);
}

function parseGrammarFile(fileName: string): Grammar {
    const grammarString = readGrammarFile(fileName);
    return parseGrammarString(grammarString, fileName);
}

function postParseGrammar(grammar: Grammar): void {
    grammar.markovSymbols.forEach((markovSymbol) => {
        trainMarkovSymbol(markovSymbol, grammar);
    });
}

export {
    parseGrammarFile,
    parseGrammarString,
    parseGrammarObject,
    parseLexeme,
    postParseGrammar,
};
