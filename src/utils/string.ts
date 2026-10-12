export function formatShortId(id: string) {
  if (id.length <= 11) return id;
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}
