import {tokenizer} from '@ansi-tools/parser';

export function sliceAnsi(input: string, start: number, end?: number) {
  if (end !== undefined && start === end) {
    return '';
  }

  const codes = tokenizer(input);
  let position = 0;
  let include = false;
  let currentIntroducer: string | undefined;
  let currentData: string | undefined;
  let rawStart: number = 0;
  let rawIndex: number = input.length;
  let prefix: string = '';

  let currentFg: string | undefined;
  let currentBg: string | undefined;
  let currentUnknown: string | undefined;
  let isDim = false;
  let isBold = false;
  let isItalic = false;
  let isUnderline = false;
  let isInverse = false;
  let isHidden = false;
  let isStrikethrough = false;

  codeLoop: for (const code of codes) {
    switch (code.type) {
      case 'INTRODUCER':
        currentIntroducer = code.raw;
        currentData = undefined;
        break;
      case 'DATA': {
        if (currentIntroducer === '\x1b[') {
          currentData = code.raw;
        }
        break;
      }
      case 'FINAL': {
        if (
          currentData === undefined ||
          currentIntroducer !== '\x1b[' ||
          code.raw !== 'm'
        ) {
          break;
        }
        const asNumber = +currentData;
        switch (asNumber) {
          case 0:
            currentFg = undefined;
            currentBg = undefined;
            currentUnknown = undefined;
            isDim = false;
            isBold = false;
            isItalic = false;
            isUnderline = false;
            isInverse = false;
            isHidden = false;
            isStrikethrough = false;
            break;
          case 39:
            currentFg = undefined;
            break;
          case 49:
            currentBg = undefined;
            break;
          case 22:
            isDim = false;
            isBold = false;
            break;
          case 23:
            isItalic = false;
            break;
          case 24:
            isUnderline = false;
            break;
          case 27:
            isInverse = false;
            break;
          case 28:
            isHidden = false;
            break;
          case 29:
            isStrikethrough = false;
            break;
          case 1:
            isBold = true;
            break;
          case 2:
            isDim = true;
            break;
          case 3:
            isItalic = true;
            break;
          case 4:
            isUnderline = true;
            break;
          case 7:
            isInverse = true;
            break;
          case 8:
            isHidden = true;
            break;
          case 9:
            isStrikethrough = true;
            break;
          default: {
            if (
              (asNumber >= 30 && asNumber <= 37) ||
              (asNumber >= 90 && asNumber <= 97)
            ) {
              currentFg = currentData;
            } else if (
              (asNumber >= 40 && asNumber <= 47) ||
              (asNumber >= 100 && asNumber <= 107)
            ) {
              currentBg = currentData;
            } else if (currentData.startsWith('38;')) {
              currentFg = currentData;
            } else if (currentData.startsWith('48;')) {
              currentBg = currentData;
            } else {
              currentUnknown = currentData;
            }
            break;
          }
        }

        currentData = undefined;
        currentIntroducer = undefined;
        break;
      }
      case 'TEXT': {
        for (let i = 0; i < code.raw.length; i++) {
          if (end !== undefined && position >= end) {
            rawIndex = code.pos + i + 1;
            break codeLoop;
          }
          const codePoint = code.raw.codePointAt(i);
          if (!include) {
            include = position >= start;
            if (include) {
              rawStart = code.pos + i;
              if (currentFg) {
                prefix += `\x1B[${currentFg}m`;
              }
              if (currentBg) {
                prefix += `\x1B[${currentBg}m`;
              }
              if (isDim) {
                prefix += '\x1B[2m';
              }
              if (isBold) {
                prefix += '\x1B[1m';
              }
              if (isItalic) {
                prefix += '\x1B[3m';
              }
              if (isUnderline) {
                prefix += '\x1B[4m';
              }
              if (isInverse) {
                prefix += '\x1B[7m';
              }
              if (isHidden) {
                prefix += '\x1B[8m';
              }
              if (isStrikethrough) {
                prefix += '\x1B[9m';
              }
              if (currentUnknown) {
                prefix += `\x1B[${currentUnknown}m`;
              }
            }
          }
          if (codePoint !== undefined && codePoint > 0xffff) {
            i++;
          }
          position++;
          if (end !== undefined && position >= end) {
            rawIndex = code.pos + i + 1;
            break codeLoop;
          }
        }
        break;
      }
    }
  }

  let returnValue = prefix + input.slice(rawStart, rawIndex);
  if (currentFg) {
    returnValue += '\x1B[39m';
  }
  if (currentBg) {
    returnValue += '\x1B[49m';
  }
  if (isDim || isBold) {
    returnValue += '\x1B[22m';
  }
  if (isItalic) {
    returnValue += '\x1B[23m';
  }
  if (isUnderline) {
    returnValue += '\x1B[24m';
  }
  if (isInverse) {
    returnValue += '\x1B[27m';
  }
  if (isHidden) {
    returnValue += '\x1B[28m';
  }
  if (isStrikethrough) {
    returnValue += '\x1B[29m';
  }
  if (currentUnknown) {
    returnValue += `\x1B[0m`;
  }

  return returnValue;
}
