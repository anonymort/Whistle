import _sodium from 'libsodium-wrappers';

let sodium: typeof _sodium | null = null;

export const PUBLIC_KEY = import.meta.env.VITE_PUBLIC_KEY || "";

// Fetch public key from server
export async function fetchPublicKey(): Promise<string> {
  try {
    const response = await fetch('/api/admin/public-key');
    if (!response.ok) {
      throw new Error('Failed to fetch public key');
    }
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error('Failed to fetch public key from server:', error);
    throw error;
  }
}

export async function initializeEncryption(): Promise<boolean> {
  try {
    await _sodium.ready;
    sodium = _sodium;
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
      throw new Error("Encryption library failed to initialize");
    }
  }

  try {
    // Get the public key from environment or generate one for development
    let publicKeyBase64 = PUBLIC_KEY;
    
    // If no public key is configured, generate a temporary one for development
    if (!publicKeyBase64) {
      const tempKeyPair = sodium!.crypto_box_keypair();
      publicKeyBase64 = sodium!.to_base64(tempKeyPair.publicKey);
      
      // Store the private key for development decryption
      sessionStorage.setItem('dev_private_key', sodium!.to_base64(tempKeyPair.privateKey));
    }

    // Convert base64 public key to Uint8Array
    const publicKey = sodium!.from_base64(publicKeyBase64);
    
    // Convert string data to Uint8Array
    const messageBytes = sodium!.from_string(data);
    
    // Encrypt using sealed box (anonymous encryption)
    const encryptedBytes = sodium!.crypto_box_seal(messageBytes, publicKey);
    
    // Create structured encrypted data with metadata and integrity verification
    const encryptedData = {
      algorithm: "libsodium-sealed-box",
      data: sodium!.to_base64(encryptedBytes),
      publicKey: publicKeyBase64,
      timestamp: Date.now(),
      version: "1.0",
      checksum: sodium!.to_base64(sodium!.crypto_generichash(32, messageBytes))
    };
    
    return btoa(JSON.stringify(encryptedData));
  } catch (error) {
    console.error("Encryption failed:", error);
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

// Generate signing keypair for message authentication
export async function generateSigningKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  if (!sodium) {
    await initializeEncryption();
  }
  
  const keyPair = sodium!.crypto_sign_keypair();
  
  return {
    publicKey: sodium!.to_base64(keyPair.publicKey),
    privateKey: sodium!.to_base64(keyPair.privateKey)
  };
}

// Sign data with a private signing key for message integrity
export async function signData(data: string, privateSigningKey: string): Promise<string> {
  if (!sodium) {
    await initializeEncryption();
  }
  
  const privateKey = sodium!.from_base64(privateSigningKey);
  const messageBytes = sodium!.from_string(data);
  const signature = sodium!.crypto_sign_detached(messageBytes, privateKey);
  
  return sodium!.to_base64(signature);
}

// Verify message signature
export async function verifySignature(data: string, signature: string, publicSigningKey: string): Promise<boolean> {
  if (!sodium) {
    await initializeEncryption();
  }
  
  try {
    const publicKey = sodium!.from_base64(publicSigningKey);
    const messageBytes = sodium!.from_string(data);
    const signatureBytes = sodium!.from_base64(signature);
    
    return sodium!.crypto_sign_verify_detached(signatureBytes, messageBytes, publicKey);
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}
