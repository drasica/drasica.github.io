/* Keep Russian prepositions with the word that follows, including across emphasis. */
window.applyRussianTypography = function () {
  if (document.documentElement.lang !== 'ru') return;
  const preposition = /(?<![\p{L}\p{N}-])(?:в|во|на|с|со|к|ко|о|об|обо|у|из|из-за|из-под|от|до|по|за|для|без|под|подо|над|надо|при|про|через|перед|передо|между|около|после|вокруг)[ \t]+(?=\S)/giu;
  document.querySelectorAll('main h1, main h2, main h3, main p').forEach(element => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let text = '';
    while (walker.nextNode()) {
      nodes.push({ node: walker.currentNode, start: text.length });
      text += walker.currentNode.data;
    }
    const positions = new Set();
    for (const match of text.matchAll(preposition)) {
      const spaces = match[0].match(/[ \t]+$/)[0];
      for (let i = match.index + match[0].length - spaces.length; i < match.index + match[0].length; i++) positions.add(i);
    }
    nodes.forEach(({node, start}) => {
      node.data = node.data.split('').map((char, index) => positions.has(start + index) ? '\u00a0' : char).join('');
    });
  });
};
