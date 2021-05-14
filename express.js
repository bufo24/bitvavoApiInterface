const fs = require("fs");
const http = require("http");
const https = require("https");
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());

const { API_KEY, API_SECRET } = require("./keys");
const {
  USE_SSL,
  PORT,
  DOMAIN_PRIVATE_KEY,
  DOMAIN_CERTIFICATE,
  DOMAIN_CHAIN,
} = require("./options");

const port = PORT;

const bitvavo = require("bitvavo")().options({
  APIKEY: API_KEY,
  APISECRET: API_SECRET,
  ACCESSWINDOW: 10000,
  RESTURL: "https://api.bitvavo.com/v2",
  WSURL: "wss://ws.bitvavo.com/v2/",
  DEBUGGING: false,
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/currentPrice", async (req, res) => {
  try {
    let response = await bitvavo.tickerPrice({ market: "BTC-EUR" });
    res.json(response.price);
  } catch (error) {
    res.json(error);
  }
});

app.get("/tradeStats", async (req, res) => {
  let output = { btc: 0, costs: 0, investments: 0, staking: 0 };
  try {
    let response = await bitvavo.trades("BTC-EUR", {
      start: 1617573600000,
    });
    for (let entry of response) {
      output.btc += +entry.amount;
      output.costs += +entry.amount * +entry.price + +entry.fee;
      output.investments++;
    }
  } catch (error) {
    console.log(error);
  }
  try {
    let response = await bitvavo.balance({ symbol: "BTC" });
    for (let entry of response) {
      output.staking += +response[0].available - output.btc;
      output.btc += output.staking;
    }
  } catch (error) {
    console.log(error);
  }
  res.json(output);
});

app.get("/trades", async (req, res) => {
  let output = [];
  try {
    let response = await bitvavo.trades("BTC-EUR", {
      start: 1617573600000,
    });
    for (let entry of response) {
      output.push(entry);
    }
    res.json(output.reverse());
  } catch (error) {
    console.log(error);
  }
});

app.get("/priceHistory", async (req, res) => {
  let output = [];
  try {
    let response = await bitvavo.candles("BTC-EUR", "1d", {
      start: 1617573600000,
    });
    for (let entry of response) {
      output.push({ price: entry[4], timestamp: entry[0] });
    }
    res.json(output.reverse());
  } catch (error) {
    console.log(error);
  }
});

if (USE_SSL) {
  const privateKey = fs.readFileSync(DOMAIN_PRIVATE_KEY, "utf8");
  const certificate = fs.readFileSync(DOMAIN_CERTIFICATE, "utf8");
  const ca = fs.readFileSync(DOMAIN_CHAIN, "utf8");
  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca,
  };
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(port, () => {
    console.log("HTTPS Server running on port", PORT);
  });
} else {
  const httpServer = http.createServer(app);
  httpServer.listen(port, () => {
    console.log("HTTP Server running on port", PORT);
  });
}
