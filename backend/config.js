let config = {
    tenantID: null,
    clientID: null
  };
  
  const updateConfig = (newConfig) => {
    config = { ...config, ...newConfig };
  };
  
  const getConfig = () => config;
  
  module.exports = { updateConfig, getConfig };