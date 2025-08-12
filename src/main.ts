import {tokenizer} from '@ansi-tools/parser';

const getClosingCode = (openingCode: number): number => {
  if (openingCode >= 30 && openingCode <= 37) return 39;
  if (openingCode >= 90 && openingCode <= 97) return 39;
  if (openingCode >= 40 && openingCode <= 47) return 49;
  if (openingCode >= 100 && openingCode <= 107) return 49;
  if (openingCode === 1 || openingCode === 2) return 22;
  if (openingCode === 3) return 23;
  if (openingCode === 4) return 24;
  if (openingCode === 7) return 27;
  if (openingCode === 8) return 28;
  if (openingCode === 9) return 29;
  return 0;
};

const isEndCode = (code: string): boolean => {
  return (
    code === '0' ||
    code === '39' ||
    code === '49' ||
    code === '22' ||
    code === '23' ||
    code === '24' ||
    code === '27' ||
    code === '28' ||
    code === '29'
  );
};

export function sliceAnsi(input: string, start: number, end?: number) {
  const codes = tokenizer(input);
  let activeCodes: Array<[string, number]> = [];
  let position = 0;
  let returnValue = '';
  let include = false;
  let currentIntroducer: string | undefined;
  let currentData: string | undefined;

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
        if (currentIntroducer !== '\x1b[') {
          break;
        }
        currentData = code.raw;
        if (!isEndCode(currentData)) {
          const closingCodeParam = getClosingCode(Number(currentData));
          activeCodes = activeCodes.filter(
            ([, closingCode]) =>
              closingCode !== closingCodeParam && closingCode !== 22
          );
          activeCodes.push([currentData, closingCodeParam]);
        } else {
          activeCodes = activeCodes.filter(
            ([, closingCode]) => closingCode !== Number(currentData)
          );
        }

        if (include) {
          returnValue += code.raw;
        }
        break;
      }
      case 'FINAL':
        currentData = undefined;
        currentIntroducer = undefined;

        if (include) {
          returnValue += code.raw;
        }
        break;
      case 'TEXT': {
        for (const chr of code.raw) {
          if (end !== undefined && position >= end) {
            break;
          }
          if (!include) {
            include = position >= start;
            if (include) {
              for (let i = 0; i < activeCodes.length; i++) {
                returnValue += `\x1B[${activeCodes[i][0]}m`;
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

  for (let i = activeCodes.length - 1; i >= 0; i--) {
    returnValue += `\x1B[${activeCodes[i][1]}m`;
  }

  return returnValue;
}
