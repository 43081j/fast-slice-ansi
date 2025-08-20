# fast-slice-ansi

> A fast `String#slice` which supports ANSI escape sequences.

Inspired by `slice-ansi`, this comes with various performance improvements.

## Install

```bash
npm i -S fast-slice-ansi
```

## Usage

```ts
import {sliceAnsi} from 'fast-slice-ansi';
import {styleText} from 'node:util';

const input = `Hello ${styleText('blue', 'blue')} world`;

const result = sliceAnsi(input, 6);
// result: '\u001b[34mblue\u001b[39m world'
```

## License

MIT
