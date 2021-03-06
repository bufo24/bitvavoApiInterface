const fs = require("fs");
const http = require("http");
const https = require("https");
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(cors());
const bitvavo = require("bitvavo");

const {
  USE_SSL,
  PORT,
  DOMAIN_PRIVATE_KEY,
  DOMAIN_CERTIFICATE,
  DOMAIN_CHAIN,
} = require("./options");

const port = PORT;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/currentPrice", async (req, res) => {
  const API_KEY = req.body.apiKey;
  const API_SECRET = req.body.apiSecret;
  const coin = req.body.coin;
  let b = bitvavo().options({
    APIKEY: API_KEY,
    APISECRET: API_SECRET,
    ACCESSWINDOW: 10000,
    RESTURL: "https://api.bitvavo.com/v2",
    WSURL: "wss://ws.bitvavo.com/v2/",
    DEBUGGING: false,
  });
  try {
    let response = await b.tickerPrice({ market: coin + "-EUR" });
    res.json(response.price);
  } catch (error) {
    res.json(error);
  }
});

app.post("/tradeStats", async (req, res) => {
  let output = {
    btc: 0,
    costs: 0,
    investments: 0,
    staking: 0,
    withdrawalCosts: 0,
    withdrawed: 0,
  };
  const API_KEY = req.body.apiKey;
  const API_SECRET = req.body.apiSecret;
  const start = req.body.start;
  const coin = req.body.coin;
  let b = bitvavo().options({
    APIKEY: API_KEY,
    APISECRET: API_SECRET,
    ACCESSWINDOW: 10000,
    RESTURL: "https://api.bitvavo.com/v2",
    WSURL: "wss://ws.bitvavo.com/v2/",
    DEBUGGING: false,
  });
  try {
    let response = await b.trades(coin + "-EUR", {
      start: start,
    });
    for (let entry of response) {
      if (entry.side == "buy") {
        output.btc += +entry.amount;
        output.costs += +entry.amount * +entry.price + +entry.fee;
        output.investments++;
      } else if (entry.side == "sell") {
        output.btc -= +entry.amount;
        output.costs -= +entry.amount * +entry.price + +entry.fee;
        output.investments--;
      }
    }
  } catch (error) {
    console.log(error);
  }
  try {
    let response = await b.withdrawalHistory({
      start: start,
    });
    for (let entry of response) {
      if (entry.symbol === coin) {
        output.btc -= +entry.fee;
        output.withdrawed += +entry.amount;
      }
    }
  } catch (error) {
    console.log(error);
  }
  try {
    let response = await b.balance({ symbol: coin });
    output.staking = output.withdrawed + +response[0].available - output.btc;
    output.btc += output.staking;
  } catch (error) {
    console.log(error);
  }
  res.json(output);
});

app.post("/trades", async (req, res) => {
  let output = [];
  const API_KEY = req.body.apiKey;
  const API_SECRET = req.body.apiSecret;
  const start = req.body.start;
  const coin = req.body.coin;
  let b = bitvavo().options({
    APIKEY: API_KEY,
    APISECRET: API_SECRET,
    ACCESSWINDOW: 10000,
    RESTURL: "https://api.bitvavo.com/v2",
    WSURL: "wss://ws.bitvavo.com/v2/",
    DEBUGGING: false,
  });
  try {
    let response = await b.trades(coin + "-EUR", {
      start: start,
    });
    for (let entry of response) {
      output.push(entry);
    }
    res.json(output.reverse());
  } catch (error) {
    console.log(error);
  }
});

app.post("/priceHistory", async (req, res) => {
  let output = [];
  const API_KEY = req.body.apiKey;
  const API_SECRET = req.body.apiSecret;
  const start = req.body.start;
  const coin = req.body.coin;
  let b = bitvavo().options({
    APIKEY: API_KEY,
    APISECRET: API_SECRET,
    ACCESSWINDOW: 10000,
    RESTURL: "https://api.bitvavo.com/v2",
    WSURL: "wss://ws.bitvavo.com/v2/",
    DEBUGGING: false,
  });
  try {
    let response = await b.candles(coin + "-EUR", "1d", {
      start: start,
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
