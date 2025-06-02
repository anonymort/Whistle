import bcrypt from "bcrypt";

const SALT_ROUNDS = 12; // High security for admin passwords

// Secure password hashing using bcrypt with unique salts
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Secure password comparison using bcrypt's built-in timing-safe comparison
export async function verifyPassword(inputPassword: string, storedHashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(inputPassword, storedHashedPassword);
}