function titleCase(sentence) {
  return sentence
    .split(/[\s-]+/)
    .map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
