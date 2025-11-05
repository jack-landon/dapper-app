import { Coins } from "lucide-react";

export function TreasuryHero() {
  return (
    <section className="relative overflow-hidden border-b border-primary/20 bg-linear-to-b from-background to-background/50">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ff_1px,transparent_1px),linear-gradient(to_bottom,#0ff_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-[0.03]" />

      {/* Animated glow orbs */}
      <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-primary/20 blur-[120px] animate-pulse" />
      <div className="absolute right-1/4 bottom-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px] animate-pulse [animation-delay:1s]" />

      <div className="container relative mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center mx-auto max-w-4xl text-center">
          {/* <LogoHeader /> */}
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-primary/30 bg-primary/5 px-6 py-2 backdrop-blur-sm shadow-lg/20">
            <Coins className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              Treasury Portal
            </span>
          </div>

          <h1 className="mb-6 text-balance font-bold text-5xl text-foreground md:text-7xl text-shadow-lg">
            Treasury Receives
            <span className="block bg-linear-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent">
              Excess Yield & Fees
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-balance text-muted-foreground text-xl leading-relaxed">
            The Dapper treasury receives excess yield and distributes them
            amongst vault participants.
          </p>

          {/* <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="rounded-lg border border-primary/30 bg-card/50 px-6 py-3 backdrop-blur-sm">
              <div className="text-muted-foreground text-sm">
                Total Treasury
              </div>
              <div className="font-bold text-2xl text-foreground">$24.8M</div>
            </div>
            <div className="rounded-lg border border-primary/30 bg-card/50 px-6 py-3 backdrop-blur-sm">
              <div className="text-muted-foreground text-sm">
                Fees Collected
              </div>
              <div className="font-bold text-2xl text-primary">$2.1M</div>
            </div>
            <div className="rounded-lg border border-primary/30 bg-card/50 px-6 py-3 backdrop-blur-sm">
              <div className="text-muted-foreground text-sm">
                Excess Yield Generated
              </div>
              <div className="font-bold text-2xl text-foreground">$18.4M</div>
            </div>
          </div> */}
        </div>
      </div>
    </section>
  );
}
