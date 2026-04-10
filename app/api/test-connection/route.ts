import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { phoneNumberId, accessToken } = await request.json();

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { success: false, error: "Missing required credentials." },
        { status: 400 }
      );
    }

    // SSRF protection: Phone Number IDs from Meta are always numeric
    if (!/^\d+$/.test(phoneNumberId)) {
      return NextResponse.json(
        { success: false, error: "Invalid Phone Number ID format. Must be numeric." },
        { status: 400 }
      );
    }

    // Basic token format check
    if (typeof accessToken !== 'string' || accessToken.length < 10) {
      return NextResponse.json(
        { success: false, error: "Invalid access token format." },
        { status: 400 }
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
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error during verification." },
      { status: 500 }
    );
  }
}
