// reco/rerank.js
export function rerank(
  candidates,
  { w = { fbt: 1.0, similar: 0.8, personal: 0.9, trending: 0.6 } } = {}
) {
  const map = new Map();
  for (const { type, items } of candidates) {
    const wt = w[type] ?? 0.5;
    items.forEach((it, i) => {
      const key = String(it._id || it.id);
      const base = map.get(key) || { item: it, score: 0, seen: new Set() };
      if (!base.seen.has(type)) {
        base.score += wt * (1 / Math.log2(3 + i)); // position discount
        base.seen.add(type);
      }
      map.set(key, base);
    });
  }
  return Array.from(map.values())
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}
