import {Grammar} from './grammar';
import {parseGrammar} from './parse';
import {generate} from './generate';

export class Lilt {
    grammar?: Grammar;

    loadGrammar(grammarFileName: string): void {
        this.grammar = parseGrammar(grammarFileName);
    }

    generate(startingRule: string): string {
        if (!this.grammar) {
            throw new Error('No grammar loaded. Call \'loadGrammar()\' before generating.');
        }

        return generate(this.grammar, startingRule);
    }
}
