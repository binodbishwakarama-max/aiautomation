import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getWorkspaceMembershipOrThrow, HttpError } from "@/lib/server-workspace";
import { parseBody, testConnectionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseBody(testConnectionSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    const { workspaceId, phoneNumberId, accessToken } = parsed.data;

    const { user } = await getWorkspaceMembershipOrThrow(workspaceId, ["owner", "admin"]);
    const rateLimit = await checkRateLimit(`test-connection:${user.id}:${workspaceId}`, 10, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many connection tests. Try again in a minute." },
        { status: 429 }
      );
    }

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, error: errorData.error?.message || "Invalid credentials." },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    logger.error("Test connection failed", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "Internal server error during verification." },
      { status: 500 }
    );
  }
}
