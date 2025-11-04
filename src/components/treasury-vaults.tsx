"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  formatEther,
  formatUnits,
  parseUnits,
  erc20Abi,
  maxUint256,
  type Address,
} from "viem";
import {
  ExternalLink,
  TrendingUp,
  Clock,
  Coins,
  Wallet,
  ArrowRight,
} from "lucide-react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { TOKENS } from "@/lib/constants";
import { vaultAbi } from "@/lib/abis";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toSignificant } from "@/lib/utils";
import Link from "next/link";
import { createPortal } from "react-dom";
import { getTreasuries } from "@/server/get";
import { LoaderFive, LoaderThree } from "./loaders";

dayjs.extend(relativeTime);

type TreasuryVault = {
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
};

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimeAgo(timestamp: number) {
  return dayjs(timestamp * 1000).fromNow();
}

function TreasuryCard({
  treasury,
  symbol,
  name,
}: {
  treasury: TreasuryVault;
  symbol: string;
  name: string;
}) {
  const { address, isConnected } = useAccount();
  const vaultAddress = treasury.id as Address;
  const tokenAddress = treasury.tokenAddress as Address;
  const token = TOKENS.find(
    (token) =>
      token.address.toLowerCase() === treasury.tokenAddress.toLowerCase()
  );

  const [depositAmount, setDepositAmount] = useState("");
  const [redeemShares, setRedeemShares] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [depositHash, setDepositHash] = useState<`0x${string}` | undefined>();
  const [redeemHash, setRedeemHash] = useState<`0x${string}` | undefined>();
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>();
  const [isApproving, setIsApproving] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);

  const { writeContractAsync } = useWriteContract();

  // Get token balance
  const { data: tokenBalance } = useBalance({
    address: address,
    token: tokenAddress,
  });

  // Get user's share balance in vault
  const { data: shareBalance, refetch: refetchShares } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: "balanceOf",
    args: [address as Address],
    query: {
      enabled: !!address && !!vaultAddress,
    },
  });

  useEffect(() => {
    console.log("shareBalance", shareBalance);
  }, [shareBalance]);

  // Get allowance for deposit
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as Address, vaultAddress],
    query: {
      enabled: !!address && !!tokenAddress && !!vaultAddress,
    },
  });

  // Get preview of shares for deposit
  const { data: previewShares } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: "previewDeposit",
    args: depositAmount
      ? [parseUnits(depositAmount, tokenBalance?.decimals ?? 18)]
      : undefined,
    query: {
      enabled: !!depositAmount && !!tokenBalance && Number(depositAmount) > 0,
    },
  });

  // Get preview of assets for redeem
  const { data: previewAssets } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: "previewRedeem",
    args: redeemShares ? [parseUnits(redeemShares, 18)] : undefined,
    query: {
      enabled: !!redeemShares && Number(redeemShares) > 0,
    },
  });

  // Get total assets in vault
  const { data: totalAssets } = useReadContract({
    address: vaultAddress,
    abi: vaultAbi,
    functionName: "totalAssets",
    query: {
      enabled: !!vaultAddress,
    },
  });

  // Transaction status
  const { isLoading: isDepositConfirming, isSuccess: isDepositConfirmed } =
    useWaitForTransactionReceipt({ hash: depositHash });
  const { isLoading: isRedeemConfirming, isSuccess: isRedeemConfirmed } =
    useWaitForTransactionReceipt({ hash: redeemHash });
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } =
    useWaitForTransactionReceipt({ hash: approvalHash });

  const lifetimeValue = formatEther(BigInt(treasury.lifetimeValueContributed));
  const recentContributions = treasury.contributions.slice(0, 10); // Show last 10

  const handleDepositMax = () => {
    if (tokenBalance) {
      setDepositAmount(formatUnits(tokenBalance.value, tokenBalance.decimals));
    }
  };

  const handleRedeemMax = () => {
    if (shareBalance && typeof shareBalance === "bigint") {
      setRedeemShares(formatUnits(shareBalance, 18));
    }
  };

  const handleDeposit = useCallback(
    async (bypassApprovalCheck: boolean = false) => {
      if (!isConnected) {
        toast.error("Please connect your wallet first");
        return;
      }
      if (!depositAmount || Number(depositAmount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const decimals = tokenBalance?.decimals ?? 18;
      const required = parseUnits(depositAmount, decimals);
      const currentAllowance = (allowance as bigint | undefined) ?? BigInt(0);

      if (!bypassApprovalCheck && currentAllowance < required) {
        toast.error("Insufficient allowance");
        return;
      }

      setIsDepositing(true);
      try {
        const hash = await writeContractAsync({
          address: vaultAddress,
          abi: vaultAbi,
          functionName: "deposit",
          args: [required, address as Address],
        });
        setDepositHash(hash);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to deposit";
        toast.error(message);
      } finally {
        setIsDepositing(false);
      }
    },
    [
      isConnected,
      depositAmount,
      tokenBalance,
      allowance,
      vaultAddress,
      address,
      writeContractAsync,
    ]
  );

  // Handle approval success
  useEffect(() => {
    if (isApprovalConfirmed) {
      void refetchAllowance();
      if (isApprovalOpen) setIsApprovalOpen(false);
      toast.success("Approval successful");
      setApprovalHash(undefined);

      // Trigger deposit after approval if amount is set
      if (depositAmount && Number(depositAmount) > 0) {
        setTimeout(() => {
          void handleDeposit(true);
        }, 1000);
      }
    }
  }, [
    isApprovalConfirmed,
    isApprovalOpen,
    refetchAllowance,
    depositAmount,
    handleDeposit,
  ]);

  // Handle deposit success
  useEffect(() => {
    if (isDepositConfirmed) {
      toast.success("Deposit successful!");
      setDepositAmount("");
      void refetchShares();
      void refetchAllowance();
      setDepositHash(undefined);
    }
  }, [isDepositConfirmed, refetchShares, refetchAllowance]);

  // Handle redeem success
  useEffect(() => {
    if (isRedeemConfirmed) {
      toast.success("Redeem successful!");
      setRedeemShares("");
      void refetchShares();
      setRedeemHash(undefined);
    }
  }, [isRedeemConfirmed, refetchShares]);

  const handleRedeem = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!redeemShares || Number(redeemShares) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const shares = parseUnits(redeemShares, 18);
    const userShares =
      shareBalance && typeof shareBalance === "bigint"
        ? shareBalance
        : BigInt(0);

    if (shares > userShares) {
      toast.error("Insufficient shares");
      return;
    }

    setIsRedeeming(true);
    try {
      const hash = await writeContractAsync({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: "redeem",
        args: [shares, address as Address, address as Address],
      });
      setRedeemHash(hash);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to redeem";
      toast.error(message);
    } finally {
      setIsRedeeming(false);
    }
  };

  // Calculate if approval is needed - use useMemo to ensure reactivity
  const needsApproval = useMemo(() => {
    if (!depositAmount || !tokenBalance || Number(depositAmount) <= 0)
      return false;

    // If allowance hasn't loaded yet, assume we need approval if we have an amount
    if (allowance === undefined || allowance === null) {
      return true; // Safe default: assume approval needed if we don't know
    }

    try {
      const required = parseUnits(depositAmount, tokenBalance.decimals);
      const currentAllowance =
        typeof allowance === "bigint" ? allowance : BigInt(0);
      return currentAllowance < required;
    } catch {
      // If parsing fails, assume approval needed
      return true;
    }
  }, [depositAmount, tokenBalance, allowance]);

  return (
    <Card className="border-primary/20 bg-card/50 p-8 backdrop-blur-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">
            Vault {symbol == "BTC" ? "2" : "1"}
          </p>
          <h3 className="mb-2 font-bold text-2xl text-foreground">
            {name} Treasury
          </h3>
          <div className="flex flex-col">
            <Link
              href={`${process.env.NEXT_PUBLIC_EXPLORER_BASE}/address/${treasury.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-muted-foreground text-xs hover:underline"
            >
              Vault: {formatAddress(treasury.id)}
            </Link>
            <Link
              href={`${process.env.NEXT_PUBLIC_EXPLORER_BASE}/address/${treasury.tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-muted-foreground text-xs hover:underline"
            >
              Deposit Token: {formatAddress(treasury.tokenAddress)}
            </Link>
          </div>
        </div>
        <div className="rounded-full border border-primary/30 bg-primary/10 p-4">
          <Avatar>
            <AvatarImage src={token?.icon} alt={token?.symbol} />
            <AvatarFallback>{token?.symbol}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-muted-foreground text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            Lifetime Contributions
          </div>
          <div className="font-bold text-lg text-primary">
            {Number.parseFloat(lifetimeValue).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}{" "}
            {symbol}
          </div>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-muted-foreground text-xs">
            <Coins className="h-3.5 w-3.5" />
            Total Contributions
          </div>
          <div className="font-bold text-lg text-foreground">
            {treasury.contributions.length}
          </div>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-muted-foreground text-xs">
            <Wallet className="h-3.5 w-3.5" />
            Total Assets
          </div>
          <div className="font-bold text-lg text-foreground">
            {totalAssets && typeof totalAssets === "bigint"
              ? Number.parseFloat(
                  formatUnits(totalAssets, tokenBalance?.decimals ?? 18)
                ).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })
              : "0.00"}{" "}
            {symbol}
          </div>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-muted-foreground text-xs">
            <Clock className="h-3.5 w-3.5" />
            Last contribution
          </div>
          <div className="font-bold text-lg text-foreground">
            {recentContributions.length > 0
              ? getTimeAgo(recentContributions[0].contributionTimestamp)
              : "N/A"}
          </div>
        </div>
      </div>

      {/* Deposit & Redeem Interface */}
      <div className="mb-8">
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-sm">
            <TabsTrigger
              value="deposit"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              Deposit
            </TabsTrigger>
            <TabsTrigger
              value="redeem"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              Redeem Shares
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount" className="text-foreground">
                  Amount to Deposit
                </Label>
                <div className="relative">
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="h-12 border-primary/30 bg-background/50 pr-20 font-mono backdrop-blur-sm focus:border-primary"
                  />
                  <span className="absolute top-1/2 right-4 -translate-y-1/2 font-semibold text-muted-foreground">
                    {symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={handleDepositMax}
                    disabled={!isConnected || !tokenBalance}
                    className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Max:{" "}
                    {isConnected && tokenBalance
                      ? formatUnits(
                          tokenBalance.value,
                          tokenBalance.decimals
                        ).slice(0, 8)
                      : "0.00"}
                  </button>
                  {previewShares &&
                  depositAmount &&
                  typeof previewShares === "bigint" ? (
                    <span className="text-muted-foreground">
                      You&apos;ll receive:{" "}
                      {formatUnits(previewShares, 18).slice(0, 8)} shares
                    </span>
                  ) : null}
                </div>
              </div>

              {!isConnected ? (
                <Button disabled className="w-full gap-2">
                  <Wallet className="h-4 w-4" />
                  Connect Wallet to Deposit
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : !depositAmount || Number(depositAmount) <= 0 ? (
                <Button disabled className="w-full gap-2">
                  <Wallet className="h-4 w-4" />
                  Enter amount
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : needsApproval ? (
                <Dialog open={isApprovalOpen} onOpenChange={setIsApprovalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full gap-2"
                      onClick={() => setIsApprovalOpen(true)}
                    >
                      <TrendingUp className="h-4 w-4" />
                      Approve {depositAmount} {symbol}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Approve spending</DialogTitle>
                      <DialogDescription>
                        The vault needs permission to spend your {symbol}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Current allowance
                        </span>
                        <span className="font-medium">
                          {tokenBalance && allowance
                            ? toSignificant(
                                formatUnits(
                                  (allowance as bigint) ?? BigInt(0),
                                  tokenBalance.decimals
                                )
                              )
                            : "0"}{" "}
                          {symbol}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Requested amount
                        </span>
                        <span className="font-medium">
                          {toSignificant(depositAmount)} {symbol}
                        </span>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                      </DialogClose>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className="min-w-40"
                            disabled={isApproving || isApprovalConfirming}
                          >
                            {isApproving || isApprovalConfirming ? (
                              <Spinner className="mr-2 w-4 h-4" />
                            ) : (
                              <TrendingUp className="mr-2 w-4 h-4" />
                            )}
                            {isApproving || isApprovalConfirming
                              ? "Processing"
                              : "Approve"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-48">
                          <DropdownMenuItem
                            className="font-semibold text-primary bg-primary/10 focus:bg-primary/20"
                            onClick={async () => {
                              setIsApproving(true);
                              try {
                                const hash = await writeContractAsync({
                                  address: tokenAddress,
                                  abi: erc20Abi,
                                  functionName: "approve",
                                  args: [vaultAddress, maxUint256],
                                });
                                setApprovalHash(hash);
                              } catch (err) {
                                const message =
                                  err instanceof Error
                                    ? err.message
                                    : "Approval failed";
                                toast.error(message);
                              } finally {
                                setIsApproving(false);
                              }
                            }}
                          >
                            Approve Max
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              setIsApproving(true);
                              try {
                                const decimals = tokenBalance?.decimals ?? 18;
                                const reqAmt = depositAmount
                                  ? parseUnits(depositAmount, decimals)
                                  : BigInt(0);
                                const hash = await writeContractAsync({
                                  address: tokenAddress,
                                  abi: erc20Abi,
                                  functionName: "approve",
                                  args: [vaultAddress, reqAmt],
                                });
                                setApprovalHash(hash);
                              } catch (err) {
                                const message =
                                  err instanceof Error
                                    ? err.message
                                    : "Approval failed";
                                toast.error(message);
                              } finally {
                                setIsApproving(false);
                              }
                            }}
                          >
                            {`Approve ${toSignificant(
                              depositAmount
                            )} ${symbol}`}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  onClick={() => {
                    if (needsApproval) {
                      setIsApprovalOpen(true);
                      return;
                    }
                    void handleDeposit();
                  }}
                  disabled={
                    isDepositing || isDepositConfirming || needsApproval
                  }
                  className="w-full gap-2"
                >
                  {isDepositing || isDepositConfirming ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  {isDepositing || isDepositConfirming
                    ? "Processing"
                    : `Deposit ${depositAmount || "0"} ${symbol}`}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="redeem" className="mt-6">
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="mb-2 text-muted-foreground text-sm">
                  Your Shares
                </div>
                <div className="font-bold text-2xl text-foreground">
                  {shareBalance && typeof shareBalance === "bigint"
                    ? formatUnits(shareBalance, 18).slice(0, 8)
                    : "0.00"}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="redeem-shares" className="text-foreground">
                  Shares to Redeem
                </Label>
                <div className="relative">
                  <Input
                    id="redeem-shares"
                    type="number"
                    placeholder="0.00"
                    value={redeemShares}
                    onChange={(e) => setRedeemShares(e.target.value)}
                    className="h-12 border-primary/30 bg-background/50 pr-20 font-mono backdrop-blur-sm focus:border-primary"
                  />
                  <span className="absolute top-1/2 right-4 -translate-y-1/2 font-semibold text-muted-foreground">
                    Shares
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={handleRedeemMax}
                    disabled={
                      !isConnected ||
                      !shareBalance ||
                      (typeof shareBalance === "bigint" &&
                        shareBalance === BigInt(0))
                    }
                    className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Max
                  </button>
                  {previewAssets &&
                  redeemShares &&
                  typeof previewAssets === "bigint" ? (
                    <span className="text-muted-foreground">
                      You&apos;ll receive:{" "}
                      {formatUnits(
                        previewAssets,
                        tokenBalance?.decimals ?? 18
                      ).slice(0, 8)}{" "}
                      {symbol}
                    </span>
                  ) : null}
                </div>
              </div>

              <Button
                onClick={handleRedeem}
                disabled={
                  !isConnected ||
                  !redeemShares ||
                  Number(redeemShares) <= 0 ||
                  isRedeeming ||
                  isRedeemConfirming
                }
                className="w-full gap-2"
              >
                <Wallet className="h-4 w-4" />
                {isRedeeming || isRedeemConfirming ? "Redeeming..." : "Redeem"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Recent Contributions */}
      <div>
        <h4 className="mb-4 font-semibold text-foreground text-lg">
          Recent Contributions
        </h4>
        {recentContributions.length === 0 ? (
          <div className="rounded-lg border border-primary/20 bg-background/50 p-6 text-center">
            <p className="text-muted-foreground">No contributions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentContributions.map((contribution) => {
              const amount = formatEther(BigInt(contribution.amount));
              const amountStaked = formatEther(
                BigInt(contribution.stake.amountStaked)
              );
              const interestPaid = formatEther(
                BigInt(contribution.stake.interestPaid)
              );

              return (
                <div
                  key={contribution.id}
                  className="rounded-lg border border-primary/20 bg-background/50 p-4 transition-all hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {Number.parseFloat(amount).toLocaleString(
                              undefined,
                              {
                                maximumFractionDigits: 4,
                              }
                            )}{" "}
                            {symbol}
                          </span>
                          {process.env.NEXT_PUBLIC_EXPLORER_BASE && (
                            <a
                              href={`${process.env.NEXT_PUBLIC_EXPLORER_BASE}/tx/${contribution.contributionTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="mb-1 text-left text-muted-foreground text-sm hover:text-primary transition-colors cursor-pointer">
                              {getTimeAgo(contribution.contributionTimestamp)}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              {formatTimestamp(
                                contribution.contributionTimestamp
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="mt-2 grid gap-2 text-xs md:grid-cols-3">
                        <div>
                          <span className="text-muted-foreground">
                            Stake Amount:
                          </span>{" "}
                          <span className="font-medium text-foreground">
                            {Number.parseFloat(amountStaked).toLocaleString(
                              undefined,
                              { maximumFractionDigits: 4 }
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Interest Paid:
                          </span>{" "}
                          <span className="font-medium text-foreground">
                            {Number.parseFloat(interestPaid).toLocaleString(
                              undefined,
                              { maximumFractionDigits: 4 }
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">User:</span>{" "}
                          <span className="font-mono font-medium text-foreground">
                            {formatAddress(contribution.stake.user_id)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deposit Overlay */}
      {(isDepositing || isDepositConfirming) &&
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
                  {isDepositing
                    ? "Submitting Deposit..."
                    : "Confirming Deposit..."}
                </h3>
                <p className="text-white/90 text-lg drop-shadow-md">
                  {isDepositing
                    ? "Please confirm the transaction in your wallet"
                    : "Waiting for blockchain confirmation"}
                </p>
                {depositHash && (
                  <div className="mt-4 text-sm text-white/80 font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <span>Transaction:</span>
                      <span className="text-primary truncate max-w-xs font-semibold">
                        {depositHash.slice(0, 10)}...{depositHash.slice(-8)}
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

      {/* Redeem Overlay */}
      {(isRedeeming || isRedeemConfirming) &&
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
                  {isRedeeming
                    ? "Submitting Redeem..."
                    : "Confirming Redeem..."}
                </h3>
                <p className="text-white/90 text-lg drop-shadow-md">
                  {isRedeeming
                    ? "Please confirm the transaction in your wallet"
                    : "Waiting for blockchain confirmation"}
                </p>
                {redeemHash && (
                  <div className="mt-4 text-sm text-white/80 font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <span>Transaction:</span>
                      <span className="text-primary truncate max-w-xs font-semibold">
                        {redeemHash.slice(0, 10)}...{redeemHash.slice(-8)}
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

export function TreasuryVaults() {
  const [treasuries, setTreasuries] = useState<{
    musdTreasury: TreasuryVault;
    btcTreasury: TreasuryVault;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTreasuries = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTreasuries();
      setTreasuries(data);
    } catch (err) {
      console.error("Failed to fetch treasuries:", err);
      toast.error("Failed to load treasuries");
      setTreasuries(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTreasuries();
  }, [fetchTreasuries]);

  return (
    <section className="relative py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-6xl text-center">
          <h2 className="mb-4 font-bold text-4xl text-foreground md:text-5xl">
            Treasury Vaults
          </h2>
          <p className="text-balance text-muted-foreground text-lg leading-relaxed">
            Track contributions and lifetime value for each treasury vault
          </p>
        </div>

        {isLoading ? (
          <div className="mx-auto max-w-6xl flex items-center justify-center py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <LoaderThree />
              <LoaderFive text="Loading treasury vaults..." />
            </div>
          </div>
        ) : treasuries ? (
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
            <TreasuryCard
              treasury={treasuries.musdTreasury}
              symbol="MUSD"
              name="MUSD"
            />
            <TreasuryCard
              treasury={treasuries.btcTreasury}
              symbol="BTC"
              name="Bitcoin"
            />
          </div>
        ) : (
          <div className="mx-auto max-w-6xl text-center py-12 text-muted-foreground">
            Failed to load treasuries
          </div>
        )}
      </div>
    </section>
  );
}
