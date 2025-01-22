const express = require('express');
const cors = require('cors');
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');
const axios = require('axios');
const authMiddleware = require('./authMiddleware');
const { updateConfig } = require('./config');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(authMiddleware); // Apply authMiddleware globally

// Thresholds for content moderation
const rejectThresholds = {
  Hate: 2,
  Violence: 2,
  SelfHarm: 2,
  Sexual: 2,
};

// Azure Service Variables
let translatorEndpoint;
let translatorKey;
let contentSafetyEndpoint;
let contentSafetyKey;

async function initializeAzureServices() {
  try {
    const vaultName = process.env.AZURE_KEY_VAULT_NAME;
    if (!vaultName) {
      throw new Error('Key Vault name is required');
    }

    const vaultUrl = `https://${vaultName}.vault.azure.net`;
    const credential = new DefaultAzureCredential({
      managedIdentityClientId: process.env.MANAGED_IDENTITY_CLIENT_ID,
    });

    const secretClient = new SecretClient(vaultUrl, credential);
    const secrets = await loadSecretsFromKeyVault(secretClient);

    translatorEndpoint = secrets.translatorEndpoint;
    translatorKey = secrets.translatorKey;
    contentSafetyEndpoint = secrets.contentSafetyEndpoint;
    contentSafetyKey = secrets.contentSafetyKey;
    clientID = secrets.clientID;
    tenantID = secrets.tenantID;

    console.log('Azure services initialized successfully with Key Authentication');
  } catch (error) {
    console.error('Failed to initialize Azure services:', error);
    throw error;
  }
}

async function loadSecretsFromKeyVault(secretClient) {
  try {
    const [translatorEndpoint, translatorKey, contentSafetyEndpoint, contentSafetyKey, clientID, tenantID] = await Promise.all([
      secretClient.getSecret('TranslatorEndpoint'),
      secretClient.getSecret('TranslatorKey'),
      secretClient.getSecret('ContentSafetyEndpoint'),
      secretClient.getSecret('ContentSafetyKey'),
      secretClient.getSecret('entraClientId'),
      secretClient.getSecret('entraTenantId'), 
    ]);

    const secrets = {
      translatorEndpoint: translatorEndpoint.value,
      translatorKey: translatorKey.value,
      contentSafetyEndpoint: contentSafetyEndpoint.value,
      contentSafetyKey: contentSafetyKey.value,
      clientID: clientID.value,
      tenantID: tenantID.value,
    };

    // Update the config with the secrets
    updateConfig({
      tenantID: secrets.tenantID,
      clientID: secrets.clientID
    });

    return secrets;
  } catch (error) {
    console.error('Error loading secrets from Key Vault:', error);
    throw error;
  }
}
app.use(authMiddleware); // Apply authMiddleware globally
async function analyzeContent(text) {
  try {
    const response = await axios.post(
      `${contentSafetyEndpoint.replace(/\/$/, '')}/contentsafety/text:analyze?api-version=2024-09-01`,
      {
        text,
        categories: ['Hate', 'Sexual', 'SelfHarm', 'Violence'],
        haltOnBlocklistHit: true,
        outputType: 'FourSeverityLevels',
      },
      {
        headers: {
          'Ocp-Apim-Subscription-Key': contentSafetyKey,
          'Ocp-Apim-Subscription-Region': 'swedencentral',
          'Content-Type': 'application/json',
        },
      }
    );

    const flaggedCategories = response.data?.categoriesAnalysis?.filter(
      ({ category, severity }) => rejectThresholds[category] !== undefined && severity >= rejectThresholds[category]
    ) || [];

    console.log('Content Safety API response:', response.data);
    return flaggedCategories;
  } catch (error) {
    console.error('Content analysis error:', error.response?.data || error.message);
    throw error;
  }
}

async function translateText(text, sourceLang, targetLang) {
  try {
    const response = await axios.post(
      `${translatorEndpoint.replace(/\/$/, '')}/translate?api-version=3.0&from=${sourceLang}&to=${targetLang}`,
      [{ text }],
      {
        headers: {
          'Ocp-Apim-Subscription-Key': translatorKey,
          'Ocp-Apim-Subscription-Region': 'swedencentral',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Translation response:', response.data);
    return response.data[0].translations[0].text;
  } catch (error) {
    console.error('Translation error:', error.response?.data || error.message);
    throw error;
  }
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'Server is healthy' });
});

app.post('/translate', async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;

    // First check: Content safety on source text
    const safetyCheck = await analyzeContent(text);
    if (safetyCheck.length > 0) {
      return res.status(400).json({
        error: 'Content Safety Warning',
        details: {
          message: '⚠️ Content flagged by Azure Content Safety',
          categories: safetyCheck,
        },
      });
    }

    // Perform translation
    const translatedText = await translateText(text, sourceLang, targetLang);

    // Second check: Content safety on translated text
    const translatedSafetyCheck = await analyzeContent(translatedText);
    if (translatedSafetyCheck.length > 0) {
      return res.status(400).json({
        error: 'Content Safety Warning',
        details: {
          message: '⚠️ Translated content flagged by Azure Content Safety',
          categories: translatedSafetyCheck,
        },
      });
    }

    res.json({ translatedText });
  } catch (error) {
    console.error('Translation or content safety error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Initialize services and start server
(async () => {
  try {
    await initializeAzureServices();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start the application:', error);
  }
})();
