import { ToolWorkspace } from "@/components/tool/tool-workspace";
import { Container } from "@/components/ui/container";

export default function ToolPage() {
  return (
    <Container className="pb-16 pt-10 sm:pt-14">
      <div className="space-y-6">
        <div className="max-w-3xl space-y-4">
          <p className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-200">
            Main Workspace
          </p>
          <h1 className="font-[var(--font-heading)] text-4xl font-semibold text-white sm:text-5xl">
            Server-side cropping built for CNC image workflows.
          </h1>
          <p className="text-sm leading-7 text-slate-300 sm:text-base">
            Upload one or many images, let Sharp generate your four quadrant
            crops plus a center-detail zoom, and download each asset or the full
            export pack as a ZIP.
          </p>
        </div>

        <ToolWorkspace />
      </div>
    </Container>
  );
}

