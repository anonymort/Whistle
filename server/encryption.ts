import _sodium from 'libsodium-wrappers';

let sodium: typeof _sodium | null = null;

// Store keys in memory (in production, use secure key storage)
let adminEncryptionKeys: { publicKey: string; privateKey: string } | null = null;
let adminSigningKeys: { publicKey: string; privateKey: string } | null = null;

export async function initializeServerEncryption(): Promise<boolean> {
  try {
    await _sodium.ready;
    sodium = _sodium;
    
    // Initialize admin keys if not present
    if (!adminEncryptionKeys) {
      adminEncryptionKeys = await generateAdminKeyPair();
      console.log("Generated new admin encryption keypair");
      console.log("Public Key (share this with client):", adminEncryptionKeys.publicKey);
    }
    
    if (!adminSigningKeys) {
      adminSigningKeys = await generateAdminSigningKeyPair();
      console.log("Generated new admin signing keypair");
    }
    
    return true;
  } catch (error) {
    console.error("Failed to initialize server encryption:", error);
    return false;
  }
}

// Generate encryption keypair for the admin
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

// Generate signing keypair for message authentication
export async function generateAdminSigningKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  if (!sodium) {
    await initializeServerEncryption();
  }
  
  const keyPair = sodium!.crypto_sign_keypair();
  
  return {
    publicKey: sodium!.to_base64(keyPair.publicKey),
    privateKey: sodium!.to_base64(keyPair.privateKey)
  };
}

// Get the current admin public key for encryption
export function getAdminPublicKey(): string | null {
  return adminEncryptionKeys?.publicKey || null;
}

// Decrypt data using the admin's private key
export async function decryptData(encryptedDataString: string): Promise<string> {
  if (!sodium) {
    await initializeServerEncryption();
  }
  
  try {
    // Parse the encrypted data structure
    let encryptedData;
    try {
      // Try direct JSON first (new format)
      encryptedData = JSON.parse(encryptedDataString);
    } catch (e) {
      // Try base64-encoded JSON (legacy format)
      try {
        encryptedData = JSON.parse(atob(encryptedDataString));
      } catch (e2) {
        throw new Error("Invalid encrypted data format");
      }
    }

    // Handle different encryption algorithms
    if (encryptedData.algorithm === "development-mock-encryption") {
      // Legacy development format
      return atob(encryptedData.data);
    } else if (encryptedData.algorithm === "libsodium-sealed-box") {
      // Real libsodium encryption
      if (!adminEncryptionKeys) {
        throw new Error("Admin encryption keys not initialized");
      }
      
      const privateKeyBytes = sodium!.from_base64(adminEncryptionKeys.privateKey);
      const publicKeyBytes = sodium!.from_base64(adminEncryptionKeys.publicKey);
      const encryptedBytes = sodium!.from_base64(encryptedData.data);
      
      // Decrypt using sealed box
      const decryptedBytes = sodium!.crypto_box_seal_open(encryptedBytes, publicKeyBytes, privateKeyBytes);
      const decryptedText = sodium!.to_string(decryptedBytes);
      
      // Verify integrity if checksum is present
      if (encryptedData.checksum) {
        const expectedChecksum = sodium!.to_base64(sodium!.crypto_generichash(32, sodium!.from_string(decryptedText)));
        if (expectedChecksum !== encryptedData.checksum) {
          throw new Error("Data integrity check failed");
        }
      }
      
      return decryptedText;
    } else {
      throw new Error(`Unsupported encryption algorithm: ${encryptedData.algorithm}`);
    }
    
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

// Verify message signature
export async function verifyMessageSignature(message: string, signature: string, publicKey: string): Promise<boolean> {
  if (!sodium) {
    await initializeServerEncryption();
  }
  
  try {
    const publicKeyBytes = sodium!.from_base64(publicKey);
    const messageBytes = sodium!.from_string(message);
    const signatureBytes = sodium!.from_base64(signature);
    
    return sodium!.crypto_sign_verify_detached(signatureBytes, messageBytes, publicKeyBytes);
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}

// Rotate admin keys (for security best practices)
export async function rotateAdminKeys(): Promise<{ encryptionKeys: any; signingKeys: any }> {
  adminEncryptionKeys = await generateAdminKeyPair();
  adminSigningKeys = await generateAdminSigningKeyPair();
  
  console.log("Admin keys rotated successfully");
  console.log("New encryption public key:", adminEncryptionKeys.publicKey);
  console.log("New signing public key:", adminSigningKeys.publicKey);
  
  return {
    encryptionKeys: adminEncryptionKeys,
    signingKeys: adminSigningKeys
  };
}