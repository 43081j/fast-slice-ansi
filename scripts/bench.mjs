import {Bench} from 'tinybench';
import legacySlice from 'slice-ansi';
import {sliceAnsi} from '../lib/main.js';
import {styleText} from 'node:util';

const inputs = [
  {
    name: 'simple',
    input: `Hello, I am ${styleText('blue', 'blue text')}, and
      I am ${styleText('red', 'red text')}.`,
    start: 0,
    end: 5
  },
  {
    name: 'short',
    input: `A short ${styleText('green', 'green')} example.`,
    start: 0,
    end: 5
  },
  {
    name: 'long',
    input: `A somewhat long ${styleText('red', ' red text ')} example`.repeat(80),
    start: 100,
    end: 180
  },
  {
    name: 'nested colours',
    input: `Some ${styleText('blue', `nested ${styleText('red', 'colours')}`)} example.`,
    start: 0,
    end: 5
  },
  {
    name: 'middle of colour',
    input: `This is a ${styleText('green', 'green text')} example.`,
    start: 15,
    end: undefined
  }
];

for (const {name, input, start, end} of inputs) {
  const bench = new Bench();

  bench.add(`slice-ansi (${name})`, () => {
    legacySlice(input, start, end);
  });
  bench.add(`fast-slice-ansi (${name})`, () => {
    sliceAnsi(input, start, end);
  });
  console.log(name);
  await bench.run();

  console.table(bench.table());
}
