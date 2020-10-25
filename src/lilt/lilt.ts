import { Grammar } from './grammar';
import { generate } from './generate';
import { parseGrammarFile } from './parse';

class Lilt {
    grammar?: Grammar;

    loadGrammar(grammarFileName: string): void {
        this.grammar = parseGrammarFile(grammarFileName);
    }

    generate(startingRule: string): string {
        if (!this.grammar) {
            throw new Error('No grammar loaded. Call \'loadGrammar()\' before generating.');
        }

        return generate(this.grammar, startingRule);
    }
}


export {
    Lilt,
};
