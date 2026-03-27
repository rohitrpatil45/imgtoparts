import { FeatureGrid } from "@/components/marketing/feature-grid";
import { HeroPanel } from "@/components/marketing/hero-panel";

export default function LandingPage() {
  return (
    <div className="pb-20">
      <HeroPanel />
      <FeatureGrid />
    </div>
  );
}
