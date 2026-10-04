// Generates the two secret environment variables the app needs:
//   SESSION_SECRET  – random key that signs admin session cookies
//   ADMIN_ACCOUNTS  – JSON with the admins' scrypt password HASHES (passwords are never stored)
//
//   npm run make-admin-env
//
// You are prompted for each password (typing is hidden). For automation you may instead provide
// ADMIN_PW_MARK_MEDHAT / ADMIN_PW_MAYER_ROMANY as environment variables.
// Paste the output into Vercel → Project → Settings → Environment Variables. Do NOT commit it.
import readline from 'node:readline';
import { randomBytes } from 'node:crypto';
import { hashPassword } from '../lib/auth.js';

const ADMINS = [
  { username: 'mark.medhat', name: 'Eng. Mark Medhat' },
  { username: 'mayer.romany', name: 'Eng. Mayer Romany' }
];

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    rl._writeToOutput = (text) => { if (!muted || text.includes(question)) rl.output.write(text); };
    rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
    muted = true;
  });
}

const accounts = [];
for (const admin of ADMINS) {
  const envName = `ADMIN_PW_${admin.username.toUpperCase().replace(/\./g, '_')}`;
  const password = process.env[envName] || (await askHidden(`Password for ${admin.name} (${admin.username}): `));
  if (password.length < 12) {
    console.error(`Password for ${admin.username} must be at least 12 characters.`);
    process.exit(1);
  }
  accounts.push({ ...admin, hash: await hashPassword(password) });
}

console.log('\n# Add these to Vercel (Production + Preview). Keep them secret.\n');
console.log(`SESSION_SECRET=${randomBytes(48).toString('base64url')}`);
console.log(`ADMIN_ACCOUNTS=${JSON.stringify(accounts)}`);
