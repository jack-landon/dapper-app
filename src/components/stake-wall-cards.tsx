"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { TOKENS } from "@/lib/constants";
import { toSignificant } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp } from "lucide-react";
import { BackgroundGradient } from "@/components/background-gradient";
import { CometCard } from "./ui/comet-card";
import { Button } from "./ui/button";
dayjs.extend(duration);

export type Stake = {
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
};

export function StakeWallCards({ stakes }: { stakes: Stake[] }) {
  const [active, setActive] = useState<Stake | boolean | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  const explorerBase = process.env.NEXT_PUBLIC_EXPLORER_BASE;

  const renderCompactRow = (stake: Stake) => {
    const token = TOKENS.find(
      (t) => t.address.toLowerCase() === stake.tokenAddress.toLowerCase()
    );
    const amountStaked = parseFloat(stake.amountStaked || "0") / 1e18;
    const interestPaid = parseFloat(stake.interestPaid || "0") / 1e18;

    const depositMs = parseInt(stake.depositTimestamp || "0") * 1000;
    const unlockMs = parseInt(stake.unlockTimestamp || "0") * 1000;
    const isWithdrawn = !!stake.withdrawTimestamp;
    const totalDuration = Math.max(1, unlockMs - depositMs);
    const elapsed = Math.max(
      0,
      Math.min(totalDuration, new Date().getTime() - depositMs)
    );
    const progress = isWithdrawn
      ? 100
      : Math.round((elapsed / totalDuration) * 100);

    const addr = stake.user_id || "";
    const truncated = addr
      ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
      : "Unknown";
    const dur = dayjs.duration(parseInt(stake.lockDuration || "0"), "seconds");
    const days = Math.floor(dur.asDays());
    const hours = dur.hours();
    const minutes = dur.minutes();
    const seconds = dur.seconds();
    const formattedLockDuration =
      [
        days > 0 ? `${days}d` : null,
        hours > 0 ? `${hours}h` : null,
        minutes > 0 ? `${minutes}m` : null,
        seconds > 0 && days === 0 && hours === 0 ? `${seconds}s` : null,
      ]
        .filter(Boolean)
        .join(" ") || "0s";

    const addressHref = explorerBase
      ? `${explorerBase}/address/${addr}`
      : undefined;
    const headerHref = explorerBase
      ? stake.depositTxHash
        ? `${explorerBase}/tx/${stake.depositTxHash}`
        : stake.vaultAddress
        ? `${explorerBase}/address/${stake.vaultAddress}`
        : undefined
      : undefined;

    return (
      <motion.div
        layoutId={`card-${stake.id}-${id}`}
        key={`card-${stake.id}-${id}`}
        onClick={() => setActive(stake)}
        className="cursor-pointer"
      >
        <CometCard translateDepth={10} rotateDepth={10}>
          <BackgroundGradient className="rounded-[22px] p-4 bg-white dark:bg-zinc-900 flex flex-col">
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

            <div className="mt-2 flex items-center gap-2">
              {(() => {
                const href = addressHref;
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
                  <AvatarImage src={token?.icon} alt={token?.symbol} />
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
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    isWithdrawn ? "bg-green-500" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

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
        </CometCard>
      </motion.div>
    );
  };

  const renderExpanded = (stake: Stake) => {
    const token = TOKENS.find(
      (t) => t.address.toLowerCase() === stake.tokenAddress.toLowerCase()
    );
    const amountStaked = parseFloat(stake.amountStaked || "0") / 1e18;
    const interestPaid = parseFloat(stake.interestPaid || "0") / 1e18;

    const depositMs = parseInt(stake.depositTimestamp || "0") * 1000;
    const unlockMs = parseInt(stake.unlockTimestamp || "0") * 1000;
    const isWithdrawn = !!stake.withdrawTimestamp;
    const totalDuration = Math.max(1, unlockMs - depositMs);
    const elapsed = Math.max(
      0,
      Math.min(totalDuration, new Date().getTime() - depositMs)
    );
    const progress = isWithdrawn
      ? 100
      : Math.round((elapsed / totalDuration) * 100);

    const dur = dayjs.duration(parseInt(stake.lockDuration || "0"), "seconds");
    const days = Math.floor(dur.asDays());
    const hours = dur.hours();
    const minutes = dur.minutes();
    const seconds = dur.seconds();
    const formattedLockDuration =
      [
        days > 0 ? `${days}d` : null,
        hours > 0 ? `${hours}h` : null,
        minutes > 0 ? `${minutes}m` : null,
        seconds > 0 && days === 0 && hours === 0 ? `${seconds}s` : null,
      ]
        .filter(Boolean)
        .join(" ") || "0s";

    const addr = stake.user_id || "";
    const truncated = addr
      ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
      : "Unknown";
    const addressHref = explorerBase
      ? `${explorerBase}/address/${addr}`
      : undefined;
    const headerHref = explorerBase
      ? stake.depositTxHash
        ? `${explorerBase}/tx/${stake.depositTxHash}`
        : stake.vaultAddress
        ? `${explorerBase}/address/${stake.vaultAddress}`
        : undefined
      : undefined;

    return (
      <div>
        <div className="flex justify-between items-start p-4">
          <div className="">
            <motion.h3
              layoutId={`title-${stake.id}-${id}`}
              className="font-bold text-neutral-700 dark:text-neutral-200"
            >
              {token?.symbol} Stake #{stake.stakeId}
            </motion.h3>
            <motion.p
              layoutId={`description-${stake.id}-${id}`}
              className="text-neutral-600 dark:text-neutral-400"
            >
              Staked by{" "}
              {addressHref ? (
                <a
                  href={addressHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {truncated}
                </a>
              ) : (
                truncated
              )}
            </motion.p>
          </div>

          {headerHref ? (
            <motion.a
              layoutId={`button-${stake.id}-${id}`}
              href={headerHref}
              target="_blank"
            >
              <Button
                variant="default"
                size="sm"
                className="shadow-lg/10 font-bold"
              >
                View on Explorer
              </Button>
            </motion.a>
          ) : null}
        </div>

        <div className="px-4 space-y-4 pb-6">
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className={`h-full ${
                isWithdrawn ? "bg-green-500" : "bg-primary"
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={token?.icon} alt={token?.symbol} />
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

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex flex-col">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Deposited
              </div>
              <div className="font-medium text-foreground">
                {dayjs(depositMs).format("MMM DD, YYYY")}
              </div>
              <div className="text-xs text-muted-foreground">
                {dayjs(depositMs).format("HH:mm")}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Lock
              </div>
              <div className="font-medium text-foreground">
                {formattedLockDuration}
              </div>
              {!isWithdrawn && progress < 100 && (
                <div className="text-xs text-primary">{progress}% complete</div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {isWithdrawn
                  ? "Withdrawn"
                  : dayjs().isAfter(dayjs(unlockMs))
                  ? "Unlocked"
                  : "Unlocks"}
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
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {active && typeof active === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <div className="fixed inset-0  grid place-items-center z-100">
            <motion.button
              key={`button-${(active as Stake).id}-${id}`}
              layout
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
                transition: {
                  duration: 0.05,
                },
              }}
              className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white rounded-full h-6 w-6"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${(active as Stake).id}-${id}`}
              ref={ref}
              className="w-full max-w-[500px] max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-hidden border border-border"
            >
              <motion.div layoutId={`image-${(active as Stake).id}-${id}`}>
                <img
                  width={200}
                  height={200}
                  src={`https://api.dicebear.com/9.x/open-peeps/svg?seed=${
                    (active as Stake).id
                  }`}
                  alt={`Stake ${(active as Stake).id}`}
                  className="w-full h-56 md:h-64 lg:h-72 sm:rounded-tr-lg sm:rounded-tl-lg object-contain bg-muted"
                />
              </motion.div>

              <div className="flex-1 overflow-y-auto">
                {renderExpanded(active as Stake)}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stakes.map((stake) => renderCompactRow(stake))}
      </div>
    </>
  );
}

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.05,
        },
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};
