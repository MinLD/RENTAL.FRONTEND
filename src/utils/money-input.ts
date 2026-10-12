export function formatMoneyInput(value: string) {
  if (!value) return "";
  const [integer, fraction] = value.split(".");
  const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return fraction === undefined
    ? groupedInteger
    : `${groupedInteger},${fraction}`;
}

export function parseMoneyInput(value: string): string | null {
  const normalized = value.replace(/[.\s]/g, "");
  if (!/^\d*(?:,\d*)?$/.test(normalized)) return null;
  return normalized.replace(/^0+(?=\d)/, "").replace(",", ".");
}

export function getMoneyInputCaret(value: string, characterCount: number) {
  if (characterCount <= 0) return 0;
  let count = 0;
  for (let index = 0; index < value.length; index++) {
    if (value[index] !== ".") count++;
    if (count >= characterCount) return index + 1;
  }
  return value.length;
}
