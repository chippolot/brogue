import path from 'path';

import { Lilt } from './lilt/lilt';

const lilt = new Lilt();
lilt.loadGrammar(path.resolve('config/grammars/app.grammar'));

console.log('-----------------------------------');
console.log(lilt.generate('roster'));
console.log('-----------------------------------');
