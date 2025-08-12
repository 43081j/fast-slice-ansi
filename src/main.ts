import {tokenizer} from '@ansi-tools/parser';

export function sliceAnsi(input: string, start: number, end?: number) {
  const codes = tokenizer(input);
  let position = 0;
  let returnValue = '';
  let include = false;
  let currentIntroducer: string | undefined;
  let currentData: string | undefined;

  let currentFg: string | undefined;
  let currentBg: string | undefined;
  let isDim = false;
  let isBold = false;
  let isItalic = false;
  let isUnderline = false;
  let isInverse = false;
  let isHidden = false;
  let isStrikethrough = false;

  for (const code of codes) {
    if (end !== undefined && position >= end) {
      break;
    }

    switch (code.type) {
      case 'INTRODUCER':
        currentIntroducer = code.raw;
        currentData = undefined;

        if (include) {
          returnValue += code.raw;
        }
        break;
      case 'DATA': {
        if (currentIntroducer === '\x1b[') {
          currentData = code.raw;
        }
        if (include) {
          returnValue += code.raw;
        }
        break;
      }
      case 'FINAL': {
        if (
          currentData === undefined ||
          currentIntroducer !== '\x1b[' ||
          code.raw !== 'm'
        ) {
          if (include) {
            returnValue += code.raw;
          }
          break;
        }
        switch (currentData) {
          case '0':
            currentFg = undefined;
            currentBg = undefined;
            isDim = false;
            isBold = false;
            isItalic = false;
            isUnderline = false;
            isInverse = false;
            isHidden = false;
            isStrikethrough = false;
            break;
          case '39':
            currentFg = undefined;
            break;
          case '49':
            currentBg = undefined;
            break;
          case '22':
            isDim = false;
            isBold = false;
            break;
          case '23':
            isItalic = false;
            break;
          case '24':
            isUnderline = false;
            break;
          case '27':
            isInverse = false;
            break;
          case '28':
            isHidden = false;
            break;
          case '29':
            isStrikethrough = false;
            break;
          case '1':
            isBold = true;
            break;
          case '2':
            isDim = true;
            break;
          case '3':
            isItalic = true;
            break;
          case '4':
            isUnderline = true;
            break;
          case '7':
            isInverse = true;
            break;
          case '8':
            isHidden = true;
            break;
          case '9':
            isStrikethrough = true;
            break;
          default: {
            const asNumber = Number(currentData);

            if (asNumber >= 30 && asNumber <= 37) {
              currentFg = currentData;
            } else if (asNumber >= 90 && asNumber <= 97) {
              currentFg = currentData;
            } else if (asNumber >= 40 && asNumber <= 47) {
              currentBg = currentData;
            } else if (asNumber >= 100 && asNumber <= 107) {
              currentBg = currentData;
            }
            break;
          }
        }

        if (include) {
          returnValue += code.raw;
        }

        currentData = undefined;
        currentIntroducer = undefined;
        break;
      }
      case 'TEXT': {
        for (const chr of code.raw) {
          if (end !== undefined && position >= end) {
            break;
          }
          if (!include) {
            include = position >= start;
            if (include) {
              if (currentFg) {
                returnValue += `\x1B[${currentFg}m`;
              }
              if (currentBg) {
                returnValue += `\x1B[${currentBg}m`;
              }
              if (isDim) {
                returnValue += '\x1B[2m';
              }
              if (isBold) {
                returnValue += '\x1B[1m';
              }
              if (isItalic) {
                returnValue += '\x1B[3m';
              }
              if (isUnderline) {
                returnValue += '\x1B[4m';
              }
              if (isInverse) {
                returnValue += '\x1B[7m';
              }
              if (isHidden) {
                returnValue += '\x1B[8m';
              }
              if (isStrikethrough) {
                returnValue += '\x1B[9m';
              }
            }
          }
          if (include) {
            returnValue += chr;
          }
          position++;
        }
        break;
      }
    }
  }

  if (currentFg) {
    returnValue += '\x1B[39m';
  }
  if (currentBg) {
    returnValue += '\x1B[49m';
  }
  if (isDim) {
    returnValue += '\x1B[22m';
  }
  if (isBold) {
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

  return returnValue;
}
