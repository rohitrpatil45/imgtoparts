import { NextResponse } from "next/server";
import {
  get3DPreviewVideoStatus,
  queue3DPreviewVideo
} from "@/lib/render-utils";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      renderId?: string;
    };

    if (!body.renderId || typeof body.renderId !== "string") {
      return NextResponse.json(
        { error: "A valid renderId is required to generate the preview video." },
        { status: 400 }
      );
    }

    const status = await queue3DPreviewVideo(body.renderId);

    if (status.status === "complete") {
      return NextResponse.json({
        renderId: body.renderId,
        video: status.video,
        status: "video_complete" as const
      });
    }

    return NextResponse.json(
      {
        renderId: body.renderId,
        status: "video_pending" as const
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Render video error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "We could not generate the preview video.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const renderId = new URL(request.url).searchParams.get("renderId");

    if (!renderId) {
      return NextResponse.json(
        { error: "A valid renderId is required to check video status." },
        { status: 400 }
      );
    }

    const status = await get3DPreviewVideoStatus(renderId);

    if (!status) {
      return NextResponse.json(
        { error: "No preview video job was found for this render." },
        { status: 404 }
      );
    }

    if (status.status === "complete") {
      return NextResponse.json({
        renderId,
        video: status.video,
        status: "video_complete" as const
      });
    }

    if (status.status === "error") {
      return NextResponse.json(
        {
          renderId,
          error: status.error,
          status: "video_failed" as const
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        renderId,
        status: "video_pending" as const
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Video status error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "We could not check the preview video status.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
