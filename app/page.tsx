import Link from "next/link";
import { ArtworkViewport } from "@/components/marketing/cnc-visuals";
import { HeroPanel } from "@/components/marketing/hero-panel";
import { Container } from "@/components/ui/container";
import OutputPreview from "@/components/marketing/OutputPreview";
import ProblemSolve from "@/components/marketing/ProblemSolve";
import { FeatureGrid } from "@/components/marketing/feature-grid";  

const problems = [
  {
    title: "Manual cropping is slow",
    description:
      "Design teams burn time framing the same image again and again just to assemble product-ready views."
  },
  {
    title: "Inconsistent product images",
    description:
      "Without a repeatable crop system, every listing and approval deck ends up with slightly different framing."
  },
  {
    title: "Poor marketplace quality",
    description:
      "Weak detail shots and uneven zoom levels make premium CNC work feel less polished than it should."
  }
];

const workflow = [
  {
    step: "01",
    title: "Upload image",
    description:
      "Drop in a CNC design source and queue it instantly for processing."
  },
  {
    step: "02",
    title: "AI processes image",
    description:
      "The system detects the composition and maps the strongest detail regions."
  },
  {
    step: "03",
    title: "Get 5 outputs",
    description:
      "Receive a full view, top detail, corner crop, side carving, and center zoom."
  }
];

const features = [
  {
    title: "Auto crop",
    description:
      "Create clean product compositions without manual drag-and-resize work."
  },
  {
    title: "Smart zoom",
    description:
      "Highlight carvings, edges, and center relief with controlled close-up framing."
  },
  {
    title: "Batch export",
    description:
      "Process multiple source images and deliver the full set of outputs together."
  },
  {
    title: "CNC ready output",
    description:
      "Keep every generated image aligned for approvals, mockups, and marketplace publishing."
  }
];

export default function LandingPage() {
  return (
    <div className="pb-20 sm:pb-24">
      <HeroPanel />
      <OutputPreview />
      <ProblemSolve />  
      <FeatureGrid />



      


    
    </div>
  );
}
