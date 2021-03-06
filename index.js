const rp = require('request-promise');
const chalk = require('chalk');
var parseXMLString = require('xml2js').parseString;
const tickers = require('./tickers.json');

function xml2json(xml) {
  return new Promise((resolve, reject) => {
    parseXMLString(xml, function (err, json) {
          if (err)
              reject(err);
          else
              resolve(json);
      });

  });
}
function usdToEur(usd, rates) {
  return usd / rates.USD;
}

function usdToGbp(usd, rates) {
  return usdToEur(usd, rates) / rates.USD;
}

async function getPrices(tickers, rates) {
  const prices = JSON.parse(await rp('https://api.coinmarketcap.com/v1/ticker?limit=0'));
  return Object.keys(tickers).sort().map((ticker) => {
    price = prices.find(price => price.symbol === ticker);
    if (!price) {
      throw new Error(`Cannot find ticker: ${ticker}`);
    }
    return {
      ticker: `${price.name} - ${ticker} (\$${Number(price.price_usd).toFixed(2)})`,
      quantity: tickers[ticker],
      usd: Number(price.price_usd),
      btc: Number(price.price_btc),
      gbp: usdToGbp(Number(price.price_usd), rates),
      eur: usdToEur(Number(price.price_usd), rates),
    }
  });
}

// Euro exchange rates
async function getExchangeRates() {
  const rates = await rp('http://www.ecb.int/stats/eurofxref/eurofxref-daily.xml');
  const json = (await xml2json(rates))["gesmes:Envelope"].Cube[0].Cube[0].Cube.map(row => row['$']);
  return json.reduce((currencies, row) => ({[row.currency]: Number(row.rate), ...currencies }), {});
}

function format(string, count = 10) {
  if(typeof string === 'number') {
    string = Number(string).toFixed(2);
  }
  return string + ' '.repeat(Math.max(0, count - string.length));
}

function output(prices) {
  prices.sort((a, b) => b.quantity * b.usd - a.quantity * a.usd);
  const output = [[format('Ticker', 33), format('Quantity'), format('USD'), format('EUR'), format('GBP'), format('BTC')],
                  ...prices.map((row) => [format(row.ticker, 33), format(row.quantity), format(row.quantity * row.usd), format(row.quantity * row.eur), format(row.quantity * row.gbp), format(row.quantity * row.btc)]),
                  [format('Totals', 33), format(''), 
                    format(prices.reduce((total, row) => total + row.quantity * row.usd, 0)), 
                    format(prices.reduce((total, row) => total + row.quantity * row.eur, 0)), 
                    format(prices.reduce((total, row) => total + row.quantity * row.gbp, 0)), 
                    format(prices.reduce((total, row) => total + row.quantity * row.btc, 0))
                  ]
                ];
  console.log(chalk.bold(output[0].join('')));
  for(i = 1; i < output.length - 1; i++) {
    console.log(chalk.grey(output[i].join('')));
  }
  console.log(chalk.bold(output[output.length - 1].join('')));
}

async function main() {
  const rates = await getExchangeRates();
  const prices = await getPrices(tickers, rates);
  output(prices);
}

main(() => {}, console.log);