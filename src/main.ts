import {tokenizer} from '@ansi-tools/parser';

const CSI = '\x1b[';
const OSC = '\x1b]';

export interface Options {
  visual?: boolean;
}

export function sliceAnsi(
  input: string,
  start: number,
  end?: number,
  options?: Options
) {
  const inputLength = input.length;
  const visual = options?.visual !== false;

  if (end !== undefined) {
    if (end < 0) {
      end = inputLength + end;
    }
    if (start === end) {
      return '';
    }
  }

  const codes = tokenizer(input);
  let position = 0;
  let include = false;
  let currentIntroducer: string | undefined;
  let currentData: string | undefined;
  let rawStart: number = 0;
  let rawIndex: number = inputLength;
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
  let currentLink: string | undefined;

  codeLoop: for (const code of codes) {
    switch (code.type) {
      case 'INTRODUCER':
        currentIntroducer = code.raw;
        currentData = undefined;
        break;
      case 'DATA': {
        if (currentIntroducer === CSI || currentIntroducer === OSC) {
          currentData = code.raw;
        }
        break;
      }
      case 'FINAL': {
        if (currentData === undefined) {
          break;
        }
        if (currentIntroducer === OSC) {
          if (currentData === '8;;') {
            currentLink = undefined;
          } else {
            const firstSemi = currentData.indexOf(';');
            const secondSemi = currentData.indexOf(';', firstSemi + 1);
            if (secondSemi !== -1) {
              currentLink = currentData.slice(secondSemi + 1);
            }
          }
          break;
        }
        if (currentIntroducer !== CSI || code.raw !== 'm') {
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
        const rawLength = code.raw.length;
        if (!include && rawLength + position <= start) {
          const codeLength = [...code.raw].length;
          position += codeLength;
          break;
        }

        for (let i = 0; i < rawLength; i++) {
          if (end !== undefined && position >= end) {
            rawIndex = code.pos + i + 1;
            break codeLoop;
          }
          const codePoint = code.raw.codePointAt(i);
          if (!include) {
            include = position >= start;
            if (include) {
              rawStart = code.pos + i;
              if (currentLink) {
                prefix += `${OSC}8;;${currentLink}\x07`;
              }
              if (currentFg) {
                prefix += `${CSI}${currentFg}m`;
              }
              if (currentBg) {
                prefix += `${CSI}${currentBg}m`;
              }
              if (isDim) {
                prefix += `${CSI}2m`;
              }
              if (isBold) {
                prefix += `${CSI}1m`;
              }
              if (isItalic) {
                prefix += `${CSI}3m`;
              }
              if (isUnderline) {
                prefix += `${CSI}4m`;
              }
              if (isInverse) {
                prefix += `${CSI}7m`;
              }
              if (isHidden) {
                prefix += `${CSI}8m`;
              }
              if (isStrikethrough) {
                prefix += `${CSI}9m`;
              }
              if (currentUnknown) {
                prefix += `${CSI}${currentUnknown}m`;
              }
            }
          }
          if (visual && codePoint !== undefined && codePoint > 0xffff) {
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
    returnValue += `${CSI}39m`;
  }
  if (currentBg) {
    returnValue += `${CSI}49m`;
  }
  if (isDim || isBold) {
    returnValue += `${CSI}22m`;
  }
  if (isItalic) {
    returnValue += `${CSI}23m`;
  }
  if (isUnderline) {
    returnValue += `${CSI}24m`;
  }
  if (isInverse) {
    returnValue += `${CSI}27m`;
  }
  if (isHidden) {
    returnValue += `${CSI}28m`;
  }
  if (isStrikethrough) {
    returnValue += `${CSI}29m`;
  }
  if (currentUnknown) {
    returnValue += `${CSI}0m`;
  }
  if (currentLink) {
    returnValue += `${OSC}8;;\x07`;
  }

  return returnValue;
}
