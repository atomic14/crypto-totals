const rp = require('request-promise');
const chalk = require('chalk');
const tickers = require('./tickers.json');

async function getTotals(tickers) {
  const prices = JSON.parse(await rp('https://api.coinmarketcap.com/v1/ticker?limit=0'));
  return Object.keys(tickers).sort().map((ticker) => {
    price = prices.find(price => price.symbol === ticker);
    if (!price) {
      throw new Error(`Cannot find ticker: ${ticker}`);
    }
    return {
      ticker,
      quantity: tickers[ticker],
      usd: Number(price.price_usd),
      btc: Number(price.price_btc)
    }
  });
}

function format(string, count = 20) {
  if(typeof string === 'number') {
    string = Number(string).toFixed(2);
  }
  return string + ' '.repeat(count - string.length);
}

function output(results) {
  const output = [[format('Ticker'), format('Quantity'), format('USD'), format('BTC')],
                  ...results.map((row) => [format(row.ticker), format(row.quantity), format(row.usd), format(row.btc)]),
                  [format('Totals'), format(''), 
                    format(results.reduce((total, row) => total + row.usd, 0)), 
                    format(results.reduce((total, row) => total + row.btc, 0))
                  ]
                ];
  console.log(chalk.bold(output[0].join('')));
  for(i = 1; i < output.length - 1; i++) {
    console.log(chalk.grey(output[i].join('')));
  }
  console.log(chalk.bold(output[output.length - 1].join('')));
}

getTotals(tickers).then(output, (error) => {
  console.log(error);
});
