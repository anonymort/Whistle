import sodium from 'libsodium-wrappers';

let isInitialized = false;
let adminPublicKey: Uint8Array | null = null;

/**
 * Initialize libsodium and fetch admin public key
 */
export async function initializeEncryption(): Promise<void> {
  if (isInitialized && adminPublicKey) {
    return;
  }

  try {
    // Initialize libsodium
    await sodium.ready;
    
    // Fetch admin public key from server
    const response = await fetch('/api/admin/public-key');
    if (!response.ok) {
      throw new Error(`Failed to fetch public key: ${response.status}`);
    }
    
    const { publicKey } = await response.json();
    if (!publicKey) {
      throw new Error('No public key received from server');
    }
    
    // Convert base64 public key to Uint8Array
    adminPublicKey = sodium.from_base64(publicKey);
    isInitialized = true;
    
    console.log('Client-side encryption initialized successfully');
  } catch (error) {
    console.error('Failed to initialize client-side encryption:', error);
    throw new Error('Unable to initialize secure encryption. Please try again.');
  }
}

/**
 * Encrypt data using libsodium sealed box encryption
 */
export async function encryptData(plaintext: string): Promise<string> {
  if (!isInitialized || !adminPublicKey) {
    await initializeEncryption();
  }
  
  if (!adminPublicKey) {
    throw new Error('Encryption not properly initialized');
  }
  
  try {
    // Convert plaintext to Uint8Array
    const plaintextBytes = sodium.from_string(plaintext);
    
    // Encrypt using sealed box (anonymous encryption)
    const ciphertext = sodium.crypto_box_seal(plaintextBytes, adminPublicKey);
    
    // Convert to base64 for storage
    const ciphertextBase64 = sodium.to_base64(ciphertext);
    
    // Create the structured format expected by the backend
    const encryptedData = {
      algorithm: 'libsodium-sealed-box',
      data: ciphertextBase64,
      checksum: sodium.to_base64(sodium.crypto_generichash(32, plaintextBytes))
    };
    
    return JSON.stringify(encryptedData);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data securely');
  }
}

/**
 * Encrypt file content
 */
export async function encryptFile(file: File): Promise<string> {
  if (!isInitialized || !adminPublicKey) {
    await initializeEncryption();
  }
  
  if (!adminPublicKey) {
    throw new Error('Encryption not properly initialized');
  }
  
  try {
    // Read file as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);
    
    // Encrypt file content
    const encryptedBytes = sodium.crypto_box_seal(fileBytes, adminPublicKey);
    const encryptedBase64 = sodium.to_base64(encryptedBytes);
    
    // Create file metadata structure
    const encryptedFileData = {
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      algorithm: 'libsodium-sealed-box',
      data: encryptedBase64,
      checksum: sodium.to_hex(sodium.crypto_generichash(32, fileBytes))
    };
    
    return JSON.stringify(encryptedFileData);
  } catch (error) {
    console.error('File encryption failed:', error);
    throw new Error('Failed to encrypt file securely');
  }
}

/**
 * Check if encryption is properly initialized
 */
export function isEncryptionReady(): boolean {
  return isInitialized && adminPublicKey !== null;
}

/**
 * Get encryption status for debugging
 */
export function getEncryptionStatus(): { initialized: boolean; hasPublicKey: boolean } {
  return {
    initialized: isInitialized,
    hasPublicKey: adminPublicKey !== null
  };
}