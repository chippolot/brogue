import {Grammar} from './grammar';
import {parseGrammar} from './parser';

export class Lilt {
    grammar?: Grammar;

    loadGrammar(grammarFileName: string): void {
        this.grammar = parseGrammar(grammarFileName);
    }
}
