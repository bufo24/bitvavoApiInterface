const PATH = "path/to/";
module.exports = {
  PORT: 3443, // Port used for server
  USE_SSL: false, // Enables SSL for domain
  // Used when SSL is enabled:
  DOMAIN_PRIVATE_KEY: PATH + "privkey.pem",
  DOMAIN_CERTIFICATE: PATH + "cert.pem",
  DOMAIN_CHAIN: PATH + "chain.pem",
};
