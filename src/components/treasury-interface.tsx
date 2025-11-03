"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ArrowRight, Info, TrendingUp, Wallet } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";

const TOKENS = [
  { symbol: "ETH", name: "Ethereum", apy: 11.2, liquidity: 8420000 },
  { symbol: "USDC", name: "USD Coin", apy: 13.8, liquidity: 12300000 },
  { symbol: "BTC", name: "Bitcoin", apy: 10.5, liquidity: 2890000 },
  { symbol: "DAI", name: "Dai", apy: 14.2, liquidity: 1190000 },
];

export function TreasuryInterface() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });

  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [amount, setAmount] = useState("");

  const estimatedYield = amount
    ? ((Number.parseFloat(amount) * selectedToken.apy) / 100).toFixed(4)
    : "0.0000";
  const monthlyYield = amount
    ? ((Number.parseFloat(amount) * selectedToken.apy) / 100 / 12).toFixed(4)
    : "0.0000";

  const handleMaxClick = () => {
    if (balance) {
      setAmount(formatEther(balance.value));
    }
  };

  const handleDeposit = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    // TODO: Implement actual liquidity deposit logic with smart contract
    console.log("Depositing liquidity:", {
      amount,
      token: selectedToken.symbol,
    });
    alert(`Depositing ${amount} ${selectedToken.symbol} as liquidity`);
  };

  return (
    <section className="relative py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-sm">
              <TabsTrigger
                value="deposit"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                Deposit Liquidity
              </TabsTrigger>
              <TabsTrigger
                value="withdraw"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                Withdraw Liquidity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit" className="mt-8">
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Deposit Form */}
                <Card className="border-primary/20 bg-card/50 p-8 backdrop-blur-sm">
                  <h3 className="mb-6 font-bold text-2xl text-foreground">
                    Add Liquidity
                  </h3>

                  <div className="space-y-6">
                    {/* Token Selection */}
                    <div className="space-y-3">
                      <Label className="text-foreground">Select Token</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {TOKENS.map((token) => (
                          <button
                            key={token.symbol}
                            onClick={() => setSelectedToken(token)}
                            className={`rounded-lg border p-4 text-left transition-all ${
                              selectedToken.symbol === token.symbol
                                ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
                                : "border-primary/20 bg-card/30 hover:border-primary/40"
                            }`}
                          >
                            <div className="font-semibold text-foreground">
                              {token.symbol}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {token.name}
                            </div>
                            <div className="mt-2 font-medium text-primary text-sm">
                              {token.apy}% APY
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-3">
                      <Label htmlFor="amount" className="text-foreground">
                        Amount to Deposit
                      </Label>
                      <div className="relative">
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="h-14 border-primary/30 bg-background/50 pr-20 font-mono text-lg backdrop-blur-sm focus:border-primary focus:shadow-[0_0_20px_rgba(0,255,255,0.2)]"
                        />
                        <span className="absolute top-1/2 right-4 -translate-y-1/2 font-semibold text-muted-foreground">
                          {selectedToken.symbol}
                        </span>
                      </div>
                      <button
                        onClick={handleMaxClick}
                        disabled={!isConnected || !balance}
                        className="text-primary text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Max:{" "}
                        {isConnected && balance
                          ? formatEther(balance.value).slice(0, 8)
                          : "0.00"}{" "}
                        {selectedToken.symbol}
                      </button>
                    </div>

                    {/* Info Box */}
                    <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
                      <div className="mb-2 flex items-start gap-2">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                        <div className="text-cyan-100 text-sm leading-relaxed">
                          Your liquidity will be used to fund upfront interest
                          payments for stakers. You can withdraw your funds at
                          any time, subject to available liquidity.
                        </div>
                      </div>
                    </div>

                    {/* Deposit Button */}
                    <Button
                      size="lg"
                      onClick={handleDeposit}
                      disabled={!isConnected || !amount || Number(amount) <= 0}
                      className="h-14 w-full gap-2 bg-primary font-semibold text-primary-foreground shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-all hover:bg-primary/90 hover:shadow-[0_0_40px_rgba(0,255,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Wallet className="h-5 w-5" />
                      {!isConnected
                        ? "Connect Wallet to Deposit"
                        : "Deposit Liquidity"}
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>

                {/* Earnings Preview */}
                <div className="space-y-6">
                  <Card className="border-primary/20 bg-card/50 p-8 backdrop-blur-sm">
                    <h3 className="mb-6 font-bold text-2xl text-foreground">
                      Earnings Preview
                    </h3>

                    <div className="space-y-6">
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-6">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground text-sm">
                          <TrendingUp className="h-4 w-4" />
                          Annual Yield (APY)
                        </div>
                        <div className="font-bold text-3xl text-primary">
                          {selectedToken.apy}%
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-background/50 p-4">
                          <span className="text-muted-foreground">
                            Monthly Earnings
                          </span>
                          <span className="font-mono font-semibold text-foreground text-lg">
                            {monthlyYield} {selectedToken.symbol}
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-background/50 p-4">
                          <span className="text-muted-foreground">
                            Annual Earnings
                          </span>
                          <span className="font-mono font-semibold text-foreground text-lg">
                            {estimatedYield} {selectedToken.symbol}
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-background/50 p-4">
                          <span className="text-muted-foreground">
                            Total After 1 Year
                          </span>
                          <span className="font-mono font-semibold text-primary text-lg">
                            {amount
                              ? (
                                  Number.parseFloat(amount) +
                                  Number.parseFloat(estimatedYield)
                                ).toFixed(4)
                              : "0.0000"}{" "}
                            {selectedToken.symbol}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="border-primary/20 bg-card/50 p-6 backdrop-blur-sm">
                    <h4 className="mb-4 font-semibold text-foreground">
                      Pool Statistics
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Total Pool Liquidity
                        </span>
                        <span className="font-medium text-foreground">
                          ${(selectedToken.liquidity / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Utilization Rate
                        </span>
                        <span className="font-medium text-foreground">
                          68.4%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Your Share
                        </span>
                        <span className="font-medium text-foreground">
                          0.00%
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="withdraw" className="mt-8">
              <Card className="mx-auto max-w-2xl border-primary/20 bg-card/50 p-8 backdrop-blur-sm">
                <h3 className="mb-6 font-bold text-2xl text-foreground">
                  Withdraw Liquidity
                </h3>

                <div className="mb-8 rounded-lg border border-primary/30 bg-primary/5 p-6 text-center">
                  <div className="mb-2 text-muted-foreground text-sm">
                    Your Total Liquidity
                  </div>
                  <div className="font-bold text-3xl text-foreground">
                    $0.00
                  </div>
                  <div className="mt-4 text-muted-foreground text-sm">
                    No active liquidity positions
                  </div>
                </div>

                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                    <div className="text-cyan-100 text-sm leading-relaxed">
                      Withdrawals are subject to available liquidity in the
                      pool. If the pool is highly utilized, you may need to wait
                      for stakers to unlock their positions.
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
