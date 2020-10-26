import { Grammar } from './grammar';
import { expand } from './expand';
import { parseGrammarFile } from './parse';

class Brogue {
    grammar?: Grammar;

    loadGrammar(grammarFileName: string): void {
        this.grammar = parseGrammarFile(grammarFileName);
    }

    expand(text: string): string {
        if (!this.grammar) {
            throw new Error('No grammar loaded. Call \'loadGrammar()\' before generating.');
        }

        return expand(this.grammar, text);
    }
}


export {
    Brogue,
};
