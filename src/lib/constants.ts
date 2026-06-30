export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food", icon: "utensils", color: "#f97316" },
  { name: "Transport", icon: "car", color: "#06b6d4" },
  { name: "Groceries", icon: "shopping-cart", color: "#22c55e" },
  { name: "Rent", icon: "home", color: "#8b5cf6" },
  { name: "Bills", icon: "receipt", color: "#eab308" },
  { name: "Entertainment", icon: "film", color: "#ec4899" },
  { name: "Shopping", icon: "shopping-bag", color: "#a855f7" },
  { name: "Healthcare", icon: "heart-pulse", color: "#ef4444" },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", icon: "briefcase", color: "#22d3a0" },
  { name: "Freelance", icon: "laptop", color: "#3b82f6" },
  { name: "Business", icon: "store", color: "#a855f7" },
  { name: "Gift", icon: "gift", color: "#f472b6" },
  { name: "Other", icon: "circle", color: "#94a3b8" },
];

export const DEFAULT_SAVINGS_CATEGORIES = [
  { name: "Emergency Fund", icon: "shield", color: "#22d3a0" },
  { name: "Vacation", icon: "plane", color: "#06b6d4" },
];

export const DEFAULT_INVESTMENT_CATEGORIES = [
  { name: "Stocks", icon: "trending-up", color: "#22c55e" },
  { name: "Crypto", icon: "bitcoin", color: "#f59e0b" },
];

export const WALLET_TYPES = [
  { value: "cash", label: "Cash", icon: "banknote" },
  { value: "mobile_money", label: "Mobile Money", icon: "smartphone" },
  { value: "bank", label: "Bank", icon: "landmark" },
  { value: "credit_card", label: "Credit Card", icon: "credit-card" },
  { value: "savings", label: "Savings", icon: "piggy-bank" },
  { value: "business", label: "Business", icon: "briefcase" },
  { value: "crypto", label: "Crypto", icon: "bitcoin" },
  { value: "other", label: "Other", icon: "wallet" },
] as const;

export const WALLET_COLORS = ["#7c5cff", "#22d3a0", "#06b6d4", "#f59e0b", "#ec4899", "#ef4444", "#8b5cf6", "#0ea5e9"];