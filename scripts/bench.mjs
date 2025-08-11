import {Bench} from 'tinybench';
import legacySlice from 'slice-ansi';
import {sliceAnsi} from '../lib/main.js';
import {styleText} from 'node:util';

const bench = new Bench();
const input = `Hello, I am ${styleText('blue', 'blue text')}, and
I am ${styleText('red', 'red text')}.`;

bench.add('fast-slice-ansi', () => {
  sliceAnsi(input, 0, 5);
});
//bench.add('fast-slice-ansi (main)', () => {
  //sliceMain(input, 0, 5);
//});
bench.add('slice-ansi', () => {
  legacySlice(input, 0, 5);
});

await bench.run();

console.table(bench.table());
