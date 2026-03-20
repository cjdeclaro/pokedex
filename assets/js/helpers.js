const romanToInt = (roman) => {
  const map = {
    i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000
  };

  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const current = map[roman[i]];
    const next = map[roman[i + 1]];

    if (next && current < next) {
      total -= current;
    } else {
      total += current;
    }
  }
  return total;
};

const sortGenerations = (data) => {
  return Object.entries(data)
    .sort(([keyA], [keyB]) => {
      const romanA = keyA.split('-')[1];
      const romanB = keyB.split('-')[1];

      return romanToInt(romanA) - romanToInt(romanB);
    })
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
};

function titleCase(sentence) {
  return sentence
    .split(/[\s-]+/)
    .map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function removeString(toRemove, fullString) {
  const escaped = toRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex chars
  const regex = new RegExp(`\\b${escaped}\\b`, 'i'); // word-safe + case-insensitive

  return fullString
    .replace(regex, '')
    .replace(/\s+/g, ' ') // clean extra spaces
    .trim();
}
