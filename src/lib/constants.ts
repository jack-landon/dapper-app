export const TOKENS: Token[] = [
  {
    address: process.env.NEXT_PUBLIC_MUSD_ADDRESS as Address,
    vaultAddress: process.env.NEXT_PUBLIC_MUSD_DAPPER as Address,
    symbol: "MUSD",
    name: "MUSD",
    apy: 12,
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/37163.png",
  },
  {
    address: process.env.NEXT_PUBLIC_BTC_ADDRESS as Address,
    vaultAddress: process.env.NEXT_PUBLIC_BTC_DAPPER as Address,
    symbol: "BTC",
    name: "Bitcoin",
    apy: 10,
    icon: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
  },
] as const;

export const DURATIONS = [
  { label: "30 Days", days: 30, multiplier: 0.8, value: "2592000" },
  { label: "90 Days", days: 90, multiplier: 1.0, value: "7776000" },
  { label: "180 Days", days: 180, multiplier: 1.2, value: "15552000" },
  { label: "365 Days", days: 365, multiplier: 1.5, value: "31536000" },
] as const;
