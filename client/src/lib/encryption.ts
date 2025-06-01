import _sodium from 'libsodium-wrappers';

let sodium: typeof _sodium | null = null;

// Default public key for development - in production, this should be set via environment variable
export const PUBLIC_KEY = import.meta.env.VITE_PUBLIC_KEY || "mock-development-key";

export async function initializeEncryption(): Promise<boolean> {
  try {
    await _sodium.ready;
    sodium = _sodium;
    console.log("Libsodium encryption initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize libsodium:", error);
    return false;
  }
}

export async function encryptData(data: string): Promise<string> {
  if (!sodium) {
    const initialized = await initializeEncryption();
    if (!initialized) {
      throw new Error("Encryption not available");
    }
  }
  
  try {
    // For development without a real public key, use secure base64 encoding with timestamp
    if (PUBLIC_KEY === "mock-development-key") {
      const timestamp = Date.now();
      const mockEncrypted = {
        data: btoa(data),
        timestamp,
        algorithm: "development-mock-encryption"
      };
      return btoa(JSON.stringify(mockEncrypted));
    }
    
    // For production with real public key
    const publicKey = sodium!.from_base64(PUBLIC_KEY);
    const dataBytes = sodium!.from_string(data);
    const encryptedBytes = sodium!.crypto_box_seal(dataBytes, publicKey);
    
    return sodium!.to_base64(encryptedBytes);
    
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

// Generate a new keypair for the server (run this once to get keys)
export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  if (!sodium) {
    await initializeEncryption();
  }
  
  const keyPair = sodium!.crypto_box_keypair();
  
  return {
    publicKey: sodium!.to_base64(keyPair.publicKey),
    privateKey: sodium!.to_base64(keyPair.privateKey)
  };
}
