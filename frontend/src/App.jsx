import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { msalConfig } from './authConfig';
import TranslatorApp from './components/TranslatorApp';
import Login from './pages/Login';
import './App.css';
import './index.css';

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize PKCE code verifier
const generateCodeVerifier = () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  const verifier = Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
  sessionStorage.setItem('pkce_verifier', verifier);
  return verifier;
};

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        
        // Generate and store PKCE verifier
        generateCodeVerifier();
        
        // Handle redirect
        const response = await msalInstance.handleRedirectPromise();
        
        if (response) {
          const account = response.account;
          msalInstance.setActiveAccount(account);
        } else {
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            msalInstance.setActiveAccount(accounts[0]);
          }
        }
      } catch (error) {
        console.error('MSAL initialization failed:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeMsal();
  }, []);

  if (!isInitialized) {
    return <div>Initializing...</div>;
  }

  return (
    <MsalProvider instance={msalInstance}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/translatorapp" replace />} />
          <Route
            path="/login"
            element={
              <>
                <AuthenticatedTemplate>
                  <Navigate to="/translatorapp" replace />
                </AuthenticatedTemplate>
                <UnauthenticatedTemplate>
                  <Login />
                </UnauthenticatedTemplate>
              </>
            }
          />
          <Route
            path="/translatorapp"
            element={
              <>
                <AuthenticatedTemplate>
                  <TranslatorApp />
                </AuthenticatedTemplate>
                <UnauthenticatedTemplate>
                  <Navigate to="/login" replace />
                </UnauthenticatedTemplate>
              </>
            }
          />
        </Routes>
      </Router>
    </MsalProvider>
  );
};

export default App;