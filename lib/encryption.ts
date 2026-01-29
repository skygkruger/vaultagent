// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - CLIENT-SIDE ENCRYPTION
//  Zero-knowledge encryption using Web Crypto API
//  Server NEVER sees plaintext secrets or master password
// ═══════════════════════════════════════════════════════════════

/**
 * Derives an encryption key from the master password using PBKDF2
 * This happens entirely client-side - the password never leaves the browser
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  console.log('[deriveKey] Starting key derivation...')
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  console.log('[deriveKey] Key material imported')

  // Derive the actual encryption key
  // Using a new Uint8Array to ensure we have a clean buffer
  const saltArray = new Uint8Array(salt)
  const result = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltArray,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
  console.log('[deriveKey] Key derived successfully')
  return result
}

/**
 * Encrypts a secret value using AES-256-GCM
 * Returns the encrypted blob, IV, and salt (all needed for decryption)
 */
export async function encryptSecret(
  plaintext: string,
  password: string
): Promise<{ encrypted: string; iv: string; salt: string }> {
  console.log('[encrypt] Starting encryption...')

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  console.log('[encrypt] Generated salt and IV')

  // Derive key from password
  const key = await deriveKey(password, salt)
  console.log('[encrypt] Key derived')

  // Encrypt the plaintext
  const encoder = new TextEncoder()
  const plaintextBuffer = encoder.encode(plaintext)

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintextBuffer
  )
  console.log('[encrypt] Encryption complete')

  // Convert to base64 for storage
  return {
    encrypted: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt)
  }
}

/**
 * Decrypts a secret value using AES-256-GCM
 * Requires the encrypted blob, IV, salt, and master password
 */
export async function decryptSecret(
  encrypted: string,
  iv: string,
  salt: string,
  password: string
): Promise<string> {
  // Convert from base64
  const encryptedBuffer = base64ToBuffer(encrypted)
  const ivBuffer = base64ToBuffer(iv)
  const saltBuffer = base64ToBuffer(salt)
  
  // Derive the same key
  const key = await deriveKey(password, new Uint8Array(saltBuffer))
  
  // Decrypt
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    encryptedBuffer
  )
  
  // Convert back to string
  const decoder = new TextDecoder()
  return decoder.decode(decryptedBuffer)
}

/**
 * Generates a secure session token
 */
export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return 'va_sess_' + bufferToBase64(bytes)
    .replace(/\+/g, 'x')
    .replace(/\//g, 'y')
    .replace(/=/g, '')
    .substring(0, 48)
}

/**
 * Helper: ArrayBuffer to Base64
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Helper: Base64 to ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Masks a secret value for display (shows only last 4 chars)
 */
export function maskSecret(value: string): string {
  if (value.length <= 4) return '****'
  return '***************' + value.slice(-4)
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number')
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain a special character')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
