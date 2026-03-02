const PBKDF2_ITERATIONS = 600_000;
const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

function getEncoder() {
  return new TextEncoder();
}

function getDecoder() {
  return new TextDecoder();
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(
  masterPassword: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoded = getEncoder().encode(masterPassword);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoded.buffer as ArrayBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

function getSalt(userId: string): Uint8Array {
  return getEncoder().encode(`eximia-workspace-${userId}`);
}

export async function encrypt(
  plaintext: string,
  masterPassword: string,
  userId?: string
): Promise<{ ciphertext: string; iv: string }> {
  const salt = getSalt(userId ?? "default");
  const key = await deriveKey(masterPassword, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    (getEncoder().encode(plaintext)).buffer as ArrayBuffer
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  };
}

export async function decrypt(
  ciphertext: string,
  iv: string,
  masterPassword: string,
  userId?: string
): Promise<string> {
  const salt = getSalt(userId ?? "default");
  const key = await deriveKey(masterPassword, salt);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: new Uint8Array(base64ToArrayBuffer(iv)),
    },
    key,
    base64ToArrayBuffer(ciphertext)
  );

  return getDecoder().decode(decrypted);
}
