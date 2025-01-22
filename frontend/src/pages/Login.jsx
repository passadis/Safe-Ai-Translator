import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';
import { loginRequest } from '../authConfig';
import { KeyRound } from 'lucide-react';

const Login = () => {
  const { instance } = useMsal();
  const [isHovered, setIsHovered] = useState(false);

  const handleLogin = async () => {
    try {
      // Generate PKCE code verifier and challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store code verifier for token exchange
      sessionStorage.setItem('pkce_verifier', codeVerifier);

      // Request authorization code with PKCE
      await instance.loginRedirect({
        ...loginRequest,
        codeChallenge,
        codeChallengeMethod: 'S256'
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:scale-[1.02]">
        {/* Logo Section */}
        <div className="flex justify-center mb-4">
          <img
            src="/logo.png"
            alt="AI Translator Logo"
            className="h-16 w-auto object-contain"
          />
        </div>
        <div className="flex justify-center mb-6">
          <div className="bg-blue-500 rounded-full p-4 shadow-lg">
            <KeyRound className="w-12 h-12 text-white" />
          </div>
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to AI Translator</h1>
          <p className="text-gray-600">
            Transform your communication with Azure AI-powered translation services
          </p>
          <div className="border-t border-gray-200 my-6"></div>
          <button
            onClick={handleLogin}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:shadow-lg"
          >
            <KeyRound
              className={`w-5 h-5 transition-transform duration-300 ${
                isHovered ? 'translate-x-1' : ''
              }`}
            />
            Sign in
          </button>
          <p className="text-sm text-gray-500 mt-6">
            Secure authentication powered by Azure AD with PKCE
          </p>
        </div>
      </div>
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>© 2025 Safe AI Translator by CloudBlogger. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;