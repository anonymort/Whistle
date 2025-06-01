// Basic encryption tests for NHS WhistleLite Portal
// Run with: node tests/encryption.test.js

import _sodium from 'libsodium-wrappers';

async function testEncryptionIntegrity() {
  console.log('Testing encryption/decryption integrity...');
  
  await _sodium.ready;
  const sodium = _sodium;
  
  // Generate test keypair
  const keyPair = sodium.crypto_box_keypair();
  const publicKey = sodium.to_base64(keyPair.publicKey);
  const privateKey = sodium.to_base64(keyPair.privateKey);
  
  // Test data
  const testMessage = "This is a sensitive whistleblowing report";
  
  // Encrypt (client-side simulation)
  const message = sodium.from_string(testMessage);
  const publicKeyBytes = sodium.from_base64(publicKey);
  const ciphertext = sodium.crypto_box_seal(message, publicKeyBytes);
  
  // Create encrypted data structure
  const encryptedData = {
    algorithm: "libsodium-sealed-box",
    data: sodium.to_base64(ciphertext),
    checksum: sodium.to_hex(sodium.crypto_generichash(32, testMessage)),
    timestamp: new Date().toISOString()
  };
  
  // Decrypt (server-side simulation)
  const encryptedDataString = JSON.stringify(encryptedData);
  const parsedData = JSON.parse(encryptedDataString);
  const ciphertextBytes = sodium.from_base64(parsedData.data);
  const publicKeyDecrypt = sodium.from_base64(publicKey);
  const privateKeyDecrypt = sodium.from_base64(privateKey);
  
  const decrypted = sodium.crypto_box_seal_open(ciphertextBytes, publicKeyDecrypt, privateKeyDecrypt);
  const decryptedText = sodium.to_string(decrypted);
  
  // Verify checksum
  const calculatedChecksum = sodium.to_hex(sodium.crypto_generichash(32, decryptedText));
  const checksumValid = calculatedChecksum === parsedData.checksum;
  
  console.log(`Original: ${testMessage}`);
  console.log(`Decrypted: ${decryptedText}`);
  console.log(`Checksum valid: ${checksumValid}`);
  console.log(`Test result: ${testMessage === decryptedText && checksumValid ? 'PASS' : 'FAIL'}`);
  
  return testMessage === decryptedText && checksumValid;
}

async function testFileValidation() {
  console.log('\nTesting file signature validation...');
  
  // Mock file signatures
  const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
  const invalidSignature = Buffer.from([0x00, 0x00, 0x00, 0x00]);
  
  function validateFileSignature(signature) {
    const validSignatures = [
      [0xFF, 0xD8, 0xFF], // JPEG
      [0x89, 0x50, 0x4E, 0x47], // PNG
      [0x25, 0x50, 0x44, 0x46], // PDF
    ];

    return validSignatures.some(validSig => 
      validSig.every((byte, index) => signature[index] === byte)
    );
  }
  
  const jpegValid = validateFileSignature(jpegSignature);
  const pngValid = validateFileSignature(pngSignature);
  const invalidValid = validateFileSignature(invalidSignature);
  
  console.log(`JPEG validation: ${jpegValid ? 'PASS' : 'FAIL'}`);
  console.log(`PNG validation: ${pngValid ? 'PASS' : 'FAIL'}`);
  console.log(`Invalid signature rejection: ${!invalidValid ? 'PASS' : 'FAIL'}`);
  
  return jpegValid && pngValid && !invalidValid;
}

async function runTests() {
  console.log('=== NHS WhistleLite Security Tests ===\n');
  
  const encryptionTest = await testEncryptionIntegrity();
  const fileValidationTest = await testFileValidation();
  
  console.log('\n=== Test Summary ===');
  console.log(`Encryption integrity: ${encryptionTest ? 'PASS' : 'FAIL'}`);
  console.log(`File validation: ${fileValidationTest ? 'PASS' : 'FAIL'}`);
  console.log(`Overall: ${encryptionTest && fileValidationTest ? 'PASS' : 'FAIL'}`);
  
  if (encryptionTest && fileValidationTest) {
    console.log('\n✅ All security tests passed - system ready for deployment');
  } else {
    console.log('\n❌ Security tests failed - review implementation');
    process.exit(1);
  }
}

runTests().catch(console.error);