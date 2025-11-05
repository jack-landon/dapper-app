"use client";

import { useEffect, useState } from "react";
// import { BackgroundGradient } from "@/components/background-gradient";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TOKENS } from "@/lib/constants";
import { toSignificant } from "@/lib/utils";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
// import { Calendar, Clock, TrendingUp } from "lucide-react";
import { LoaderFive, LoaderThree } from "@/components/loaders";
import { useAccount } from "wagmi";
import LogoHeader from "@/components/LogoHeader";
import { StakeWallCards } from "@/components/stake-wall-cards";
// import { CometCard } from "@/components/ui/comet-card";
dayjs.extend(duration);

export default function StakeWallPage() {
  interface Stake {
    id: string;
    stakeId: string;
    amountStaked: string;
    user_id: string;
    depositTimestamp: string;
    depositTxHash: string;
    interestPaid: string;
    lockDuration: string;
    unlockTimestamp: string;
    withdrawTimestamp: string;
    withdrawTxHash: string;
    tokenAddress: string;
    vaultAddress: string;
  }

  const [stakes, setStakes] = useState<Stake[]>([]);
  const [loading, setLoading] = useState(true);
  const { address } = useAccount();
  const now = Date.now();

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        const res = await fetch("/api/stake-wall", { cache: "no-store" });
        const data = await res.json();
        if (isMounted) setStakes(Array.isArray(data) ? data : []);
      } catch {
        if (isMounted) setStakes([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, []);

  // Simple aggregates for header details
  const uniqueTokenAddresses = Array.from(
    new Set(stakes.map((s) => s.tokenAddress.toLowerCase()))
  );
  const totalsByToken = uniqueTokenAddresses.map((addr) => {
    const token = TOKENS.find((t) => t.address.toLowerCase() === addr);
    const totalAmount = stakes
      .filter((s) => s.tokenAddress.toLowerCase() === addr)
      .reduce((acc, s) => acc + parseFloat(s.amountStaked || "0") / 1e18, 0);
    const totalInterest = stakes
      .filter((s) => s.tokenAddress.toLowerCase() === addr)
      .reduce((acc, s) => acc + parseFloat(s.interestPaid || "0") / 1e18, 0);
    return { token, totalAmount, totalInterest };
  });

  return (
    <div className="w-full">
      <>
        {/* Short hero (similar style to home hero) */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 grid-pattern opacity-30" />
          <div className="absolute top-16 left-1/4 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-16 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse delay-1000" />

          <div className="relative container mx-auto px-4 py-14 md:py-18">
            <div className="flex flex-col items-center max-w-4xl mx-auto text-center">
              <LogoHeader />
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-shadow-lg/70">
                Stake Wall
              </h1>
              <p className="mt-3 text-lg md:text-xl text-muted-foreground">
                Browse upcoming stake expiries and follow the progress of large
                upcoming staking events.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 py-8 md:py-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <LoaderThree />
              <LoaderFive text="Loading stake wall..." />
            </div>
          ) : (
            <>
              {/* Quick stats */}
              <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total Stakes
                  </div>
                  <div className="mt-1 text-2xl font-bold text-foreground">
                    {stakes.length}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Your Stakes
                  </div>
                  <div className="mt-1 text-2xl font-bold text-foreground">
                    {
                      stakes.filter(
                        (s) =>
                          s.user_id.toLowerCase() === address?.toLowerCase()
                      ).length
                    }
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Snapshot
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {totalsByToken.map(
                      ({ token, totalAmount, totalInterest }, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium text-foreground"
                        >
                          {token?.symbol}: {toSignificant(totalAmount)} staked
                          <span className="text-muted-foreground">·</span>+
                          {toSignificant(totalInterest)} interest
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <StakeWallCards stakes={stakes} />
            </>
          )}
        </div>
      </>
    </div>
  );
}
