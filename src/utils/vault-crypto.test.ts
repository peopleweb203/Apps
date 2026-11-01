import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptData, decryptData, maskApiKey, validateKeyFormat } from './vault-crypto';

test('AES-256-GCM encryption and decryption roundtrip', () => {
  const secretKey = 'sk-live-cinema-forge-ultra-secure-token-999';
  const encrypted = encryptData(secretKey);

  assert.ok(encrypted.ciphertext.length > 0);
  assert.ok(encrypted.iv.length === 24); // 12 bytes = 24 hex chars
  assert.ok(encrypted.authTag.length === 32); // 16 bytes = 32 hex chars

  const decrypted = decryptData(encrypted);
  assert.equal(decrypted, secretKey);
});

test('maskApiKey formats sensitive keys safely', () => {
  assert.equal(maskApiKey(''), '');
  assert.equal(maskApiKey('short'), '••••••••');
  
  const formatted = maskApiKey('sk-live-1234567890abcdef');
  assert.ok(formatted.startsWith('sk-liv'));
  assert.ok(formatted.endsWith('cdef'));
  assert.ok(formatted.includes('••••••••'));

  const geminiKey = maskApiKey('AIzaSyDk184029482948291048201');
  assert.ok(geminiKey.startsWith('AIzaSy'));
  assert.ok(geminiKey.endsWith('8201'));
});

test('validateKeyFormat validates key shapes', () => {
  assert.equal(validateKeyFormat('gemini', '').valid, false);
  assert.equal(validateKeyFormat('gemini', 'short').valid, false);
  assert.equal(validateKeyFormat('gemini', 'AIzaSyDk184029482948291048201').valid, true);

  assert.equal(validateKeyFormat('elevenlabs', '29482').valid, false);
  assert.equal(validateKeyFormat('elevenlabs', '0123456789abcdef0123456789abcdef').valid, true);

  assert.equal(validateKeyFormat('replicate', 'r8_testtoken12345678').valid, true);
});
