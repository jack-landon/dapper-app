import { TreasuryHero } from "@/components/treasury-hero";
import { TreasuryStats } from "@/components/treasury-stats";
import { TreasuryVaults } from "@/components/treasury-vaults";

export default async function TreasuryPage() {
  return (
    <main className="min-h-screen bg-background">
      <TreasuryHero />
      <TreasuryVaults />
      <TreasuryStats />
    </main>
  );
}
