module.exports = {
  PORT: 3443, // Port used for server
  USE_SSL: true, // Enables SSL for domain
  // Used when SSL is enabled:
  DOMAIN_PRIVATE_KEY: "path/to/privkey.pem",
  DOMAIN_CERTIFICATE: "path/to/cert.pem",
  DOMAIN_CHAIN: "path/to/chain.pem",
};
