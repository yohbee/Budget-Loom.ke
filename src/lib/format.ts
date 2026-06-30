export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira" },
  { code: "ZAR", symbol: "R", label: "South African Rand" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
];

export function fmtMoney(amount: number | string | null | undefined, currency = "USD") {
  const n = typeof amount === "string" ? Number(amount) : amount ?? 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: Math.abs(n) >= 1000 ? 0 : 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export function fmtDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function startOfMonthISO(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}