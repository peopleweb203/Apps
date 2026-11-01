import crypto from 'node:crypto';

export interface VaultKeyStatus {
  provider: 'gemini' | 'elevenlabs' | 'replicate' | 'kling' | 'synclabs';
  isConfigured: boolean;
  maskedKey: string;
  updatedAt?: string;
}

export interface EncryptedPayload {
  iv: string; // hex
  authTag: string; // hex
  ciphertext: string; // hex
}

// Master secret derived from environment or stable system salt
const VAULT_SALT = 'cineforge-aes-gcm-master-salt-2026';

export function deriveEncryptionKey(secret: string = process.env.VAULT_SECRET || 'cineforge-master-default-key-v1'): Buffer {
  return crypto.scryptSync(secret, VAULT_SALT, 32);
}

/**
 * Encrypt arbitrary string using AES-256-GCM with authenticated tag
 */
export function encryptData(plainText: string, keyBuffer: Buffer = deriveEncryptionKey()): EncryptedPayload {
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  
  let ciphertext = cipher.update(plainText, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    authTag,
    ciphertext,
  };
}

/**
 * Decrypt AES-256-GCM ciphertext
 */
export function decryptData(payload: EncryptedPayload, keyBuffer: Buffer = deriveEncryptionKey()): string {
  const iv = Buffer.from(payload.iv, 'hex');
  const authTag = Buffer.from(payload.authTag, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);

  let plainText = decipher.update(payload.ciphertext, 'hex', 'utf8');
  plainText += decipher.final('utf8');
  return plainText;
}

/**
 * Masks key safely: e.g. "sk-live-1234567890abcdef" -> "sk-live-••••••••cdef"
 */
export function maskApiKey(rawKey?: string): string {
  if (!rawKey || typeof rawKey !== 'string') return '';
  const trimmed = rawKey.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  
  const prefix = trimmed.slice(0, Math.min(6, Math.floor(trimmed.length * 0.3)));
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Validates provider key format
 */
export function validateKeyFormat(provider: string, key: string): { valid: boolean; error?: string } {
  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    return { valid: false, error: 'API key cannot be empty' };
  }
  const clean = key.trim();

  switch (provider) {
    case 'gemini':
      if (clean.length < 20) {
        return { valid: false, error: 'Gemini API key should be at least 20 characters long' };
      }
      return { valid: true };
    case 'elevenlabs':
      if (clean.length < 16) {
        return { valid: false, error: 'ElevenLabs API key is typically a 32-character hex key' };
      }
      return { valid: true };
    case 'replicate':
      if (!clean.startsWith('r8_') && clean.length < 15) {
        return { valid: false, error: 'Replicate token usually starts with "r8_" or is 40 characters' };
      }
      return { valid: true };
    case 'kling':
    case 'synclabs':
      if (clean.length < 12) {
        return { valid: false, error: `${provider} key is too short (minimum 12 characters)` };
      }
      return { valid: true };
    default:
      return { valid: clean.length >= 8, error: clean.length >= 8 ? undefined : 'Key too short' };
  }
}
