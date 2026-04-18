import { createHmac } from 'crypto';

import { constantTimeEquals } from '@/lib/crypto';

type TextMessageParams = {
  to: string;
  body: string;
  phoneNumberId: string;
  accessToken: string;
};

type TemplateMessageParams = {
  to: string;
  phoneNumberId: string;
  accessToken: string;
  templateName: string;
  languageCode?: string;
  variables?: string[];
};

function isNumericMetaId(value: string) {
  return /^\d+$/.test(value);
}

async function callWhatsAppGraphApi(
  phoneNumberId: string,
  accessToken: string,
  payload: Record<string, unknown>
) {
  if (!isNumericMetaId(phoneNumberId)) {
    return { success: false as const, error: 'Invalid phone number ID format.' };
  }

  const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return {
      success: false as const,
      error: await response.text(),
    };
  }

  const data = await response.json();
  return { success: true as const, data };
}

export async function sendWhatsAppTextMessage(params: TextMessageParams) {
  const { to, body, phoneNumberId, accessToken } = params;

  if (!accessToken) {
    return { success: false as const, error: 'Missing WhatsApp access token.' };
  }

  return callWhatsAppGraphApi(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body },
  });
}

export async function sendWhatsAppTemplateMessage(params: TemplateMessageParams) {
  const {
    to,
    phoneNumberId,
    accessToken,
    templateName,
    languageCode = 'en_US',
    variables = [],
  } = params;

  if (!templateName.trim()) {
    return { success: false as const, error: 'A template name is required for follow-up sends.' };
  }

  const components =
    variables.length > 0
      ? [
          {
            type: 'body',
            parameters: variables.map((value) => ({
              type: 'text',
              text: value,
            })),
          },
        ]
      : undefined;

  return callWhatsAppGraphApi(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components ? { components } : {}),
    },
  });
}

export function extractProviderMessageId(data: unknown) {
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { messages?: unknown[] }).messages) &&
    (data as { messages: Array<{ id?: string }> }).messages[0]?.id
  ) {
    return (data as { messages: Array<{ id: string }> }).messages[0].id;
  }

  return null;
}

export function verifyMetaWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
  appSecret: string | null;
}) {
  const { rawBody, signatureHeader, appSecret } = params;

  if (!signatureHeader || !appSecret) {
    return false;
  }

  const expectedSignature = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  return constantTimeEquals(expectedSignature, signatureHeader);
}

export async function downloadWhatsAppMedia(mediaId: string, accessToken: string) {
  if (!accessToken || !isNumericMetaId(mediaId)) {
    throw new Error('Missing access token or invalid media ID');
  }

  // 1. Get media URL
  const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!metaResponse.ok) {
    throw new Error(`Failed to fetch media metadata: ${await metaResponse.text()}`);
  }

  const metaData = await metaResponse.json();
  const mediaUrl = metaData.url;

  if (!mediaUrl) {
    throw new Error('Media URL not found in Graph API response');
  }

  // 2. Download media binary
  const binaryResponse = await fetch(mediaUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!binaryResponse.ok) {
    throw new Error(`Failed to download media binary: ${await binaryResponse.text()}`);
  }

  const arrayBuffer = await binaryResponse.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: metaData.mime_type
  };
}

