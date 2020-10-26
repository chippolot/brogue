import path from 'path';

import { Brogue } from './brogue/brogue';

const brogue = new Brogue();
brogue.loadGrammar(path.resolve('config/grammars/app.grammar'));

console.log('-----------------------------------');
console.log(brogue.generate('roster'));
console.log('-----------------------------------');
