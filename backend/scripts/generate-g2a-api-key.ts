/**
 * Generate G2A API Key for Export API (Developers API)
 * 
 * Formula: sha256(ClientId + Email + ClientSecret)
 * 
 * Usage:
 *   npx tsx scripts/generate-g2a-api-key.ts
 *   npx tsx scripts/generate-g2a-api-key.ts --clientId=xxx --email=xxx --clientSecret=xxx
 * 
 * The generated API key is used in Authorization header:
 *   Authorization: "ClientId, ApiKey"
 */

import crypto from 'crypto';

// Default values for testing
const DEFAULT_CLIENT_ID = 'ibHtsEljmCxjOFAn';
const DEFAULT_EMAIL = 'Welcome@nalytoo.com';
const DEFAULT_CLIENT_SECRET = 'HrsPmuOlWjqBMHnQWIgfchUqBTBYcRph';

/**
 * Generate G2A API Key for Export API
 * @param clientId - G2A Client ID
 * @param email - Email address associated with G2A account
 * @param clientSecret - G2A Client Secret
 * @returns SHA256 hash of (ClientId + Email + ClientSecret)
 */
export function generateG2AApiKey(
  clientId: string,
  email: string,
  clientSecret: string
): string {
  const apiKey = crypto
    .createHash('sha256')
    .update(clientId + email + clientSecret)
    .digest('hex');
  
  return apiKey;
}

/**
 * Parse command line arguments
 */
function parseArgs(): {
  clientId: string;
  email: string;
  clientSecret: string;
} {
  const args = process.argv.slice(2);
  let clientId = DEFAULT_CLIENT_ID;
  let email = DEFAULT_EMAIL;
  let clientSecret = DEFAULT_CLIENT_SECRET;

  for (const arg of args) {
    if (arg.startsWith('--clientId=')) {
      clientId = arg.split('=')[1];
    } else if (arg.startsWith('--email=')) {
      email = arg.split('=')[1];
    } else if (arg.startsWith('--clientSecret=')) {
      clientSecret = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
G2A API Key Generator

Usage:
  npx tsx scripts/generate-g2a-api-key.ts
  npx tsx scripts/generate-g2a-api-key.ts --clientId=xxx --email=xxx --clientSecret=xxx

Options:
  --clientId=xxx     G2A Client ID (default: ${DEFAULT_CLIENT_ID})
  --email=xxx        Email address (default: ${DEFAULT_EMAIL})
  --clientSecret=xxx G2A Client Secret (default: hidden)
  --help, -h         Show this help message

Formula:
  ApiKey = sha256(ClientId + Email + ClientSecret)

Example:
  npx tsx scripts/generate-g2a-api-key.ts --clientId=ibHtsEljmCxjOFAn --email=test@g2a.com --clientSecret=HrsPmuOlWjqBMHnQWIgfchUqBTBYcRph
`);
      process.exit(0);
    }
  }

  return { clientId, email, clientSecret };
}

/**
 * Main function
 */
function main() {
  const { clientId, email, clientSecret } = parseArgs();

  console.log('\n🔑 G2A API Key Generator\n');
  console.log('📋 Input:');
  console.log(`   Client ID: ${clientId}`);
  console.log(`   Email: ${email}`);
  console.log(`   Client Secret: ${clientSecret.substring(0, 10)}...${clientSecret.substring(clientSecret.length - 5)}`);
  console.log('\n🔐 Formula:');
  console.log(`   sha256(ClientId + Email + ClientSecret)`);
  console.log(`   sha256("${clientId}" + "${email}" + "${clientSecret.substring(0, 10)}...")`);
  
  const apiKey = generateG2AApiKey(clientId, email, clientSecret);
  
  console.log('\n✅ Generated API Key:');
  console.log(`   ${apiKey}`);
  console.log(`\n📝 Length: ${apiKey.length} characters (expected: 64)`);
  console.log('\n💡 Usage in Authorization header:');
  console.log(`   Authorization: "${clientId}, ${apiKey}"`);
  console.log('');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
