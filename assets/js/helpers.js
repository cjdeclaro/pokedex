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
