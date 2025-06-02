#!/usr/bin/env node

/**
 * Generate bcrypt password hash for admin account
 * Usage: node generate-admin-hash.js [password]
 */

const bcrypt = require('bcrypt');
const readline = require('readline');

const SALT_ROUNDS = 12;

async function generateHash() {
  const args = process.argv.slice(2);
  let password = args[0];

  if (!password) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    password = await new Promise((resolve) => {
      rl.question('Enter admin password: ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  if (!password || password.length < 8) {
    console.error('Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('\nGenerated bcrypt hash:');
    console.log(hash);
    console.log('\nAdd this to your .env file:');
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  } catch (error) {
    console.error('Error generating hash:', error);
    process.exit(1);
  }
}

generateHash();