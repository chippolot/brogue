import fs from 'fs';

import { Grammar } from './grammar';
import { parseGrammar } from './parse';
import { generate } from './generate';
import { parseJSONEx, stringifyJSONEx } from './utils';

export class Lilt {
    grammar?: Grammar;

    loadGrammar(grammarFileName: string): void {
        this.grammar = parseGrammar(grammarFileName);
    }

    loadParsedGrammar(grammarFileName: string): void {
        let grammarString;
        try {
            grammarString = fs.readFileSync(grammarFileName, 'utf8');
        } catch (error) {
            throw new Error(`Failed to load grammar file: ${grammarFileName}`);
        }
        this.grammar = parseJSONEx(grammarString);
    }

    saveParsedGrammar(grammarFileName: string): void {
        if (!this.grammar) {
            throw new Error('Could not find loaded grammar to save.');
        }

        const grammarString = stringifyJSONEx(this.grammar);
        fs.writeFileSync(grammarFileName, grammarString);
    }

    generate(startingRule: string): string {
        if (!this.grammar) {
            throw new Error('No grammar loaded. Call \'loadGrammar()\' before generating.');
        }

        return generate(this.grammar, startingRule);
    }
}
