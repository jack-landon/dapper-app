import { HeroSection } from "@/components/hero-section";
import { StakingInterface } from "@/components/staking-interface";

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <StakingInterface />
    </main>
  );
}
