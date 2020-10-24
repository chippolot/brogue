import path from 'path';

import {Lilt} from './lilt/lilt';

const lilt = new Lilt();
lilt.loadGrammar(path.resolve('config/grammars/playernames.grammar'));

for (let i = 0; i < 100; ++i) {
    console.log(lilt.generate('player_name'));
}
