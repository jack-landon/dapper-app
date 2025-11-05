"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BanknoteArrowDown, Coins, LayoutGrid } from "lucide-react";
import { WalletButton } from "@/components/wallet-button";
import { Icon } from "lucide-react";
import { mustache } from "@lucide/lab";

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-primary/20 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-4 transition-opacity hover:opacity-80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-[0_0_20px_rgba(0,255,255,0.3)]">
              <Icon
                iconNode={mustache}
                className="h-6 w-6 text-primary-foreground"
              />
            </div>
            <span className="font-bold text-xl tracking-tight">Dapper</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link href="/stake">
              <Button
                variant={pathname === "/stake" ? "default" : "ghost"}
                className={
                  pathname === "/stake"
                    ? "bg-primary/20 text-primary shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:bg-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                <BanknoteArrowDown className="h-4 w-4" />
                Stake
              </Button>
            </Link>
            <Link href="/treasury">
              <Button
                variant={pathname === "/treasury" ? "default" : "ghost"}
                className={
                  pathname === "/treasury"
                    ? "gap-2 bg-primary/20 text-primary shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:bg-primary/30"
                    : "gap-2 text-muted-foreground hover:text-foreground"
                }
              >
                <Coins className="h-4 w-4" />
                Join the Treasury
              </Button>
            </Link>
            <Link href="/stake-wall">
              <Button
                variant={pathname === "/stake-wall" ? "default" : "ghost"}
                className={
                  pathname === "/stake-wall"
                    ? "gap-2 bg-primary/20 text-primary shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:bg-primary/30"
                    : "gap-2 text-muted-foreground hover:text-foreground"
                }
              >
                <LayoutGrid className="h-4 w-4" />
                Stake Wall
              </Button>
            </Link>
            <div className="ml-2">
              <WalletButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
