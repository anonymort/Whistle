import _sodium from 'libsodium-wrappers';

let sodium: typeof _sodium | null = null;

// Default public key for development - in production, this should be set via environment variable
export const PUBLIC_KEY = import.meta.env.VITE_PUBLIC_KEY || "Gq7X9R8iqOKFZjrJ7tL0mVx4bE2cF5qN9sW1pY6vH3u8dK7zX4gA2rT9mL8vK3nE";

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
    // Convert the public key from base64
    const publicKey = sodium!.from_base64(PUBLIC_KEY);
    
    // Convert data to bytes
    const dataBytes = sodium!.from_string(data);
    
    // Encrypt using sealed box (anonymous encryption)
    const encryptedBytes = sodium!.crypto_box_seal(dataBytes, publicKey);
    
    // Return as base64 string
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
