import _sodium from 'libsodium-wrappers';

let sodium: typeof _sodium | null = null;

export async function initializeServerEncryption(): Promise<boolean> {
  try {
    await _sodium.ready;
    sodium = _sodium;
    return true;
  } catch (error) {
    console.error("Failed to initialize server encryption:", error);
    return false;
  }
}

// Generate a new keypair for the admin (run this once to get keys)
export async function generateAdminKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  if (!sodium) {
    await initializeServerEncryption();
  }
  
  const keyPair = sodium!.crypto_box_keypair();
  
  return {
    publicKey: sodium!.to_base64(keyPair.publicKey),
    privateKey: sodium!.to_base64(keyPair.privateKey)
  };
}

// Decrypt data using the admin's private key
export async function decryptData(encryptedData: string, privateKey: string): Promise<string> {
  if (!sodium) {
    await initializeServerEncryption();
  }
  
  try {
    // For development mock encryption, handle decryption
    if (encryptedData.startsWith('eyJ')) { // Base64 JSON
      const decoded = JSON.parse(atob(encryptedData));
      if (decoded.algorithm === "development-mock-encryption") {
        return atob(decoded.data);
      }
    }
    
    // For real libsodium encryption
    const privateKeyBytes = sodium!.from_base64(privateKey);
    const publicKey = sodium!.crypto_box_seed_keypair(privateKeyBytes).publicKey;
    const encryptedBytes = sodium!.from_base64(encryptedData);
    
    const decryptedBytes = sodium!.crypto_box_seal_open(encryptedBytes, publicKey, privateKeyBytes);
    return sodium!.to_string(decryptedBytes);
    
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}