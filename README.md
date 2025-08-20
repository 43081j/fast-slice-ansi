# fast-slice-ansi

> A fast `String#slice` which supports ANSI escape sequences.

Originally a fork of `slice-ansi`, this has various performance and size improvements.

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
