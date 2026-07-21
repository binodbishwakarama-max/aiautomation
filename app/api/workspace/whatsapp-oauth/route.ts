import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { writeAuditLog } from "@/lib/ops";
import {
  getWorkspaceMembershipOrThrow,
  HttpError,
  updateWorkspaceSecrets,
} from "@/lib/server-workspace";

export async function POST(request: Request) {
  try {
    const { code, workspaceId, redirectUri: clientRedirectUri } = await request.json();

    if (!code || !workspaceId) {
      return NextResponse.json(
        { error: "Code and workspaceId are required." },
        { status: 400 }
      );
    }

    // Verify user membership (must be owner or admin to manage config)
    const { user } = await getWorkspaceMembershipOrThrow(workspaceId, ["owner", "admin"]);

    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: "Meta App ID (NEXT_PUBLIC_META_APP_ID) or App Secret (META_APP_SECRET) is not configured in environment variables." },
        { status: 500 }
      );
    }

    // 1. Exchange the auth code for a short-lived user access token
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const fallbackOrigin = host ? `${proto}://${host}` : (request.headers.get("origin") || "http://localhost:3000");
    const redirect_uri = clientRedirectUri || `${fallbackOrigin}/settings`;

    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      code,
      redirect_uri,
    });

    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams.toString()}`
    );
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      const errMsg = tokenData.error?.message || "Failed to exchange authorization code.";
      logger.error("Meta OAuth token exchange error", { error: tokenData.error });
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const shortLivedToken = tokenData.access_token;

    // 2. Exchange the short-lived user token for a long-lived user access token (60 days)
    const longLivedParams = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLivedToken,
    });

    const longLivedRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${longLivedParams.toString()}`
    );
    const longLivedData = await longLivedRes.json();

    if (!longLivedRes.ok || longLivedData.error) {
      const errMsg = longLivedData.error?.message || "Failed to generate long-lived token.";
      logger.error("Meta OAuth long-lived token error", { error: longLivedData.error });
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const finalAccessToken = longLivedData.access_token;

    // 3. Use debug_token to extract the WABA ID from granular_scopes
    const debugParams = new URLSearchParams({
      input_token: finalAccessToken,
      access_token: `${appId}|${appSecret}`,
    });

    const debugRes = await fetch(
      `https://graph.facebook.com/v19.0/debug_token?${debugParams.toString()}`
    );
    const debugData = await debugRes.json();

    if (!debugRes.ok || debugData.error) {
      const errMsg = debugData.error?.message || "Failed to inspect access token.";
      logger.error("Meta debug_token error", { error: debugData.error });
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    // Extract WABA ID from granular_scopes or target_ids
    const granularScopes = debugData.data?.granular_scopes || [];
    const whatsappScope = granularScopes.find(
      (s: { scope: string; target_ids?: string[] }) =>
        s.scope === "whatsapp_business_management" || s.scope === "whatsapp_business_messaging"
    );

    let wabaIds: string[] = whatsappScope?.target_ids || [];

    if (wabaIds.length === 0 && Array.isArray(debugData.data?.target_ids)) {
      wabaIds = debugData.data.target_ids;
    }

    if (wabaIds.length === 0) {
      // Fallback: Query me/whatsapp_business_accounts
      const wabaParams = new URLSearchParams({ access_token: finalAccessToken });
      const wabaRes = await fetch(
        `https://graph.facebook.com/v19.0/me/whatsapp_business_accounts?${wabaParams.toString()}`
      );
      const wabaData = await wabaRes.json();
      if (wabaRes.ok && Array.isArray(wabaData.data) && wabaData.data.length > 0) {
        wabaIds = wabaData.data.map((w: { id: string }) => w.id);
      }
    }

    if (wabaIds.length === 0) {
      logger.error("No WABA IDs found in granular_scopes or debug_token", { debugData });
      return NextResponse.json(
        { error: "No WhatsApp Business Accounts found. Please ensure you selected a WABA during the signup flow." },
        { status: 400 }
      );
    }

    // Select the first (most recently onboarded) WABA
    const firstWabaId = wabaIds[0];

    // 4. Fetch the phone numbers associated with this WABA
    const phoneParams = new URLSearchParams({ access_token: finalAccessToken });
    const phoneRes = await fetch(
      `https://graph.facebook.com/v19.0/${firstWabaId}/phone_numbers?${phoneParams.toString()}`
    );
    const phoneData = await phoneRes.json();

    if (!phoneRes.ok || phoneData.error) {
      const errMsg = phoneData.error?.message || "Failed to query phone numbers for the WABA.";
      logger.error("Meta WABA phone lookup error", { error: phoneData.error });
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const phoneNumbers = phoneData.data || [];
    if (phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: "No phone numbers registered in the WhatsApp Business Account." },
        { status: 400 }
      );
    }

    // Select the first phone number
    const firstPhoneNumberId = phoneNumbers[0].id;

    // 5. Subscribe the WABA to our app's webhook (Tech Provider model)
    //    This tells Meta to route all incoming messages for this WABA
    //    to our central webhook at /api/webhook automatically.
    const subscribeRes = await fetch(
      `https://graph.facebook.com/v19.0/${firstWabaId}/subscribed_apps`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${finalAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const subscribeData = await subscribeRes.json();

    if (!subscribeRes.ok || subscribeData.error) {
      const errMsg = subscribeData.error?.message || "Failed to subscribe WABA to webhook.";
      logger.error("Meta WABA webhook subscription error", { error: subscribeData.error });
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    logger.info("WABA subscribed to app webhook", { wabaId: firstWabaId, phoneNumberId: firstPhoneNumberId });

    // 6. Update workspace secrets in database (encrypted at rest)
    await updateWorkspaceSecrets(workspaceId, {
      whatsappNumberId: firstPhoneNumberId,
      accessToken: finalAccessToken,
    });

    // Write audit log
    await writeAuditLog({
      businessId: workspaceId,
      actorUserId: user.id,
      action: "workspace.whatsapp_oauth_completed",
      entityType: "business",
      entityId: workspaceId,
      metadata: {
        wabaId: firstWabaId,
        phoneNumberId: firstPhoneNumberId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error("Unexpected error in WhatsApp OAuth endpoint", {
      error: errorMsg,
    });
    return NextResponse.json(
      { error: errorMsg || "Internal Server Error" },
      { status: 500 }
    );
  }
}
