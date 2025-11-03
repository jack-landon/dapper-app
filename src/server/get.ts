"use server";

export async function getVaults() {}

export async function getUser(address: string) {
  const query = `
query UserDetails {
  User_by_pk(id: "${address}") {
    stakes(order_by: {depositTimestamp: desc}) {
      id
      stakeId
      amountStaked
      depositTimestamp
      depositTxHash
      interestPaid
      lockDuration
      unlockTimestamp
      withdrawTimestamp
      withdrawTxHash
      tokenAddress
      vaultAddress
    }
  }
}
    `;

  const result = await fetch(process.env.INDEXER_BASE_URL as string, {
    method: "POST",
    body: JSON.stringify({
      query: query,
      variables: {},
      operationName: "UserDetails",
    }),
  });

  const results = (await result.json()) as {
    data: {
      User_by_pk: {
        stakes: {
          id: string;
          stakeId: string;
          amountStaked: string;
          depositTimestamp: string;
          depositTxHash: string;
          interestPaid: string;
          lockDuration: string;
          unlockTimestamp: string;
          withdrawTimestamp: string;
          withdrawTxHash: string;
          tokenAddress: string;
          vaultAddress: string;
        }[];
      } | null;
    };
  };

  if (!results.data.User_by_pk) {
    return [];
  }

  return results.data.User_by_pk.stakes;
}

export async function getTreasuries() {
  const query = `
query TreasuryDetails {
  BeneficiaryVault {
    id
    lifetimeValueContributed
    tokenAddress
    contributions(order_by: {contributionTimestamp: desc}) {
      id
      amount
      contributionTxHash
      contributionTimestamp
      stake {
        amountStaked
        interestPaid
        lockDuration
        user_id
      }
    }
  }
}
    `;

  const result = await fetch(process.env.INDEXER_BASE_URL as string, {
    method: "POST",
    body: JSON.stringify({
      query: query,
      variables: {},
      operationName: "TreasuryDetails",
    }),
  });

  const results = (await result.json()) as {
    data: {
      BeneficiaryVault: {
        id: string;
        lifetimeValueContributed: string;
        tokenAddress: string;
        contributions: {
          id: string;
          amount: string;
          contributionTxHash: string;
          contributionTimestamp: number;
          stake: {
            amountStaked: string;
            interestPaid: string;
            lockDuration: string;
            user_id: string;
          };
        }[];
      }[];
    };
  };

  console.log("About to show treasuries");
  console.log(results.data.BeneficiaryVault);

  const musdTreasury = results.data.BeneficiaryVault.find(
    (vault) => vault.tokenAddress === process.env.NEXT_PUBLIC_MUSD_ADDRESS
  );
  const btcTreasury = results.data.BeneficiaryVault.find(
    (vault) => vault.tokenAddress === process.env.NEXT_PUBLIC_BTC_ADDRESS
  );

  if (!musdTreasury || !btcTreasury) throw new Error("Treasury not found");

  return {
    musdTreasury,
    btcTreasury,
  };
}
