import path from 'path';

import { Lilt } from './lilt/lilt';

const lilt = new Lilt();
lilt.loadGrammar(path.resolve('config/grammars/app.grammar'));

for (let i = 0; i < 10; ++i) {
    console.log(lilt.generate('team_name'));
}
console.log('------------------');
for (let i = 0; i < 10; ++i) {
    console.log(lilt.generate('player_name'));
}