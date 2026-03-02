const DB_NAME = "eximia-workspace-biometric";
const DB_VERSION = 1;
const STORE_NAME = "enrollments";
const KEY_STORE_NAME = "wrapping-keys";

interface BiometricEnrollment {
  appId: string;
  credentialId: string;
  encryptedMasterPassword: string;
  iv: string;
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

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "appId" });
      }
      if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
        db.createObjectStore(KEY_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getWrappingKey(): Promise<CryptoKey> {
  const db = await openDB();

  const existing = await new Promise<CryptoKey | undefined>(
    (resolve, reject) => {
      const tx = db.transaction(KEY_STORE_NAME, "readonly");
      const store = tx.objectStore(KEY_STORE_NAME);
      const request = store.get("wrapping-key");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }
  );

  if (existing) return existing;

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(KEY_STORE_NAME, "readwrite");
    const store = tx.objectStore(KEY_STORE_NAME);
    const request = store.put(key, "wrapping-key");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  return key;
}

export async function saveEnrollment(
  appId: string,
  credentialId: string,
  masterPassword: string
): Promise<void> {
  const wrappingKey = await getWrappingKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    new TextEncoder().encode(masterPassword)
  );

  const enrollment: BiometricEnrollment = {
    appId,
    credentialId,
    encryptedMasterPassword: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  };

  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(enrollment);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getEnrollment(
  appId: string
): Promise<BiometricEnrollment | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(appId);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function getMasterPassword(
  appId: string
): Promise<string | null> {
  const enrollment = await getEnrollment(appId);
  if (!enrollment) return null;

  try {
    const wrappingKey = await getWrappingKey();
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(base64ToArrayBuffer(enrollment.iv)),
      },
      wrappingKey,
      base64ToArrayBuffer(enrollment.encryptedMasterPassword)
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

export async function deleteEnrollment(appId: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(appId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function hasEnrollment(appId: string): Promise<boolean> {
  const enrollment = await getEnrollment(appId);
  return enrollment !== null;
}
