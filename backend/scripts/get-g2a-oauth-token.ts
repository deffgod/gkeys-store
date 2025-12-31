/**
 * Get G2A OAuth2 Token for Import API
 * 
 * Documentation: https://www.g2a.com/integration-api/documentation/import/#section/Authentication/oAuth2
 * 
 * Usage:
 *   npx tsx scripts/get-g2a-oauth-token.ts
 *   npx tsx scripts/get-g2a-oauth-token.ts --env=sandbox
 *   npx tsx scripts/get-g2a-oauth-token.ts --env=live
 *   npx tsx scripts/get-g2a-oauth-token.ts --clientId=xxx --clientSecret=xxx --env=sandbox
 * 
 * The token is used in Authorization header:
 *   Authorization: "Bearer <access_token>"
 */

import 'dotenv/config';

// Default values from environment or fallback
const DEFAULT_CLIENT_ID = process.env.G2A_API_KEY || process.env.G2A_CLIENT_ID || 'ibHtsEljmCxjOFAn';
const DEFAULT_CLIENT_SECRET = process.env.G2A_API_HASH || process.env.G2A_CLIENT_SECRET || 'HrsPmuOlWjqBMHnQWIgfchUqBTBYcRph';
const DEFAULT_ENV = (process.env.G2A_ENV || 'sandbox') as 'sandbox' | 'live';

interface OAuth2TokenResponse {
  access_token: string;
  expires_in: number; // seconds
  token_type: string;
  scope?: string;
}

interface OAuth2ErrorResponse {
  error: string;
  error_description?: string;
}

/**
 * Get OAuth2 token from G2A API
 */
async function getOAuth2Token(
  clientId: string,
  clientSecret: string,
  env: 'sandbox' | 'live' = 'sandbox'
): Promise<OAuth2TokenResponse> {
  // Determine token endpoint based on environment
  const tokenUrl = env === 'sandbox'
    ? 'https://sandboxapi.g2a.com/oauth/token'
    : 'https://api.g2a.com/integration-api/oauth/token';

  console.log(`\n🔐 Requesting OAuth2 token from: ${tokenUrl}`);
  console.log(`📋 Environment: ${env}`);
  console.log(`🔑 Client ID: ${clientId.substring(0, 8)}...`);

  // Prepare request body
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as OAuth2ErrorResponse;
      throw new Error(
        `Failed to get OAuth2 token: ${error.error}${error.error_description ? ` - ${error.error_description}` : ''}`
      );
    }

    return data as OAuth2TokenResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unexpected error: ${String(error)}`);
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): {
  clientId: string;
  clientSecret: string;
  env: 'sandbox' | 'live';
} {
  const args = process.argv.slice(2);
  let clientId = DEFAULT_CLIENT_ID;
  let clientSecret = DEFAULT_CLIENT_SECRET;
  let env = DEFAULT_ENV;

  for (const arg of args) {
    if (arg.startsWith('--clientId=')) {
      clientId = arg.split('=')[1];
    } else if (arg.startsWith('--clientSecret=')) {
      clientSecret = arg.split('=')[1];
    } else if (arg.startsWith('--env=')) {
      const envValue = arg.split('=')[1];
      if (envValue !== 'sandbox' && envValue !== 'live') {
        throw new Error(`Invalid environment: ${envValue}. Must be 'sandbox' or 'live'`);
      }
      env = envValue as 'sandbox' | 'live';
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
G2A OAuth2 Token Generator

Usage:
  npx tsx scripts/get-g2a-oauth-token.ts
  npx tsx scripts/get-g2a-oauth-token.ts --env=sandbox
  npx tsx scripts/get-g2a-oauth-token.ts --env=live
  npx tsx scripts/get-g2a-oauth-token.ts --clientId=xxx --clientSecret=xxx --env=sandbox

Options:
  --clientId=xxx      G2A Client ID (default: from G2A_API_KEY or G2A_CLIENT_ID env var)
  --clientSecret=xxx  G2A Client Secret (default: from G2A_API_HASH or G2A_CLIENT_SECRET env var)
  --env=sandbox|live  Environment (default: sandbox)
  --help, -h          Show this help message

Environment Variables:
  G2A_API_KEY or G2A_CLIENT_ID      - Client ID
  G2A_API_HASH or G2A_CLIENT_SECRET - Client Secret
  G2A_ENV                           - Environment (sandbox or live)

Endpoints:
  Sandbox: https://sandboxapi.g2a.com/oauth/token
  Live:    https://api.g2a.com/integration-api/oauth/token

Example:
  npx tsx scripts/get-g2a-oauth-token.ts --env=sandbox
`);
      process.exit(0);
    }
  }

  return { clientId, clientSecret, env };
}

/**
 * Main function
 */
async function main() {
  try {
    const { clientId, clientSecret, env } = parseArgs();

    console.log('\n🔑 G2A OAuth2 Token Generator\n');
    console.log('📋 Configuration:');
    console.log(`   Client ID: ${clientId}`);
    console.log(`   Client Secret: ${clientSecret.substring(0, 10)}...${clientSecret.substring(clientSecret.length - 5)}`);
    console.log(`   Environment: ${env}`);

    const tokenResponse = await getOAuth2Token(clientId, clientSecret, env);

    console.log('\n✅ OAuth2 Token obtained successfully!');
    console.log('\n📝 Token Details:');
    console.log(`   Access Token: ${tokenResponse.access_token}`);
    console.log(`   Token Type: ${tokenResponse.token_type}`);
    console.log(`   Expires In: ${tokenResponse.expires_in} seconds (${Math.floor(tokenResponse.expires_in / 60)} minutes)`);
    if (tokenResponse.scope) {
      console.log(`   Scope: ${tokenResponse.scope}`);
    }

    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
    console.log(`   Expires At: ${expiresAt.toISOString()}`);

    console.log('\n💡 Usage in Authorization header:');
    console.log(`   Authorization: "Bearer ${tokenResponse.access_token}"`);
    console.log('\n📋 Full header example:');
    console.log(`   Authorization: Bearer ${tokenResponse.access_token}`);
    console.log('');

    // Save token to file (optional)
    const tokenFile = `.g2a-token-${env}.json`;
    const tokenData = {
      access_token: tokenResponse.access_token,
      token_type: tokenResponse.token_type,
      expires_in: tokenResponse.expires_in,
      expires_at: expiresAt.toISOString(),
      scope: tokenResponse.scope,
      environment: env,
      obtained_at: new Date().toISOString(),
    };

    const fs = await import('fs/promises');
    await fs.writeFile(tokenFile, JSON.stringify(tokenData, null, 2));
    console.log(`💾 Token saved to: ${tokenFile}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
