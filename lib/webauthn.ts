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

export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerBiometric(
  userId: string
): Promise<{ credentialId: string } | null> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: "eximIA Workspace Hub",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userId,
          displayName: "Workspace Hub User",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!credential) return null;

    return { credentialId: arrayBufferToBase64(credential.rawId) };
  } catch {
    return null;
  }
}

export async function authenticateBiometric(
  credentialId: string
): Promise<boolean> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: base64ToArrayBuffer(credentialId),
            type: "public-key",
            transports: ["internal"],
          },
        ],
        userVerification: "required",
        timeout: 60000,
      },
    });

    return !!assertion;
  } catch {
    return false;
  }
}
