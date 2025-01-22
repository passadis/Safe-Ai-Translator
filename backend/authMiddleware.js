const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const util = require('util');
const { getConfig } = require('./config');

// Initialize JWKS client with a function to create it with updated config
let client = null;

const initializeJwksClient = (tenantId) => {
  try {
    console.log('Initializing JWKS client with tenant ID:', tenantId);
    client = jwksClient({
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      cache: true,
      cacheMaxAge: 86400000,
      rateLimit: true,
      jwksRequestsPerMinute: 10
    });
    console.log('✅ JWKS client initialized successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize JWKS client:', error);
    throw error;
  }
};

const authMiddleware = async (req, res, next) => {
  console.log('\n=== Starting Token Validation ===');
  try {
    // Get current configuration from config.js
    const config = getConfig();
    const tenantId = config.tenantID || process.env.AZURE_AD_TENANT_ID;
    const clientId = config.clientID || process.env.AZURE_AD_CLIENT_ID;

    // Log configuration status
    console.log('\n=== Configuration Check ===');
    console.log('Config from getConfig():', config);
    console.log('Tenant ID:', tenantId ? '✅ Present' : '❌ Missing');
    console.log('Client ID:', clientId ? '✅ Present' : '❌ Missing');

    if (!tenantId || !clientId) {
      console.error('❌ Missing required configuration');
      console.error('Tenant ID:', tenantId ? 'Present' : 'Missing');
      console.error('Client ID:', clientId ? 'Present' : 'Missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Initialize or update JWKS client if needed
    if (!client) {
      try {
        client = initializeJwksClient(tenantId);
      } catch (error) {
        console.error('❌ Failed to initialize JWKS client');
        console.error('Error details:', error.message);
        return res.status(500).json({ error: 'Failed to initialize authentication client' });
      }
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    console.log('📝 Token received');

    // Rest of the middleware code remains the same...
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken) {
      console.log('❌ Could not decode token');
      return res.status(401).json({ error: 'Invalid token format' });
    }

    console.log('\n=== Token Header ===');
    console.log(JSON.stringify(decodedToken.header, null, 2));
    console.log('\n=== Token Payload ===');
    console.log(JSON.stringify({
      aud: decodedToken.payload.aud,
      iss: decodedToken.payload.iss,
      scp: decodedToken.payload.scp,
      azp: decodedToken.payload.azp
    }, null, 2));

    let signingKey;
    try {
      console.log('🔑 Retrieving signing key for kid:', decodedToken.header.kid);
      const key = await util.promisify(client.getSigningKey.bind(client))(decodedToken.header.kid);
      signingKey = key.getPublicKey();
      console.log('✅ Signing key retrieved successfully');
    } catch (error) {
      console.error('❌ Failed to retrieve signing key');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error details:', error.stack);
      return res.status(500).json({ 
        error: 'Failed to validate token', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      });
    }

    const verifyOptions = {
      algorithms: ['RS256'],
      issuer: decodedToken.payload.iss,
      audience: `api://${clientId}`
    };

    console.log('\n=== Verification Options ===');
    console.log(JSON.stringify(verifyOptions, null, 2));

    try {
      const verified = await new Promise((resolve, reject) => {
        jwt.verify(token, signingKey, verifyOptions, (err, decoded) => {
          if (err) {
            console.log('❌ Token verification failed:', err.message);
            reject(err);
          } else {
            console.log('✅ Token verified successfully');
            resolve(decoded);
          }
        });
      });

      // Check scopes
      const scopes = verified.scp || '';
      const scopeArray = typeof scopes === 'string' ? scopes.split(' ') : scopes;
      console.log('\n=== Scopes ===');
      console.log('Available scopes:', scopeArray);

      if (!scopeArray.includes('access_as_user')) {
        console.log('❌ Missing required scope: access_as_user');
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      console.log('✅ Scope validation passed');
      console.log('=== Token Validation Complete ===\n');

      req.user = verified;
      next();
    } catch (error) {
      console.log('\n=== Verification Error Details ===');
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      return res.status(401).json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('\n=== Unexpected Error ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = authMiddleware;