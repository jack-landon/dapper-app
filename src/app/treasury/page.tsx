import { Navigation } from "@/components/navigation";
import { TreasuryHero } from "@/components/treasury-hero";
import { TreasuryStats } from "@/components/treasury-stats";
import { TreasuryVaults } from "@/components/treasury-vaults";
import { Footer } from "@/components/footer";

export default async function TreasuryPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <TreasuryHero />
      <TreasuryVaults />
      <TreasuryStats />
      <Footer />
    </main>
  );
}
