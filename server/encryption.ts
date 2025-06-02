import _sodium from 'libsodium-wrappers';

let sodium: typeof _sodium | null = null;

// Secure key storage - check environment variables first, then generate if needed
let adminEncryptionKeys: { publicKey: string; privateKey: string } | null = null;
let adminSigningKeys: { publicKey: string; privateKey: string } | null = null;

// Load keys from environment variables or generate new ones
function loadOrGenerateKeys() {
  // Try to load from environment variables first
  if (process.env.ADMIN_ENCRYPTION_PUBLIC_KEY && process.env.ADMIN_ENCRYPTION_PRIVATE_KEY) {
    adminEncryptionKeys = {
      publicKey: process.env.ADMIN_ENCRYPTION_PUBLIC_KEY,
      privateKey: process.env.ADMIN_ENCRYPTION_PRIVATE_KEY
    };
    console.log("Loaded admin encryption keys from environment variables");
  }
  
  if (process.env.ADMIN_SIGNING_PUBLIC_KEY && process.env.ADMIN_SIGNING_PRIVATE_KEY) {
    adminSigningKeys = {
      publicKey: process.env.ADMIN_SIGNING_PUBLIC_KEY,
      privateKey: process.env.ADMIN_SIGNING_PRIVATE_KEY
    };
    console.log("Loaded admin signing keys from environment variables");
  }
}

export async function initializeServerEncryption(): Promise<boolean> {
  try {
    await _sodium.ready;
    sodium = _sodium;
    
    // Load keys from environment first
    loadOrGenerateKeys();
    
    // Generate keys only if not loaded from environment
    if (!adminEncryptionKeys) {
      adminEncryptionKeys = await generateAdminKeyPair();
      console.warn("⚠️  Generated new admin encryption keypair. For production, set ADMIN_ENCRYPTION_PUBLIC_KEY and ADMIN_ENCRYPTION_PRIVATE_KEY in environment variables.");
      console.log("Public Key (add to environment):", adminEncryptionKeys.publicKey);
      console.log("Private Key (add to environment):", adminEncryptionKeys.privateKey);
    }
    
    if (!adminSigningKeys) {
      adminSigningKeys = await generateAdminSigningKeyPair();
      console.warn("⚠️  Generated new admin signing keypair. For production, set ADMIN_SIGNING_PUBLIC_KEY and ADMIN_SIGNING_PRIVATE_KEY in environment variables.");
      console.log("Signing Public Key (add to environment):", adminSigningKeys.publicKey);
      console.log("Signing Private Key (add to environment):", adminSigningKeys.privateKey);
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