import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { ensureWorkspaceForUser } from "@/lib/server-workspace";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        logger.error("OAuth code exchange error in auth callback", { error: error.message });
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, origin));
      }

      if (data.user) {
        // Automatically provision workspace & subscription if first time Google login
        try {
          await ensureWorkspaceForUser(data.user);
        } catch (wsErr) {
          logger.warn("Workspace auto-provision warning in auth callback", { error: String(wsErr) });
        }
      }
    } catch (err) {
      logger.error("Unexpected error in auth callback handler", { error: String(err) });
      return NextResponse.redirect(new URL("/login?error=Authentication+failed", origin));
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
