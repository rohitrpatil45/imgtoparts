import { NextResponse } from "next/server";
import { DEFAULT_DEBUG_MODE } from "@/lib/stl-render-config";
import {
  parseBackgroundPreset,
  parseBooleanFormValue,
  parseMaterialPreset,
  renderUploadedStl,
  StlRenderPipelineError
} from "@/lib/stl-renderer";
import type { StlRenderResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    console.log("[render-route] request-received", {
      timestamp: new Date().toISOString()
    });
    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json<StlRenderResponse>(
        {
          error: "Attach one STL file in the `file` field."
        },
        { status: 400 }
      );
    }

    const debug = parseBooleanFormValue(
      formData.get("debug"),
      DEFAULT_DEBUG_MODE
    );

    console.log("[render-route] request-validated", {
      fileName: uploadedFile.name,
      size: uploadedFile.size,
      debug
    });

    const result = await renderUploadedStl(uploadedFile, {
      materialPreset: parseMaterialPreset(formData.get("materialPreset")),
      background: parseBackgroundPreset(formData.get("background")),
      includeThumbnail: parseBooleanFormValue(
        formData.get("includeThumbnail"),
        true
      ),
      debug
    });

    console.log("[render-route] final-response-sent", {
      renderId: result.renderId,
      sourceName: result.sourceName
    });

    return NextResponse.json<StlRenderResponse>({
      result
    });
  } catch (error) {
    const status =
      error instanceof StlRenderPipelineError ? error.status : 500;
    const message =
      error instanceof Error
        ? error.message
        : "We could not render the uploaded STL file.";

    console.error("[render-route] request-failed", {
      error: message
    });

    return NextResponse.json<StlRenderResponse>(
      {
        error: message
      },
      { status }
    );
  }
}
