"use client";

import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { toast } from "sonner";
import { Calendar, Check, Clock, TrendingUp, ExternalLink } from "lucide-react";
import { dapperAbi } from "@/lib/abis";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Address } from "viem";
import { confettiExplosion, toSignificant } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { createPortal } from "react-dom";
import { TOKENS } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

dayjs.extend(duration);

interface Stake {
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
}

interface StakeCardProps {
  stake: Stake;
  isNew?: boolean;
  onWithdrawSuccess?: () => void | Promise<unknown>;
}

export function StakeCard({
  stake,
  isNew = false,
  onWithdrawSuccess,
}: StakeCardProps) {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const depositToken = TOKENS.find(
    (token) => token.address.toLowerCase() === stake.tokenAddress.toLowerCase()
  );
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawingHash, setWithdrawingHash] = useState<
    `0x${string}` | undefined
  >(undefined);
  const {
    isLoading: isWithdrawingConfirming,
    isSuccess: isWithdrawingConfirmed,
    isError: isWithdrawingError,
    error: withdrawingError,
  } = useWaitForTransactionReceipt({ hash: withdrawingHash });

  const isWithdrawn = !!stake.withdrawTimestamp;
  const unlockTimestamp = parseInt(stake.unlockTimestamp) * 1000;
  const depositTimestamp = parseInt(stake.depositTimestamp) * 1000;
  const unlockDate = useMemo(() => dayjs(unlockTimestamp), [unlockTimestamp]);
  const depositDate = useMemo(
    () => dayjs(depositTimestamp),
    [depositTimestamp]
  );
  const amountStaked = parseFloat(stake.amountStaked) / 1e18;
  const interestPaid = parseFloat(stake.interestPaid) / 1e18;

  // Format lock duration, removing zero values
  const formattedLockDuration = useMemo(() => {
    const dur = dayjs.duration(parseInt(stake.lockDuration), "seconds");
    const parts: string[] = [];

    const days = Math.floor(dur.asDays());
    const hours = dur.hours();
    const minutes = dur.minutes();
    const seconds = dur.seconds();

    if (days > 0) parts.push(`${days} days`);
    if (hours > 0) parts.push(`${hours} hours`);
    if (minutes > 0) parts.push(`${minutes} minutes`);
    if (seconds > 0) parts.push(`${seconds} seconds`);

    return parts.length > 0 ? parts.join(" ") : "0s";
  }, [stake.lockDuration]);

  // Progress state for real-time updates
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateCountdown = () => {
      const now = dayjs();
      const unlocked = unlockDate.isBefore(now);
      setIsUnlocked(unlocked);

      // Calculate progress percentage
      if (!isWithdrawn && !unlocked) {
        const totalDuration = unlockDate.diff(depositDate);
        const elapsed = now.diff(depositDate);
        const progressPercent = Math.min(
          100,
          Math.max(0, (elapsed / totalDuration) * 100)
        );
        setProgress(progressPercent);
      } else if (unlocked && !isWithdrawn) {
        setProgress(100);
      }

      if (isWithdrawn) {
        setTimeRemaining("—");
        return;
      }

      const diff = Math.max(0, unlockDate.diff(now));
      const dur = dayjs.duration(diff);

      const days = Math.floor(dur.asDays());
      const hours = dur.hours();
      const minutes = dur.minutes();
      const seconds = dur.seconds();

      // Always show countdown down to the second
      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [unlockDate, depositDate, isWithdrawn]);

  // Trigger animation when isNew becomes true
  useEffect(() => {
    if (isNew) {
      // Use requestAnimationFrame to avoid synchronous setState
      const rafId = requestAnimationFrame(() => {
        setShouldAnimate(true);
      });
      // Auto-remove animation class after animation completes
      const timer = setTimeout(() => setShouldAnimate(false), 3000);
      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timer);
      };
    } else {
      // Use requestAnimationFrame to avoid synchronous setState
      requestAnimationFrame(() => {
        setShouldAnimate(false);
      });
    }
  }, [isNew]);

  // Handle withdrawal success
  useEffect(() => {
    if (isWithdrawingConfirmed && withdrawingHash) {
      toast.success("Withdrawal successful!");
      confettiExplosion();
      setWithdrawingHash(undefined);

      // Wait a couple seconds and then refetch stakes
      if (onWithdrawSuccess) {
        setTimeout(() => {
          void onWithdrawSuccess();
        }, 2000);
      }
    }
  }, [isWithdrawingConfirmed, withdrawingHash, onWithdrawSuccess]);

  // Handle withdrawal error
  useEffect(() => {
    if (isWithdrawingError && withdrawingError) {
      const message =
        withdrawingError instanceof Error
          ? withdrawingError.message
          : "Transaction failed";
      toast.error(message);
      setWithdrawingHash(undefined);
    }
  }, [isWithdrawingError, withdrawingError]);

  const handleWithdraw = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    setIsWithdrawing(true);
    try {
      const hash = await writeContractAsync({
        address: stake.vaultAddress as Address,
        abi: dapperAbi,
        functionName: "unstake",
        args: [BigInt(stake.stakeId)],
      });
      setWithdrawingHash(hash);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit withdraw";
      toast.error(message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <Card
      className={`p-5 bg-card/80 backdrop-blur border-2 transition-all relative overflow-hidden group ${
        shouldAnimate
          ? "new-stake-animate border-primary"
          : "border-border hover:border-primary/50"
      }`}
    >
      {/* Animated gradient overlay for new stakes */}
      {shouldAnimate && (
        <div className="absolute inset-0 bg-linear-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse pointer-events-none rounded-lg" />
      )}
      {/* Gradient overlay effect */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Progress bar at top */}
      {!isWithdrawn && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-border overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              isUnlocked || progress >= 100
                ? "bg-linear-to-r from-green-500/50 via-green-500 to-green-500/50"
                : "bg-linear-to-r from-primary/50 via-primary to-primary/50"
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
      {isWithdrawn && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-border overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-green-500/50 via-green-500 to-green-500/50 transition-all duration-1000"
            style={{ width: "100%" }}
          />
        </div>
      )}

      <div className="relative space-y-4">
        {/* Row 1: Main info */}
        <div className="flex items-center justify-between gap-4">
          {/* Left side: Amount and Interest */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Avatar className="mb-2">
                <AvatarImage
                  src={depositToken?.icon}
                  alt={depositToken?.symbol}
                />
                <AvatarFallback>{depositToken?.symbol}</AvatarFallback>
              </Avatar>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-2xl text-foreground">
                  {toSignificant(amountStaked)}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {depositToken?.symbol}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-primary">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="font-medium">
                +{toSignificant(interestPaid)} {depositToken?.symbol} interest
                earned
              </span>
            </div>
          </div>

          {/* Right side: Button and Countdown */}
          <div className="flex flex-col items-end gap-1.5">
            {!isWithdrawn && (
              <Button
                size="sm"
                className="glow-effect shrink-0"
                onClick={handleWithdraw}
                disabled={
                  !isUnlocked || isWithdrawing || isWithdrawingConfirming
                }
              >
                {isWithdrawing || isWithdrawingConfirming ? (
                  <Spinner className="mr-2 w-3.5 h-3.5" />
                ) : null}
                {isWithdrawing || isWithdrawingConfirming
                  ? "Processing"
                  : "Unstake"}
              </Button>
            )}
            {isWithdrawn && (
              <span className="px-3 flex items-center gap-2 py-1.5 text-xs font-medium bg-muted rounded-md border border-border">
                <Check className="w-3.5 h-3.5 text-green-500" /> Withdrawn
              </span>
            )}
            <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeRemaining}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Additional details */}
        <div className="pt-3 border-t border-border/50">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Deposited
                </span>
              </div>
              <div className="font-medium text-foreground">
                {depositDate.format("MMM DD, YYYY")}
              </div>
              <div className="text-xs text-muted-foreground">
                {depositDate.format("HH:mm")}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Lock Period
                </span>
              </div>
              <div className="font-medium text-foreground">
                {formattedLockDuration}
              </div>
              {!isWithdrawn && !isUnlocked && (
                <div className="text-xs text-primary">
                  {Math.round(progress)}% complete
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Unlocks
                </span>
              </div>
              <div className="font-medium text-foreground">
                {unlockDate.format("MMM DD, YYYY")}
              </div>
              <div className="text-xs text-muted-foreground">
                {unlockDate.format("HH:mm")}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              {(() => {
                const explorerBase = process.env.NEXT_PUBLIC_EXPLORER_BASE;
                if (!explorerBase) return null;

                const renderTxLink = (txHash: string, label: string) => {
                  if (!txHash) return null;
                  const truncatedHash = `${txHash.slice(0, 6)}...${txHash.slice(
                    -6
                  )}`;
                  const explorerUrl = `${explorerBase}/tx/${txHash}`;

                  return (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground font-medium shrink-0">
                        {label}:
                      </span>
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-mono text-xs text-primary hover:underline transition-colors"
                      >
                        <span className="truncate">{truncatedHash}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  );
                };

                return (
                  <div className="flex flex-col gap-1.5">
                    {renderTxLink(stake.depositTxHash, "Deposit Tx")}
                    {renderTxLink(stake.withdrawTxHash, "Withdraw Tx")}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Overlay */}
      {(isWithdrawing || isWithdrawingConfirming) &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in-0 duration-300" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-6 animate-in fade-in-0 zoom-in-95 duration-300">
              {/* Animated Spinner Container */}
              <div className="relative">
                {/* Outer pulsing ring */}
                <div
                  className="absolute inset-0 rounded-full bg-primary/20 animate-ping"
                  style={{ animationDuration: "2s" }}
                />
                <div
                  className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"
                  style={{ animationDuration: "1.5s" }}
                />

                {/* Spinner */}
                <div className="relative w-20 h-20 rounded-full bg-card border-4 border-primary/20 flex items-center justify-center shadow-2xl">
                  <Spinner className="w-10 h-10 text-primary" />
                </div>
              </div>

              {/* Status Text */}
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                  {isWithdrawing
                    ? "Submitting Transaction..."
                    : "Confirming Transaction..."}
                </h3>
                <p className="text-white/90 text-lg drop-shadow-md">
                  {isWithdrawing
                    ? "Please confirm the transaction in your wallet"
                    : "Waiting for blockchain confirmation"}
                </p>
                {withdrawingHash && (
                  <div className="mt-4 text-sm text-white/80 font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <span>Transaction:</span>
                      <span className="text-primary truncate max-w-xs font-semibold">
                        {withdrawingHash.slice(0, 10)}...
                        {withdrawingHash.slice(-8)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress indicator dots */}
              <div className="flex gap-2">
                <div
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "0s", animationDuration: "1.4s" }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "0.2s", animationDuration: "1.4s" }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: "0.4s", animationDuration: "1.4s" }}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </Card>
  );
}
