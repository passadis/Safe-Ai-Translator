<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=azure,vite,react,nodejs,express,tailwind,docker,vscode" />
  </a>
</p>

<h1 align="center">Safe AI Translator with Azure AI Services</h1>

## Introduction

This project demonstrates a modern, secure AI translation service powered by Azure AI Services. It features a sleek React frontend, robust Express.js backend, and integrates Azure's AI services for translation and content safety. The application provides real-time translation capabilities while ensuring content safety through Azure's content moderation services. Also, Entra ID authentication is done using MSAL v2 and OAuth 2.0, with the latest Authorization Code Flow with Proof Key for Code Exchange (PKCE). We’ll deploy this application on Azure Container Apps, configure an Application Gateway, and integrate Dapr for a seamless micro-services experience.

## Technologies Used

- **Frontend**: React + Vite with Tailwind CSS
- **Backend**: Node.js with Express.js
- **Authentication**: Azure AD (Entra ID)
- **AI Services**: 
  - Azure AI Translator
  - Azure Content Safety
- **Container Platform**: Azure Container Apps with Dapr with Application Gateway\WAF v2
- **Security**: Azure Key Vault for secrets management

## Features

- Secure authentication with Azure AD
- Real-time text translation across multiple languages
- Content safety verification before translation
- Modern, responsive UI with Tailwind CSS
- Secure secret management with Azure Key Vault
- Containerized deployment with Azure Container Apps
- Microservices communication with Dapr

## Architecture

The system consists of three main components:

1. **React Frontend**
   - Modern UI built with Vite and Tailwind CSS
   - Secure authentication flow
   - Real-time translation interface
   - Responsive design for all devices

2. **Express.js Backend**
   - RESTful API endpoints
   - Azure AI services integration
   - Content safety validation
   - Token-based authentication

3. **Azure Services**
   - Azure AD for authentication
   - Azure AI Translator for language translation
   - Azure Content Safety for content moderation
   - Azure Container Apps for deployment
   - Azure Key Vault for secrets

## Setup and Deployment


### Prerequisites
- Azure subscription
- Node.js (LTS version)
- Azure CLI
- Docker Desktop


### Azure Deployment

1. Create Azure resources

2. Deploy containers

## Security Features

- Azure AD authentication
- Content safety validation
- Secure secret management
- CORS protection
- Input validation
- Token-based API security

## Future Enhancements

- Additional language support
- Translation history
- User preferences
- Custom dictionaries
- Batch translation
- PDF/Document translation
- Mobile app version

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## Architecture
