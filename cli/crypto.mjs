// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT CLI - CRYPTO MODULE
//  Mirrors lib/encryption.ts using Node.js crypto.subtle
//  AES-256-GCM decryption with PBKDF2 key derivation
// ═══════════════════════════════════════════════════════════════

import { webcrypto } from 'node:crypto';

const subtle = webcrypto.subtle;

function base64ToBuffer(base64) {
  return Buffer.from(base64, 'base64');
}

async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

/**
 * Decrypts a secret using AES-256-GCM.
 * Mirrors the browser-side decryptSecret() in lib/encryption.ts.
 */
export async function decryptSecret(encrypted, iv, salt, password) {
  const encryptedBuffer = base64ToBuffer(encrypted);
  const ivBuffer = base64ToBuffer(iv);
  const saltBuffer = base64ToBuffer(salt);

  const key = await deriveKey(password, new Uint8Array(saltBuffer));

  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    encryptedBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}
