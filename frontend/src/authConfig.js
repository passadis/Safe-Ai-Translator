import { LogLevel, BrowserCacheLocation } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true,
    protocolMode: "OIDC", // Enable OIDC protocol
  },
  cache: {
    cacheLocation: BrowserCacheLocation.SessionStorage,
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false,
    loggerOptions: {
      logLevel: LogLevel.Error,
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      }
    }
  }
};

// Auth request configurations
export const loginRequest = {
  scopes: ["openid", "profile", `api://${import.meta.env.VITE_CLIENT_ID}/access_as_user`],
  responseType: "code", // Request an authorization code
  CodeChallenge: true // Enable PKCE
};

export const apiRequest = {
  scopes: [`api://${import.meta.env.VITE_CLIENT_ID}/access_as_user`]
};