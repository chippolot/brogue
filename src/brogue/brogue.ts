import { Grammar } from './grammar';
import { expand } from './expand';
import { parseGrammarFile, parseGrammarObject, parseGrammarString, postParseGrammar } from './parse';

class Brogue {
    grammar?: Grammar;

    loadGrammar(grammarFileName: string): void {
        this.grammar = parseGrammarFile(grammarFileName);
        postParseGrammar(this.grammar);
    }

    parseGrammar(grammar: any): void {
        if (typeof grammar === 'string') {
            this.grammar = parseGrammarString(grammar);
        } else {
            this.grammar = parseGrammarObject(grammar);
        }
        postParseGrammar(this.grammar);
    }

    registerModifier(name: string, modifier: Function): void {
        if (!this.grammar) {
            throw new Error('No grammar loaded.');
        }

        this.grammar.modifiers.set(name, modifier);
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
