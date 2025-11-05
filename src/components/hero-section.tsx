"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { HowItWorks } from "./how-it-works";
import { Separator } from "./ui/separator";
import { scrollToStakingSection } from "@/lib/utils";
import LogoHeader from "./LogoHeader";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Grid background pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Animated glow orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse delay-1000" />

      <div className="relative container mx-auto px-4 py-24 md:py-32">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Logo/Brand */}
          <LogoHeader />

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance leading-tight text-shadow-lg/30">
            A <span className="text-primary glow-text">Term Deposit</span>
            <br />
            for the <span className="underline">impatient</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 text-pretty max-w-2xl leading-relaxed">
            Stake your crypto and receive all yield upfront.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button
              onClick={scrollToStakingSection}
              size="lg"
              className="text-lg px-8 py-6 glow-effect group font-bold shadow-lg/20 text-shadow-lg/10"
            >
              Get Upfront Yield Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Link href="/treasury">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 hover:text-primary-foreground border-primary/50 font-bold"
              >
                Join the Treasury
              </Button>
            </Link>
          </div>

          <Separator />

          <HowItWorks />
        </div>
      </div>
    </section>
  );
}
