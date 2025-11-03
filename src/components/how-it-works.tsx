import { Wallet, Lock, Zap, TrendingUp } from "lucide-react";

const STEPS = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description: "Link your Web3 wallet to get started with Dapper",
  },
  {
    icon: Lock,
    title: "Choose Duration",
    description: "Select how long you want to lock your crypto",
  },
  {
    icon: Zap,
    title: "Receive Instantly",
    description: "Get all your yield upfront in seconds",
  },
  {
    icon: TrendingUp,
    title: "Withdraw Later",
    description: "Unlock your principal after the lock period ends",
  },
];

export function HowItWorks() {
  return (
    <section className="relative pt-24">
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="relative container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to start earning instant yield on your crypto
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  {/* Connector line */}
                  {index < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border" />
                  )}

                  <div className="relative flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-2xl bg-card border-2 border-primary flex items-center justify-center mb-6 glow-effect relative z-10">
                      <Icon className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-sm font-bold text-primary mb-2">
                      STEP {index + 1}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
