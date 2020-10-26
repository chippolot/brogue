import { Grammar } from './grammar';
import { expand } from './expand';
import { parseGrammarFile, parseGrammarObject, parseGrammarString } from './parse';

class Brogue {
    grammar?: Grammar;

    loadGrammar(grammarFileName: string): void {
        this.grammar = parseGrammarFile(grammarFileName);
    }

    parseGrammar(grammar: any): void {
        if (typeof grammar === 'string') {
            this.grammar = parseGrammarString(grammar);
        } else {
            this.grammar = parseGrammarObject(grammar);
        }
    }

    registerFunction(name: string, func: Function): void {
        if (!this.grammar) {
            throw new Error('No grammar loaded.');
        }

        this.grammar.functions.set(name, func);
    }

    expand(text: string): string {
        if (!this.grammar) {
            throw new Error('No grammar loaded.');
        }

        return expand(this.grammar, text);
    }
}


export {
    Brogue,
};
