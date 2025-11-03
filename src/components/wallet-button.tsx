"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <Button
        onClick={() => disconnect()}
        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    );
  }

  return (
    <Button
      onClick={() => {
        const walletConnectConnector = connectors.find(
          (connector) => connector.id === "io.metamask"
        );
        console.log(connectors);
        if (walletConnectConnector) {
          connect({ connector: walletConnectConnector });
        }
      }}
      disabled={isPending}
      className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        "Connect Wallet"
      )}
    </Button>
  );
}
