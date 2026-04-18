import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { writeAuditLog } from "@/lib/ops";
import {
  getWorkspaceMembershipOrThrow,
  HttpError,
  updateWorkspaceSecrets,
} from "@/lib/server-workspace";
import { parseBody, whatsappConfigSchema } from "@/lib/validation";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseBody(whatsappConfigSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const {
      workspaceId,
      whatsappNumberId,
      accessToken,
      clearAccessToken,
      appSecret,
      clearAppSecret,
      followUpEnabled,
      followUpTemplateName,
      followUpTemplateLanguageCode,
      followUpTemplateVariables,
    } = parsed.data;

    const { user } = await getWorkspaceMembershipOrThrow(workspaceId, ["owner", "admin"]);

    await updateWorkspaceSecrets(workspaceId, {
      whatsappNumberId: whatsappNumberId?.trim() || null,
      accessToken: accessToken || null,
      clearAccessToken,
      appSecret: appSecret || null,
      clearAppSecret,
      followUpEnabled,
      followUpTemplateName: followUpTemplateName || null,
      followUpTemplateLanguageCode,
      followUpTemplateVariables:
        followUpTemplateVariables
          .map((v: string) => v.trim())
          .filter(Boolean),
    });

    await writeAuditLog({
      businessId: workspaceId,
      actorUserId: user.id,
      action: "workspace.whatsapp_config_updated",
      entityType: "business",
      entityId: workspaceId,
      metadata: {
        rotatedAccessToken: Boolean(accessToken),
        rotatedAppSecret: Boolean(appSecret),
        clearedAccessToken: clearAccessToken,
        clearedAppSecret: clearAppSecret,
        followUpEnabled,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    logger.error("Failed to update WhatsApp config", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
