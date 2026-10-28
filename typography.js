/* Line-break rules for headings and reading text (captions and small labels are left alone).
   Russian: short prepositions, conjunctions and particles stay with their neighbour, including across emphasis.
   Both languages: a dash never starts a line; in English "a", "an" and "I" stay with the next word. */
window.applyRussianTypography = function () {
  const ru = document.documentElement.lang === 'ru';
  const rules = ru ? [
    // prepositions, conjunctions and short pronouns hold on to the next word
    /(?<![\p{L}\p{N}-])(?:в|во|на|с|со|к|ко|о|об|обо|у|из|из-за|из-под|от|до|по|за|для|без|под|подо|над|надо|при|про|через|перед|передо|между|около|после|вокруг|и|а|но|да|или|ни|не|что|как|я|мы|ты|вы|он|её|их|это|то)([ \t]+)(?=\S)/giu,
    // particles hold on to the previous word
    /(?<=\S)([ \t]+)(?:же|ли|ль|бы|б)(?![\p{L}\p{N}])/giu,
  ] : [
    /(?<![\p{L}\p{N}'’-])(?:a|an|A|An|I)([ \t]+)(?=\S)/gu,
  ];
  rules.push(/(?<=\S)([ \t]+)[—–](?=\s)/gu);
  document.querySelectorAll('main h1, main h2, main h3, main p, main li, footer h2, footer p').forEach(element => {
    if (element.closest('.hero h1, .menu-anchor, .mm-sheet') || parseFloat(getComputedStyle(element).fontSize) < 14) return;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let text = '';
    while (walker.nextNode()) {
      nodes.push({ node: walker.currentNode, start: text.length });
      text += walker.currentNode.data;
    }
    const positions = new Set();
    rules.forEach(re => {
      for (const match of text.matchAll(re)) {
        const at = match.index + match[0].indexOf(match[1]);
        for (let i = at; i < at + match[1].length; i++) positions.add(i);
      }
    });
    if (!positions.size) return;
    nodes.forEach(({ node, start }) => {
      const next = node.data.split('').map((char, index) => positions.has(start + index) ? ' ' : char).join('');
      if (next !== node.data) node.data = next;
    });
  });
};
