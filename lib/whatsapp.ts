export async function sendWhatsAppMessage(to: string, message: string, phoneNumberId: string, accessToken?: string) {
  const metaToken = accessToken || process.env.META_WHATSAPP_TOKEN;
  if (!metaToken) {
    console.error('No WhatsApp access token available');
    return { success: false, error: 'No WhatsApp access token available' };
  }

  // Validate phoneNumberId is numeric to prevent SSRF
  if (!/^\d+$/.test(phoneNumberId)) {
    return { success: false, error: 'Invalid phone number ID format' };
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${metaToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { body: message }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Failed to send WhatsApp message:', errorBody);
      return { success: false, error: errorBody };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Network error sending WhatsApp message:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendFollowUp(to: string, phoneNumberId: string, accessToken?: string, customMessage?: string) {
  const followUpMessage = customMessage || "Hi! Just checking in — did you get all the information you needed? We'd love to help you get started. 😊";
  return await sendWhatsAppMessage(to, followUpMessage, phoneNumberId, accessToken);
}
