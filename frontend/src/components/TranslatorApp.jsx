import { useState } from 'react';
import { ArrowLeftRight, Languages, Send, AlertTriangle, LogOut } from 'lucide-react';
import { useMsal } from '@azure/msal-react';
import { apiRequest } from '../authConfig';
import PropTypes from 'prop-types';
import '../App.css';
import '../index.css';

const SelectLanguage = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={onChange}
    className="w-40 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
  >
    {options.map((lang) => (
      <option key={lang.code} value={lang.code}>
        {lang.name}
      </option>
    ))}
  </select>
);

SelectLanguage.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
};

const TranslatorApp = () => {
  const { instance } = useMsal();
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [isLoading, setIsLoading] = useState(false);
  const [safetyAlert, setSafetyAlert] = useState(null);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsLoading(true);
    setSafetyAlert(null);

    try {
      const account = instance.getActiveAccount();
      if (!account) {
        throw new Error('No active account');
      }

      // Get token using PKCE flow
      let tokenResponse;
      try {
        // Try silent token acquisition first
        tokenResponse = await instance.acquireTokenSilent({
          ...apiRequest,
          account: account,
          forceRefresh: false
        });
      } catch {
        // If silent acquisition fails, initiate interactive acquisition with PKCE
        const codeVerifier = sessionStorage.getItem('pkce_verifier');
        if (!codeVerifier) {
          throw new Error('PKCE verifier not found');
        }

        tokenResponse = await instance.acquireTokenPopup({
          ...apiRequest,
          codeVerifier: codeVerifier
        });
      }

      if (!tokenResponse || !tokenResponse.accessToken) {
        throw new Error('Failed to acquire token');
      }

      // const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/translate`, {
        const response = await fetch(`/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenResponse.accessToken}`,
        },
        body: JSON.stringify({ text: sourceText, sourceLang, targetLang }),
      });

      const data = await response.json();

      if (response.status === 400 && data.error === 'Content Safety Warning') {
        setSafetyAlert({
          message: data.details?.message || 'Content flagged by Azure Content Safety',
          details: {
            categories: data.details?.categories || []
          }
        });
        setTranslatedText('');
      } else if (response.ok) {
        setTranslatedText(data.translatedText);
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setSafetyAlert({
        message: 'An error occurred during translation',
        severity: 'Error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pkce_verifier'); // Clear PKCE verifier on logout
    instance.logoutRedirect({
      postLogoutRedirectUri: `${window.location.origin}/login`,
    }).catch(console.error);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'el', name: 'Greek' },
  ];

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
    setSafetyAlert(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="flex-grow p-8">
        {/* Logo Section */}
        <div className="flex justify-center mb-4">
          <img
            src="/logo.png"
            alt="AI Translator Logo"
            className="h-16 w-auto object-contain"
          />
        </div>
        <div className="text-center mb-10">
          <div className="bg-blue-500 rounded-full p-3 w-16 h-16 mx-auto mb-4">
            <Languages className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Translator</h1>
          <p className="text-lg text-gray-600">Powered by Azure AI Services</p>
        </div>

        <div className="container mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center gap-6 mb-8">
            <SelectLanguage
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              options={languages}
            />

            <button
              onClick={swapLanguages}
              className="p-3 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftRight className="w-6 h-6 text-gray-600" />
            </button>

            <SelectLanguage
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              options={languages}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-6 w-full">
            <div className="flex-1">
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Enter text to translate..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex-1">
              <textarea
                value={translatedText}
                readOnly
                placeholder="Translation will appear here..."
                className="w-full h-64 p-4 bg-gray-50 border border-gray-300 rounded-lg resize-none"
              />
            </div>
          </div>

          {safetyAlert && (
            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">{safetyAlert.message}</p>
                  {safetyAlert.details && safetyAlert.details.categories && (
                    <div className="mt-2">
                      {safetyAlert.details.categories
                        .filter(cat => cat.severity >= 2)
                        .map((category, index) => (
                          <p key={index} className="text-sm text-yellow-600">
                            Your content contains {category.category} (severity: {category.severity})
                          </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center mt-6 space-y-4">
            <button
              onClick={handleTranslate}
              disabled={isLoading || !sourceText.trim()}
              className="flex items-center gap-2 px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Translate</span>
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslatorApp;