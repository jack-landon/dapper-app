"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, TrendingUp, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { erc20Abi, formatUnits, maxUint256, parseUnits } from "viem";
import dayjs from "dayjs";
import { dapperAbi } from "@/lib/abis";
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
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { DURATIONS, TOKENS } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getUser } from "@/server/get";
import { StakeCard } from "./stake-card";
import {
  confettiExplosion,
  scrollToStakingSection,
  toSignificant,
} from "@/lib/utils";
import { createPortal } from "react-dom";
import { Badge } from "./ui/badge";
import LogoHeader from "./LogoHeader";

type Props = {
  showLogoHeader?: boolean;
};

export function StakingInterface({ showLogoHeader = false }: Props) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [selectedToken, setSelectedToken] = useState<Token>(TOKENS[0]);
  const [amount, setAmount] = useState("");
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [durationValue, setDurationValue] = useState<string>("90");
  const [durationUnit, setDurationUnit] = useState<
    "days" | "hours" | "minutes"
  >("days");
  const [isApproving, setIsApproving] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>(
    undefined
  );
  const [isStaking, setIsStaking] = useState(false);
  const [stakingHash, setStakingHash] = useState<`0x${string}` | undefined>(
    undefined
  );
  const [userStakes, setUserStakes] = useState<
    Awaited<ReturnType<typeof getUser>>
  >([]);
  const [isLoadingStakes, setIsLoadingStakes] = useState(false);
  const [activeTab, setActiveTab] = useState("stake");
  const [newestStakeId, setNewestStakeId] = useState<string | null>(null);

  // Token balance (ERC20) from selected token address
  const { data: balance } = useBalance({
    address: address,
    token: selectedToken.address as Address | undefined,
  });

  // Allowance for the vault to spend user's token
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract(
    {
      address: selectedToken.address as Address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [address as Address, selectedToken.vaultAddress],
      query: {
        enabled: !!address && !!selectedToken.vaultAddress,
      },
    }
  );

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } =
    useWaitForTransactionReceipt({ hash: approvalHash });
  const { isLoading: isStakingConfirming, isSuccess: isStakingConfirmed } =
    useWaitForTransactionReceipt({ hash: stakingHash });

  // Convert duration value and unit to seconds
  const getDurationInSeconds = () => {
    if (!durationValue || isNaN(Number(durationValue))) return 0;
    const value = Number(durationValue);
    switch (durationUnit) {
      case "hours":
        return value * 3600; // hours to seconds
      case "minutes":
        return value * 60; // minutes to seconds
      default:
        return value * 86400; // days to seconds
    }
  };

  // Convert seconds to days for display purposes (unlock date)
  const getDurationInDays = () => {
    return getDurationInSeconds() / 86400;
  };

  const calculateInstantYield = () => {
    if (!amount || isNaN(Number(amount))) return "0.00";
    const principal = Number(amount);
    const seconds = getDurationInSeconds();
    const apy = selectedToken.apy;
    const yield_ = (principal * apy * seconds) / (365 * 24 * 3600 * 100); // APY * seconds / seconds in a year * 100
    return toSignificant(yield_);
  };

  const handleMaxClick = () => {
    if (balance) {
      setAmount(formatUnits(balance.value, balance.decimals));
    }
  };

  // When approval confirms, refetch allowance, close modal, notify success, and trigger stake
  useEffect(() => {
    if (!isApprovalConfirmed) return;
    void refetchAllowance?.();
    if (isApprovalOpen) setIsApprovalOpen(false);
    toast.success("Approval successful");
    setApprovalHash(undefined);

    // Trigger stake after approval - wait a bit for allowance to update
    if (amount && Number(amount) > 0) {
      setTimeout(() => {
        void handleStake(true);
      }, 1000);
    }
  }, [isApprovalConfirmed, isApprovalOpen, refetchAllowance, amount]);

  // Fetch user stakes when address is available
  const fetchUserStakes = useCallback(async () => {
    if (!address) {
      setUserStakes([]);
      return [];
    }
    setIsLoadingStakes(true);
    try {
      const stakes = await getUser(address);
      setUserStakes(stakes);
      return stakes;
    } catch (err) {
      console.error("Failed to fetch user stakes:", err);
      toast.error("Failed to load stakes");
      setUserStakes([]);
      return [];
    } finally {
      setIsLoadingStakes(false);
    }
  }, [address]);

  useEffect(() => {
    if (!isStakingConfirmed) return;
    const hash = stakingHash; // Save hash before clearing
    toast.success("Stake successful");
    confettiExplosion();
    setStakingHash(undefined);
    // Refetch allowance after successful staking
    void refetchAllowance?.();
    // Refetch stakes after successful staking and switch to withdraw tab
    if (address) {
      void fetchUserStakes().then((stakes) => {
        // Mark the newest stake - try to match by transaction hash, otherwise use first stake
        if (stakes && stakes.length > 0) {
          let stakeToMark: (typeof stakes)[0] | undefined;
          if (hash) {
            stakeToMark = stakes.find((s) => s.depositTxHash === hash);
          }
          // If no match by hash, assume first stake is newest (assuming ordered by date)
          const targetStake = stakeToMark || stakes[0];
          setNewestStakeId(targetStake.id);
          // Clear the newest flag after animation completes (3 seconds)
          setTimeout(() => setNewestStakeId(null), 3000);
        }
      });
    }
    setActiveTab("withdraw");
    scrollToStakingSection();
  }, [isStakingConfirmed, address, fetchUserStakes, refetchAllowance]);

  useEffect(() => {
    void fetchUserStakes();
  }, [fetchUserStakes]);

  // Calculate stakes ready to be unstaked (unlocked but not withdrawn)
  const [readyStakesCount, setReadyStakesCount] = useState(0);

  useEffect(() => {
    const updateReadyCount = () => {
      if (!userStakes.length) {
        setReadyStakesCount(0);
        return;
      }
      const now = Date.now();
      const count = userStakes.filter(
        (stake) =>
          !stake.withdrawTimestamp &&
          parseInt(stake.unlockTimestamp) * 1000 < now
      ).length;
      setReadyStakesCount(count);
    };

    updateReadyCount();
    // Update every second to reflect real-time unlock status
    const interval = setInterval(updateReadyCount, 1000);
    return () => clearInterval(interval);
  }, [userStakes]);

  const handleStake = async (bypassApprovalCheck: boolean = false) => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const decimals = balance?.decimals ?? 18;
    const required = parseUnits(amount, decimals);
    const allowance = (currentAllowance as bigint | undefined) ?? BigInt(0);
    if (!bypassApprovalCheck && allowance < required) {
      // Modal flow will handle approval; prevent accidental deposit attempt
      return toast.error("Insufficient allowance");
    }

    setIsStaking(true);
    try {
      const secondsForStake = getDurationInSeconds();
      const hash = await writeContractAsync({
        address: selectedToken.vaultAddress,
        abi: dapperAbi,
        functionName: "stake",
        args: [required, BigInt(Math.floor(secondsForStake))],
      });
      setStakingHash(hash);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit stake";
      toast.error(message);
    } finally {
      setIsStaking(false);
    }
  };

  return (
    <section
      id="staking-section"
      className="relative py-24 border-b border-border"
    >
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="relative container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex flex-col items-center justify-center">
              {showLogoHeader && <LogoHeader />}
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Get Future Yield <span className="text-primary">Instantly</span>
              </h2>
            </div>
            <p className="text-lg text-muted-foreground">
              Choose your token, set your duration, and receive your yield
              immediately
            </p>
          </div>

          <Card className="p-8 bg-card/80 backdrop-blur border-2 border-border glow-effect">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="stake" className="text-lg">
                  Stake
                </TabsTrigger>
                <TabsTrigger value="withdraw" className="text-lg relative">
                  Withdraw
                  {readyStakesCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 min-w-5 px-1.5 text-xs flex items-center justify-center rounded-full bg-red-500 text-white border-0"
                    >
                      {readyStakesCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stake" className="space-y-6">
                {/* Token Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-bold">
                    1. Select Token To Deposit
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {TOKENS.map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => setSelectedToken(token)}
                        className={`p-4 cursor-pointer flex flex-col items-center rounded-lg border-2 transition-all ${
                          selectedToken.symbol === token.symbol
                            ? "border-primary bg-primary/10 glow-effect"
                            : "border-border hover:border-primary/50 bg-card"
                        }`}
                      >
                        <Avatar className="mb-2">
                          <AvatarImage src={token.icon} alt={token.symbol} />
                          <AvatarFallback>{token.symbol}</AvatarFallback>
                        </Avatar>
                        <div className="font-bold">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground">
                          {token.apy}% APY
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-3">
                  <Label htmlFor="amount" className="text-base font-bold">
                    2. Select Amount to Stake
                  </Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-2xl h-16 pr-24 bg-secondary border-border"
                    />
                    <div className="absolute flex items-center gap-2 right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                      <Image
                        src={selectedToken.icon}
                        alt={selectedToken.symbol}
                        width={24}
                        height={24}
                      />
                      <span>{selectedToken.symbol}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Balance:{" "}
                      {isConnected && balance
                        ? formatUnits(balance.value, balance.decimals).slice(
                            0,
                            8
                          )
                        : "0.00"}{" "}
                      {selectedToken.symbol}
                    </span>
                    <button
                      onClick={handleMaxClick}
                      disabled={!isConnected || !balance}
                      className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Max
                    </button>
                  </div>
                </div>

                {/* Duration Selection */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-bold">
                      3. Select Lock Duration
                    </Label>
                    {!isCustomDuration && (
                      <button
                        onClick={() => {
                          setIsCustomDuration(true);
                          setDurationValue("");
                          setDurationUnit("days");
                        }}
                        className="cursor-pointer text-sm text-primary hover:underline font-medium"
                      >
                        Add Custom duration
                      </button>
                    )}
                    {isCustomDuration && (
                      <button
                        onClick={() => {
                          setIsCustomDuration(false);
                          setDurationValue("90"); // Reset to default preset
                          setDurationUnit("days");
                        }}
                        className="cursor-pointer text-sm text-muted-foreground hover:underline font-medium"
                      >
                        Use Preset
                      </button>
                    )}
                  </div>
                  {!isCustomDuration ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {DURATIONS.map((dur) => (
                        <button
                          key={dur.days}
                          onClick={() => {
                            setDurationValue(dur.days.toString());
                            setDurationUnit("days");
                            setIsCustomDuration(false);
                          }}
                          className={`p-4 cursor-pointer rounded-lg border-2 transition-all ${
                            !isCustomDuration &&
                            durationValue === dur.days.toString() &&
                            durationUnit === "days"
                              ? "border-primary bg-primary/10 glow-effect"
                              : "border-border hover:border-primary/50 bg-card"
                          }`}
                        >
                          <div className="font-bold">{dur.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {selectedToken.apy}% APY
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder={`Enter number of ${durationUnit}`}
                          value={durationValue}
                          onChange={(e) => setDurationValue(e.target.value)}
                          className="text-xl h-14 pl-32 pr-20 bg-secondary border-2 border-border"
                          min="0"
                        />
                        <div className="absolute left-0 top-0 bottom-0 flex items-center">
                          <Select
                            value={durationUnit}
                            onValueChange={(
                              value: "days" | "hours" | "minutes"
                            ) => setDurationUnit(value)}
                          >
                            <SelectTrigger className="h-14 pl-3 pr-2 text-base border-0 border-r-2 border-none shadow-none bg-transparent rounded-r-none focus:ring-0 focus:ring-offset-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="days">Days</SelectItem>
                              <SelectItem value="hours">Hours</SelectItem>
                              <SelectItem value="minutes">Minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <button
                          onClick={() => {
                            setDurationValue("365");
                            setDurationUnit("days");
                          }}
                          className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-primary hover:underline text-sm font-medium"
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Yield Preview */}
                {amount && !isNaN(Number(amount)) && (
                  <div className="p-6 rounded-xl bg-blend-darken border border-border space-y-4">
                    <div className="space-y-2 pb-4 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-sm text-primary font-bold">
                            You Receive <span className="">Now</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Instant yield paid upfront
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-green-600">
                          +{calculateInstantYield()} {selectedToken.symbol}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            You Receive <span className="">on Unlock</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Original staked amount returned
                          </div>
                        </div>
                        <span className="text-xl font-bold">
                          {toSignificant(amount) || "0.00"}{" "}
                          {selectedToken.symbol}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2">
                        <span className="text-muted-foreground">
                          Unlock date
                        </span>
                        <span className="font-medium">
                          {dayjs()
                            .add(getDurationInDays(), "days")
                            .format("ddd DD MMM YYYY")}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Total Earnings
                        </span>
                        <span className="text-lg font-bold">
                          {toSignificant(
                            (amount && !isNaN(Number(amount))
                              ? Number(amount)
                              : 0) + Number(calculateInstantYield() || 0)
                          )}{" "}
                          {selectedToken.symbol}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {!isConnected ? (
                    <Button
                      size="lg"
                      className="flex-1 text-lg h-14 glow-effect font-bold"
                      disabled
                    >
                      <Wallet className="mr-2 w-5 h-5" />
                      Connect Wallet to Stake
                    </Button>
                  ) : (
                    (() => {
                      const decimals = balance?.decimals ?? 18;
                      const req = amount
                        ? parseUnits(amount, decimals)
                        : BigInt(0);
                      const allow =
                        (currentAllowance as bigint | undefined) ?? BigInt(0);
                      if (!amount || Number(amount) <= 0) {
                        return (
                          <Button
                            size="lg"
                            className="flex-1 text-lg h-14 glow-effect font-bold"
                            disabled
                          >
                            <TrendingUp className="mr-2 w-5 h-5" />
                            Enter amount
                          </Button>
                        );
                      }
                      if (
                        isCustomDuration &&
                        (!durationValue || Number(durationValue) <= 0)
                      ) {
                        return (
                          <Button
                            size="lg"
                            className="flex-1 text-lg h-14 glow-effect font-bold"
                            disabled
                          >
                            <TrendingUp className="mr-2 w-5 h-5" />
                            Enter duration
                          </Button>
                        );
                      }
                      if (allow < req) {
                        return (
                          <Dialog
                            open={isApprovalOpen}
                            onOpenChange={setIsApprovalOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="lg"
                                className="flex-1 text-lg h-14 glow-effect"
                                onClick={() => setIsApprovalOpen(true)}
                              >
                                <TrendingUp className="mr-2 w-5 h-5" />
                                {`Approve ${amount} ${selectedToken.symbol}`}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve spending</DialogTitle>
                                <DialogDescription>
                                  The vault needs permission to spend your{" "}
                                  {selectedToken.symbol}.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Current allowance
                                  </span>
                                  <span className="font-medium">
                                    {balance
                                      ? toSignificant(
                                          formatUnits(
                                            (currentAllowance as
                                              | bigint
                                              | undefined) ?? BigInt(0),
                                            balance.decimals
                                          )
                                        )
                                      : "0"}{" "}
                                    {selectedToken.symbol}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Requested amount
                                  </span>
                                  <span className="font-medium">
                                    {toSignificant(amount)}{" "}
                                    {selectedToken.symbol}
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
                                      disabled={
                                        isApproving || isApprovalConfirming
                                      }
                                    >
                                      {isApproving || isApprovalConfirming ? (
                                        <Spinner className="mr-2 w-5 h-5" />
                                      ) : (
                                        <TrendingUp className="mr-2 w-5 h-5" />
                                      )}
                                      {isApproving || isApprovalConfirming
                                        ? "Processing"
                                        : "Approve"}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="min-w-48"
                                  >
                                    <DropdownMenuItem
                                      className="font-semibold text-primary bg-primary/10 focus:bg-primary/20"
                                      onClick={async () => {
                                        setIsApproving(true);
                                        try {
                                          const hash = await writeContractAsync(
                                            {
                                              address:
                                                selectedToken.address as Address,
                                              abi: dapperAbi,
                                              functionName: "approve",
                                              args: [
                                                selectedToken.vaultAddress,
                                                maxUint256,
                                              ],
                                            }
                                          );
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
                                          const decimals =
                                            balance?.decimals ?? 18;
                                          const reqAmt = amount
                                            ? parseUnits(amount, decimals)
                                            : BigInt(0);
                                          const hash = await writeContractAsync(
                                            {
                                              address:
                                                selectedToken.address as Address,
                                              abi: dapperAbi,
                                              functionName: "approve",
                                              args: [
                                                selectedToken.vaultAddress,
                                                reqAmt,
                                              ],
                                            }
                                          );
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
                                      {`Approve ${toSignificant(amount)} ${
                                        selectedToken.symbol
                                      }`}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        );
                      }
                      return (
                        <Button
                          size="lg"
                          className="flex-1 text-lg h-14 glow-effect font-bold"
                          onClick={() => handleStake()}
                          disabled={isStaking || isStakingConfirming}
                        >
                          {isStaking || isStakingConfirming ? (
                            <Spinner className="mr-2 w-5 h-5" />
                          ) : (
                            <TrendingUp className="mr-2 w-5 h-5" />
                          )}
                          {isStaking || isStakingConfirming
                            ? "Processing"
                            : `Stake ${amount || "0"} ${selectedToken.symbol}`}
                        </Button>
                      );
                    })()
                  )}
                </div>
              </TabsContent>

              <TabsContent value="withdraw" className="space-y-6">
                {!isConnected ? (
                  <div className="text-center py-12">
                    <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold mb-2">
                      Connect Your Wallet
                    </h3>
                    <p className="text-muted-foreground">
                      Connect your wallet to view your stakes
                    </p>
                  </div>
                ) : isLoadingStakes ? (
                  <div className="text-center py-12">
                    <Spinner className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Loading your stakes...
                    </p>
                  </div>
                ) : userStakes.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold mb-2">No Active Stakes</h3>
                    <p className="text-muted-foreground">
                      Start staking to see your positions here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Active Stakes */}
                    {(() => {
                      const activeStakes = userStakes.filter(
                        (stake) => !stake.withdrawTimestamp
                      );
                      const claimedStakes = userStakes.filter(
                        (stake) => !!stake.withdrawTimestamp
                      );

                      return (
                        <>
                          {activeStakes.length > 0 ? (
                            <div className="space-y-3">
                              <h3 className="text-xl font-bold mb-4">
                                Active Stakes
                              </h3>
                              {activeStakes.map((stake) => (
                                <StakeCard
                                  key={stake.id}
                                  stake={stake}
                                  isNew={newestStakeId === stake.id}
                                  onWithdrawSuccess={fetchUserStakes}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                              <h3 className="text-lg font-bold mb-2">
                                You have no Active Stakes
                              </h3>
                              <Button
                                size="lg"
                                className="mt-4 glow-effect"
                                onClick={() => setActiveTab("stake")}
                              >
                                <TrendingUp className="mr-2 w-5 h-5" />
                                Create a Stake
                              </Button>
                            </div>
                          )}

                          {/* Claimed Stakes */}
                          {claimedStakes.length > 0 && (
                            <div className="space-y-3 pt-6 border-t border-border">
                              <h3 className="text-xl font-bold mb-4">
                                Claimed Stakes
                              </h3>
                              {claimedStakes.map((stake) => (
                                <StakeCard
                                  key={stake.id}
                                  stake={stake}
                                  isNew={false}
                                  onWithdrawSuccess={fetchUserStakes}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Staking Overlay */}
      {(isStaking || isStakingConfirming) &&
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
                  {isStaking
                    ? "Submitting Transaction..."
                    : "Confirming Transaction..."}
                </h3>
                <p className="text-white/90 text-lg drop-shadow-md">
                  {isStaking
                    ? "Please confirm the transaction in your wallet"
                    : "Waiting for blockchain confirmation"}
                </p>
                {stakingHash && (
                  <div className="mt-4 text-sm text-white/80 font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <span>Transaction:</span>
                      <span className="text-primary truncate max-w-xs font-semibold">
                        {stakingHash.slice(0, 10)}...{stakingHash.slice(-8)}
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
    </section>
  );
}
