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

### Options

An options object can be passed which has the following properties:

- `visual`: If `true` (default), slices operate against the visual representation of the string (e.g. a surrogate pair is counted as one character)

Example:

```ts
sliceAnsi(input, 0, 3, {visual: false});
```

## License

MIT
