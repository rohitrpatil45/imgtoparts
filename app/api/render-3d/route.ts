import { NextResponse } from "next/server";
import { getModelExtension, MAX_3D_FILE_SIZE } from "@/lib/3d-config";
import { generate3DRenderPack } from "@/lib/render-utils";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    console.log("Render API hit");

    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        { error: "Please upload one STL or OBJ file." },
        { status: 400 }
      );
    }

    const extension = getModelExtension(uploadedFile.name);

    if (!extension) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload an STL or OBJ file." },
        { status: 400 }
      );
    }

    if (uploadedFile.size > MAX_3D_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. The maximum supported size is 20 MB." },
        { status: 413 }
      );
    }

    console.log("Render started", {
      sourceName: uploadedFile.name,
      extension,
      size: uploadedFile.size
    });

    const result = await generate3DRenderPack(uploadedFile);

    return NextResponse.json({
      result,
      images: result.images,
      video: result.video,
      materials: result.materials,
      stats: result.stats
    });
  } catch (error) {
    console.error("Render error:", error);
    console.error("3D render pipeline failed", error);

    const message =
      error instanceof Error
        ? error.message
        : "We could not render the uploaded 3D model.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
