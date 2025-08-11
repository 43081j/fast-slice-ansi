import {parse} from '@ansi-tools/parser';

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

const isEndCode = (code: number): boolean => {
  return (
    code === 0 ||
    code === 39 ||
    code === 49 ||
    code === 22 ||
    code === 23 ||
    code === 24 ||
    code === 27 ||
    code === 28 ||
    code === 29
  );
};

export function sliceAnsi(input: string, start: number, end?: number) {
  const codes = parse(input);
  let activeCodes: Array<[number, number]> = [];
  let position = 0;
  let returnValue = '';
  let include = false;

  for (const code of codes) {
    if (end !== undefined && position >= end) {
      break;
    }

    switch (code.type) {
      case 'TEXT': {
        for (const chr of code.raw) {
          if (end !== undefined && position >= end) {
            break;
          }
          if (!include) {
            include = position >= start;
            if (include) {
              returnValue = activeCodes
                .map(([code]) => {
                  return `\x1B[${code}m`;
                })
                .join('');
            }
          }
          if (include) {
            returnValue += chr;
          }
          position++;
        }
        break;
      }
      default: {
        const codeNumber = Number(code.params[0]);
        if (!isEndCode(codeNumber)) {
          const closingCodeParam = getClosingCode(codeNumber);
          activeCodes = activeCodes.filter(
            ([, closingCode]) =>
              closingCode !== closingCodeParam && closingCode !== 22
          );
          activeCodes.push([codeNumber, getClosingCode(codeNumber)]);
        } else {
          activeCodes = activeCodes.filter(
            ([, closingCode]) => closingCode !== codeNumber
          );
        }

        if (include) {
          returnValue += code.raw;
        }
        break;
      }
    }
  }

  returnValue += activeCodes
    .reverse()
    .map(([, code]) => {
      return `\x1B[${code}m`;
    })
    .join('');
  return returnValue;
}
