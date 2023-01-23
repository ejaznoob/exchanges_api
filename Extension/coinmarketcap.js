const _ = require("underscore");
const [exchange_accounts] = require('../modules/databases/mongo_models')
const axios = require('axios');
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();

const api_key = process.env.COINMARKETCAP_API_KEY
const api_url = "https://pro-api.coinmarketcap.com/"

const TAG = "coinmarketcap.js : ";

async function fetchUserData(user_id, done) {
    exchange_accounts.findOne({user_id: user_id, exchange_id: "2"}, function (err, user) {
        if (err) {
            return done(false, err);
        } else {
            if (!user) {
                return done(false, 'That email is not registered');
            } else {
                return done(true, user);
            }
        }
    });
}

async function exchangeInfo(user_id, exchange_id, done) {

    CoinGeckoClient.exchanges.fetchTickers("binance").then(response => {
        console.log(response.data.tickers.length);
        done(true, response);
    }).catch(err => {
        done(false, err);
    })

    // var config = {
    //     headers: {
    //         'X-CMC_PRO_API_KEY': api_key,
    //     },}
    //
    // axios.get(api_url+"v1/exchange/info?slug=binance", config)
    //     .then(function (response) {
    //
    //         if(response.data.status.error_code === 0) {
    //             //var tradingVolume = response.data.data.binance.spot_volume_usd
    //             //var response = {"tradingVolume": tradingVolume}
    //             done(true, response.data.data.binance);
    //         }else{
    //             done(false, response.data);
    //         }
    //     })
    //     .catch(function (error) {
    //         done (false, error);
    //     });
}


module.exports = exchangeInfo