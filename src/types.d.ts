type Address = `0x${string}`;

type Token = {
  address: Address;
  vaultAddress: Address;
  symbol: string;
  name: string;
  apy: number;
  icon: string;
};

type Duration = {
  label: string;
  days: number;
  multiplier: number;
  value: string;
};
