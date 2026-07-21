import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'crypto';

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * ReplySync Encryption Module — Tenant Secrets Security (AES-256-GCM)
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Why APP_ENCRYPTION_KEY is required:
 *   Tenant-sensitive API credentials (Meta WhatsApp Access Tokens, Meta App Secrets)
 *   are stored encrypted at rest in Supabase database tables (`businesses`).
 *   APP_ENCRYPTION_KEY provides the root key material used to derive the 256-bit
 *   AES-256-GCM symmetric encryption key.
 *
 * How to generate a key:
 *   Run `npm run generate-key` or execute `crypto.randomBytes(32).toString('hex')`.
 *   Set `APP_ENCRYPTION_KEY` in your `.env.local` file and Vercel Environment Variables.
 *
 * Behavior:
 *   - Development Mode: If `APP_ENCRYPTION_KEY` is missing, a stable in-memory
 *     fallback key is generated and a warning is logged so local dev runs cleanly.
 *   - Production Mode: `APP_ENCRYPTION_KEY` MUST be provided. If missing, a clear
 *     descriptive exception is thrown to halt operation safely.
 * ──────────────────────────────────────────────────────────────────────────────
 */

const ALGORITHM = 'aes-256-gcm';

let devFallbackKey: Buffer | null = null;
let devWarningLogged = false;

/**
 * Generates a cryptographically secure 32-byte (256-bit) random secret key encoded in hexadecimal.
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Derives the 32-byte key material using SHA-256 from `process.env.APP_ENCRYPTION_KEY`.
 */
function getKeyMaterial(): Buffer {
  const secret = process.env.APP_ENCRYPTION_KEY;

  if (secret && secret.trim().length > 0) {
    return createHash('sha256').update(secret.trim()).digest();
  }

  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;

  if (isDev) {
    if (!devFallbackKey) {
      devFallbackKey = createHash('sha256').update('dev-temp-fallback-secret-replysync-key').digest();
    }
    if (!devWarningLogged) {
      devWarningLogged = true;
      console.warn(
        '\x1b[33m%s\x1b[0m',
        '[SECURITY WARNING] APP_ENCRYPTION_KEY environment variable is not set.\n' +
          '  Using a temporary fallback key for local development.\n' +
          '  For production deployments (Vercel), APP_ENCRYPTION_KEY MUST be configured to persist encrypted secrets.\n' +
          '  Run "npm run generate-key" to create a production secret key.'
      );
    }
    return devFallbackKey;
  }

  throw new Error(
    '[CRITICAL SECURITY ERROR] APP_ENCRYPTION_KEY is required to encrypt/decrypt tenant secrets in production.\n' +
      'Please add APP_ENCRYPTION_KEY to your Vercel Environment Variables.\n' +
      'You can generate a 32-byte key using "npm run generate-key".'
  );
}

/**
 * Encrypts a plaintext secret using AES-256-GCM.
 * Output format: `iv.authTag.ciphertext` (base64url encoded).
 */
export function encryptSecret(plainText: string): string {
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

/**
 * Decrypts an AES-256-GCM encrypted secret payload (`iv.authTag.ciphertext`).
 */
export function decryptSecret(payload: string | null | undefined): string | null {
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

/**
 * Formats last 4 digits for masked display in UI.
 */
export function maskSecret(last4: string | null | undefined): string {
  if (!last4) {
    return 'Not configured';
  }

  return `••••••••${last4}`;
}

/**
 * Extracts last 4 characters of a string.
 */
export function last4(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length <= 4 ? trimmed : trimmed.slice(-4);
}

/**
 * Constant time comparison to prevent timing attacks.
 */
export function constantTimeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
