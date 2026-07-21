const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('hex');

console.log('\n======================================================');
console.log('  ReplySync — Secure Encryption Key Generator');
console.log('======================================================\n');
console.log('Generated 32-byte AES-256 Secret Key:\n');
console.log(`\x1b[32mAPP_ENCRYPTION_KEY=${secret}\x1b[0m\n`);
console.log('Instructions:');
console.log('1. Copy the key above into your local .env.local file');
console.log('2. Add APP_ENCRYPTION_KEY to your Vercel Environment Variables\n');
