"use client";

import { useEffect, useState } from "react";
import { BackgroundGradient } from "@/components/background-gradient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TOKENS } from "@/lib/constants";
import { toSignificant } from "@/lib/utils";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import { LoaderFive, LoaderThree } from "@/components/loaders";
import { useAccount } from "wagmi";
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
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
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

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stakes.map((stake: Stake, index: number) => {
                  const depositMs =
                    parseInt(stake.depositTimestamp || "0") * 1000;
                  const unlockMs =
                    parseInt(stake.unlockTimestamp || "0") * 1000;
                  const now = Date.now();
                  const isWithdrawn = !!stake.withdrawTimestamp;
                  const totalDuration = Math.max(1, unlockMs - depositMs);
                  const elapsed = Math.max(
                    0,
                    Math.min(totalDuration, now - depositMs)
                  );
                  const progress = isWithdrawn
                    ? 100
                    : Math.round((elapsed / totalDuration) * 100);

                  const dur = dayjs.duration(
                    parseInt(stake.lockDuration || "0"),
                    "seconds"
                  );
                  const days = Math.floor(dur.asDays());
                  const hours = dur.hours();
                  const minutes = dur.minutes();
                  const seconds = dur.seconds();
                  const formattedLockDuration =
                    [
                      days > 0 ? `${days}d` : null,
                      hours > 0 ? `${hours}h` : null,
                      minutes > 0 ? `${minutes}m` : null,
                      seconds > 0 && days === 0 && hours === 0
                        ? `${seconds}s`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" ") || "0s";

                  const token = TOKENS.find(
                    (t) =>
                      t.address.toLowerCase() ===
                      stake.tokenAddress.toLowerCase()
                  );
                  const amountStaked =
                    parseFloat(stake.amountStaked || "0") / 1e18;
                  const interestPaid =
                    parseFloat(stake.interestPaid || "0") / 1e18;

                  const explorerBase = process.env.NEXT_PUBLIC_EXPLORER_BASE;
                  const headerHref = explorerBase
                    ? stake.depositTxHash
                      ? `${explorerBase}/tx/${stake.depositTxHash}`
                      : stake.vaultAddress
                      ? `${explorerBase}/address/${stake.vaultAddress}`
                      : undefined
                    : undefined;

                  return (
                    <BackgroundGradient
                      key={index}
                      className="rounded-[22px] p-4 bg-white dark:bg-zinc-900 flex flex-col"
                    >
                      {/* Header: token image + Stake heading */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {headerHref ? (
                            <a
                              href={headerHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-lg font-semibold hover:underline"
                            >
                              {token?.symbol} Stake #{stake.stakeId}
                            </a>
                          ) : (
                            <h3 className="text-lg font-semibold text-foreground">
                              {token?.symbol} Stake #{stake.stakeId}
                            </h3>
                          )}
                        </div>
                      </div>

                      {/* Staker details */}
                      <div className="mt-2 flex items-center gap-2">
                        {(() => {
                          const addr = stake.user_id || "";
                          const truncated = addr
                            ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
                            : "Unknown";
                          const explorerBase =
                            process.env.NEXT_PUBLIC_EXPLORER_BASE;
                          const href = explorerBase
                            ? `${explorerBase}/address/${addr}`
                            : undefined;
                          return href ? (
                            <p className="text-xs font-mono text-muted-foreground">
                              Staked by:{" "}
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono text-primary hover:underline"
                              >
                                {truncated}
                              </a>
                            </p>
                          ) : (
                            <span className="text-xs font-mono text-muted-foreground">
                              {truncated}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="w-full flex items-center justify-center">
                        <img
                          src={`https://api.dicebear.com/9.x/open-peeps/svg?seed=${stake.id}`}
                          alt={`Stake ${stake.id}`}
                          className="object-contain shrink-0"
                        />
                      </div>

                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={token?.icon}
                              alt={token?.symbol}
                            />
                            <AvatarFallback>{token?.symbol}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xl font-bold text-foreground">
                              {toSignificant(amountStaked)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {token?.symbol}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-primary">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-medium">
                            +{toSignificant(interestPaid)} {token?.symbol}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              isWithdrawn ? "bg-green-500" : "bg-primary"
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>

                        {/* Dates and duration */}
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="text-xs font-medium uppercase tracking-wide">
                                Deposited
                              </span>
                            </div>
                            <div className="font-medium text-foreground">
                              {dayjs(depositMs).format("MMM DD, YYYY")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {dayjs(depositMs).format("HH:mm")}
                            </div>
                          </div>

                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="text-xs font-medium uppercase tracking-wide">
                                Lock
                              </span>
                            </div>
                            <div className="font-medium text-foreground">
                              {formattedLockDuration}
                            </div>
                            {!isWithdrawn && progress < 100 && (
                              <div className="text-xs text-primary">
                                {progress}% complete
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="text-xs font-medium uppercase tracking-wide">
                                {isWithdrawn
                                  ? "Withdrawn"
                                  : dayjs().isAfter(dayjs(unlockMs))
                                  ? "Unlocked"
                                  : "Unlocks"}
                              </span>
                            </div>
                            <div className="font-medium text-foreground">
                              {dayjs(unlockMs).format("MMM DD, YYYY")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {dayjs(unlockMs).format("HH:mm")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </BackgroundGradient>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </>
    </div>
  );
}
