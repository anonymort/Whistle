import crypto from "crypto";

// Secure password hashing using PBKDF2
export function hashPassword(password: string): string {
  const salt = process.env.SESSION_SECRET || 'fallback-salt';
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

// Secure password comparison that prevents timing attacks
export function verifyPassword(inputPassword: string, storedPassword: string): boolean {
  const hashedInput = hashPassword(inputPassword);
  const hashedStored = hashPassword(storedPassword);
  
  return crypto.timingSafeEqual(
    Buffer.from(hashedInput),
    Buffer.from(hashedStored)
  );
}