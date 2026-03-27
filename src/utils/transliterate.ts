const vowels: Record<string, string> = {
  '\u0905': 'a', '\u0906': 'aa', '\u0907': 'i', '\u0908': 'ee',
  '\u0909': 'u', '\u090A': 'oo', '\u090B': 'ri', '\u090F': 'e',
  '\u0910': 'ai', '\u0913': 'o', '\u0914': 'au', '\u090D': 'e', '\u0911': 'o',
};

const consonants: Record<string, string> = {
  '\u0915': 'k', '\u0916': 'kh', '\u0917': 'g', '\u0918': 'gh', '\u0919': 'ng',
  '\u091A': 'ch', '\u091B': 'chh', '\u091C': 'j', '\u091D': 'jh', '\u091E': 'ny',
  '\u091F': 't', '\u0920': 'th', '\u0921': 'd', '\u0922': 'dh', '\u0923': 'n',
  '\u0924': 't', '\u0925': 'th', '\u0926': 'd', '\u0927': 'dh', '\u0928': 'n',
  '\u092A': 'p', '\u092B': 'ph', '\u092C': 'b', '\u092D': 'bh', '\u092E': 'm',
  '\u092F': 'y', '\u0930': 'r', '\u0932': 'l', '\u0935': 'v',
  '\u0936': 'sh', '\u0937': 'sh', '\u0938': 's', '\u0939': 'h',
  '\u0958': 'q', '\u0959': 'kh', '\u095A': 'gh', '\u095B': 'z',
  '\u095C': 'r', '\u095D': 'rh', '\u095E': 'f', '\u095F': 'y',
};

const matras: Record<string, string> = {
  '\u093E': 'aa', '\u093F': 'i', '\u0940': 'ee', '\u0941': 'u', '\u0942': 'oo',
  '\u0947': 'e', '\u0948': 'ai', '\u094B': 'o', '\u094C': 'au', '\u0943': 'ri',
  '\u0945': 'e', '\u0949': 'o',
};

const HALANT = '\u094D';
const NUKTA = '\u093C';

export function devanagariToRoman(text: string): string {
  let result = '';
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (vowels[ch]) {
      result += vowels[ch];
      i++;
      continue;
    }

    if (consonants[ch]) {
      let roman = consonants[ch];
      i++;

      if (i < text.length && text[i] === NUKTA) {
        const nk: Record<string, string> = {
          k: 'q', kh: 'kh', g: 'gh', j: 'z', ph: 'f', d: 'r', dh: 'rh',
        };
        roman = nk[roman] ?? roman;
        i++;
      }

      if (i < text.length && text[i] === HALANT) {
        result += roman;
        i++;
        continue;
      }

      if (i < text.length && matras[text[i]]) {
        result += roman + matras[text[i]];
        i++;
        continue;
      }

      result += roman + 'a';
      continue;
    }

    if (ch === '\u0902') { result += 'n'; i++; continue; }
    if (ch === '\u0903') { result += 'h'; i++; continue; }
    if (ch === '\u0901') { result += 'n'; i++; continue; }
    if (ch === NUKTA) { i++; continue; }
    if (ch === '\u0964') { result += '.'; i++; continue; }
    if (ch === '\u0965') { result += '.'; i++; continue; }

    const code = ch.charCodeAt(0);
    if (code >= 0x0966 && code <= 0x096F) {
      result += String(code - 0x0966);
      i++;
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}
