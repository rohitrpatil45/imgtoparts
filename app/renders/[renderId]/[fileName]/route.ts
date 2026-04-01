import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getMimeType(fileName: string) {
  if (fileName.endsWith(".png")) {
    return "image/png";
  }

  if (fileName.endsWith(".mp4")) {
    return "video/mp4";
  }

  return "application/octet-stream";
}

export async function GET(
  _request: Request,
  {
    params
  }: {
    params: {
      renderId: string;
      fileName: string;
    };
  }
) {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "renders",
      params.renderId,
      params.fileName
    );
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "content-type": getMimeType(params.fileName),
        "cache-control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "Render asset not found." }, { status: 404 });
  }
}
