import { Card } from "@/components/ui/card";
import { TrendingUp, Coins, Wallet, Shield } from "lucide-react";

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Variable Excess Yield",
    description:
      "Receive a share of excess yield generated when stakers unlock their positions ahead of schedule.",
  },
  {
    icon: Coins,
    title: "Staking Fees & Rewards",
    description:
      "Earn fees collected from staking activities as more participants join the protocol.",
  },
  {
    icon: Wallet,
    title: "Share-Based System",
    description:
      "Deposit into treasury vaults and receive vault shares representing your proportional ownership.",
  },
  {
    icon: Shield,
    title: "Secure & Transparent",
    description:
      "All treasury operations are run by smart contracts with full on-chain transparency.",
  },
];

export function TreasuryStats() {
  return (
    <section className="relative border-t border-primary/20 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 font-bold text-4xl text-foreground md:text-5xl">
            Why Join Treasury Vaults?
          </h2>
          <p className="text-balance text-muted-foreground text-lg leading-relaxed">
            Participate in treasury vaults and earn variable excess yield and
            fees generated from protocol staking activities.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, index) => (
            <Card
              key={index}
              className="group border-primary/20 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-[0_0_30px_rgba(0,255,255,0.15)]"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground text-lg">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <Card className="border-primary/20 bg-card/50 p-8 backdrop-blur-sm md:p-12">
            <h3 className="mb-6 text-center font-bold text-2xl text-foreground md:text-3xl">
              How Treasury Vaults Work
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                  1
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-foreground">
                    Join a Treasury Vault
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Choose a treasury vault (MUSD or BTC) and deposit your
                    tokens. You receive vault shares proportional to your
                    contribution, representing your ownership in the vault.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                  2
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-foreground">
                    Stakers Fund the Vault
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    When stakers create positions, the yield generated from the
                    staked tokens are contributed to the treasury vault, minus
                    their principal.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                  3
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-foreground">
                    Earn Excess Yield & Fees
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    When stakers unlock early or the protocol collects fees,
                    excess yield beyond the expected interest is generated. This
                    excess yield and collected fees are distributed to vault
                    participants based on their share ownership.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                  4
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-foreground">
                    Redeem Your Shares
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Redeem your vault shares at any time to receive your
                    underlying tokens plus your proportional share of
                    accumulated excess yield and fees from the vault.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
