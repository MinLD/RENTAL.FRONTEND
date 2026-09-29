export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatShortId(id: string) {
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}
