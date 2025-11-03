import { Navigation } from "@/components/navigation";
import { StakingInterface } from "@/components/staking-interface";
import { Footer } from "@/components/footer";

export default function StakePage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <StakingInterface showLogoHeader />
      <Footer />
    </main>
  );
}
