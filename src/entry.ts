import path from 'path';

import {Lilt} from './lilt/lilt';

const lilt = new Lilt();
lilt.loadGrammar(path.resolve('config/example.grammar'));
const story = lilt.generate('story');
console.log(story);
