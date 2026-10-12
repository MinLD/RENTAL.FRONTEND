export function getTodayDate() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function getMonthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return {
    from: `${month}-01`,
    to: new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10),
  };
}

export function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + offset, 1))
    .toISOString()
    .slice(0, 7);
}

export function getMonthDays(month: string) {
  const range = getMonthRange(month);
  const firstDay = new Date(`${range.from}T00:00:00Z`).getUTCDay();
  const offset = (firstDay + 6) % 7;
  const count = Number(range.to.slice(-2));
  return Array.from(
    { length: Math.ceil((offset + count) / 7) * 7 },
    (_, index) => {
      const day = index - offset + 1;
      return day < 1 || day > count
        ? null
        : `${month}-${String(day).padStart(2, "0")}`;
    },
  );
}

export function formatCalendarDate(date: string) {
  const value = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(value.getTime())
    ? "—"
    : new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeZone: "UTC",
      }).format(value);
}
