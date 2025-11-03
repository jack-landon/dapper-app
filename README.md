# Dapper

<p align="left">
  <img src="https://dapper-inky.vercel.app/dapper-logo" alt="Dapper logo" height="120" />
</p>

## What is Dapper?

Dapper lets users make a time-locked stake, similar to a term deposit (Certificate of Deposit). You choose an amount and a duration. You mint the yield up front, and at the end of the term you can withdraw your principal.

### How it works

- **Stake selection**: Choose your stake amount and term duration on the staking page. The UI is implemented in `src/app/stake/page.tsx` and `src/components/staking-interface.tsx`.
- **Up-front yield minting**: When you start the position, the corresponding yield is minted to you up front.
- **During the term**: Funds are placed into [August yield vaults](https://mezo.org/explore/vaults/pools/0x221B2D9aD7B994861Af3f4c8A80c86C4aa86Bf53) to generate yield throughout the lock period.
- **End of term**: When the term ends, you can withdraw your full principal.
- **Excess yield**: Since the vaults generate more yield than is required to repay principal at maturity, the excess yield is directed to the Dapper treasury.

### Get started

- **Make a stake**: Go to the staking page → [/stake](/stake).  
  Source: `src/app/stake/page.tsx`.
- **Join the treasury**: Participate in the treasury → [/treasury](/treasury).  
  Source: `src/app/treasury/page.tsx`.

### Pages

- Home: `src/app/page.tsx` → [/ ](/)
- Stake: `src/app/stake/page.tsx` → [/stake](/stake)
- Treasury: `src/app/treasury/page.tsx` → [/treasury](/treasury)

### Other notable repositories

- [Dapper Contracts Repo](https://github.com/jack-landon/dapper-contracts)
- [Dapper Indexer Repo](https://github.com/jack-landon/dapper-indexer)

---
