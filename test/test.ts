import assert from 'node:assert/strict';
import {test} from 'node:test';
import {stripVTControlCharacters} from 'node:util';
import {sliceAnsi} from '../lib/main.js';

test('operates like native slice', () => {
  const input = 'Some crazy text goes here, absolute nonsense';

  for (let i = 0; i < 21; i++) {
    for (let j = 21; j > i; j--) {
      assert.equal(input.slice(i, j), sliceAnsi(input, i, j));
    }
  }
});

test('operates like native slice with ANSI codes', () => {
  const input = '\u001B[31mSome crazy \x1B[8mtext\x1B[28m goes here, absolute nonsense\u001B[39m';

  for (let i = 0; i < 21; i++) {
    for (let j = 21; j > i; j--) {
      assert.equal(stripVTControlCharacters(input).slice(i, j), stripVTControlCharacters(sliceAnsi(input, i, j)));
    }
  }
});

test('supports full width characters', () => {
  const input = 'くしくし';
  assert.equal(sliceAnsi(input, 0, 2), 'くし');
  assert.equal(sliceAnsi(input, 0), 'くしくし');
});

test('supports surrogate pairs', () => {
  const input = 'foo\uD83D\uDE00';
  assert.equal(sliceAnsi(input, 2, 5), 'o\uD83D\uDE00');
  assert.equal(sliceAnsi(input, 2, 4), 'o\uD83D\uDE00');
});

test('appends unclosed sequences', () => {
  const input = '\x1B[31msome random text\x1b[39m and more';
  assert.equal(sliceAnsi(input, 0, 10), '\x1B[31msome rando\x1b[39m');
});

test('can slice text before sequences', () => {
  const input = 'foo \x1B[31mbar\x1B[39m baz';
  assert.equal(sliceAnsi(input, 0, 4), 'foo ');
});

test('can slice text after sequences', () => {
  const input = 'foo \x1B[31mbar\x1B[39m baz';
  assert.equal(sliceAnsi(input, 7), ' baz');
});

test('can slice text with background and foreground', () => {
  const input = '\x1B[31m\x1B[43mfoo\x1B[39m\x1B[49m bar';
  assert.equal(sliceAnsi(input, 0, 3), '\x1B[31m\x1B[43mfoo\x1B[39m\x1B[49m');
});

test('can slice bold text', () => {
  const input = '\x1B[1mfoo\x1B[22m bar';
  assert.equal(sliceAnsi(input, 0, 3), '\x1B[1mfoo\x1B[22m');
});

test('can slice italic text', () => {
  const input = '\x1B[3mfoo\x1B[23m bar';
  assert.equal(sliceAnsi(input, 0, 3), '\x1B[3mfoo\x1B[23m');
});

test('can slice unknown ANSI codes', () => {
  const input = '\x1B[123mfoo\x1B[0m bar';
  assert.equal(sliceAnsi(input, 0, 3), '\x1B[123mfoo\x1B[0m');
  assert.equal(sliceAnsi(input, 2), '\x1B[123mo\x1B[0m bar');
});

test('can slice text with RGB sequences', () => {
  const input = '\x1B[38;2;255;0;0mfoo\x1B[39m bar';
  assert.equal(sliceAnsi(input, 0, 3), '\x1B[38;2;255;0;0mfoo\x1B[39m');
});

test('can slice empty ranges', () => {
  assert.equal(sliceAnsi('foo', 0, 0), '');
});

test('can slice links', () => {
  const link = '\u001B]8;;https://example.com\u0007Example\u001B]8;;\u0007';
  assert.equal(sliceAnsi(link, 0, 7), link);
});

test('can slice text with control codes', () => {
  const input = 'foo \x1B[0Kbar\x1B[0Jbaz';
  assert.equal(sliceAnsi(input, 0, 7), 'foo \x1B[0Kbar');
});

test('can slice between surrogates when visual is false', () => {
  const input = 'foo\uD83D\uDE00bar';
  assert.equal(sliceAnsi(input, 0, 4, {visual: false}), 'foo\uD83D');
});

test('can slice negative indices', () => {
  const input = 'Some test string full of fluff';
  assert.equal(sliceAnsi(input, 0, -9), 'Some test string full');
});

test('can slice with OSC sequences', () => {
  const input = 'Some test string \x1B]2;Window Title\x07 other stuff';
  assert.equal(sliceAnsi(input, 18), 'other stuff');
});
