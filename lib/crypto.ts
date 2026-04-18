import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKeyMaterial() {
  const secret = process.env.APP_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('APP_ENCRYPTION_KEY is required to encrypt tenant secrets');
  }

  return createHash('sha256').update(secret).digest();
}

export function encryptSecret(plainText: string) {
  const value = plainText.trim();
  if (!value) {
    throw new Error('Cannot encrypt an empty secret');
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKeyMaterial(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('base64url'), authTag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptSecret(payload: string | null | undefined) {
  if (!payload) {
    return null;
  }

  const [ivRaw, authTagRaw, encryptedRaw] = payload.split('.');
  if (!ivRaw || !authTagRaw || !encryptedRaw) {
    throw new Error('Encrypted secret is malformed');
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getKeyMaterial(),
    Buffer.from(ivRaw, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(authTagRaw, 'base64url'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64url')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function maskSecret(last4: string | null | undefined) {
  if (!last4) {
    return 'Not configured';
  }

  return `••••••••${last4}`;
}

export function last4(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length <= 4 ? trimmed : trimmed.slice(-4);
}

export function constantTimeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
