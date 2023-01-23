const _ = require("underscore");
const Binance = require("node-binance-api");
const BinanceSecond = require('binance-api-node').default
const [exchange_accounts] = require('../modules/databases/mongo_models')
const {parse} = require("dotenv");

const TAG = "binance_exchange.js : ";

// var binance = new Binance().options({
//     APIKEY: 'xQGnYMVmagYEucU77UzcLPVk0g3pX3xrkeeiKH6CAMlBvE1Mpy0QMbI2nkHeSlGk',
//     APISECRET: '0ownzjyUldXdYoLO7rdY5wbK2gljHt9fJP2bmtg3lfHkLMel3mXGpFhXmm1j7meG',
//     reconnect: false
// });

// const binance = new Binance().options({
//     APIKEY: 'Wx5FrI7LatBdVJJ4PKVTfr3SHsJu1f4x15M1iQBz7swMQz5gCNCw4HHIjF1Of9gV',
//     APISECRET: 'ty0p1Kwxz0p9tr1HwXHw6gYJ098GBmKFZRCloS5dXtaH1uB8S9TWT45siHYU3Ku1',
//     reconnect: false
// });

const client = BinanceSecond()
var client2;
var binance;

async function findApiKeySecret(user_id, done) {
    exchange_accounts.findOne({user_id: user_id, exchange_id: "1"}, function (err, user) {
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

function binanceKeySecret(apiKey, apiSecret) {
    binance = new Binance().options({
        APIKEY: apiKey,
        APISECRET: apiSecret,
        reconnect: false,
        useServerTime: true,
    });
}

async function accountStatus(api_key, api_secret, done) {
    client2 = BinanceSecond({
        apiKey: api_key,
        apiSecret: api_secret,
    });
    await client2.accountInfo().then(accountInfo => {
        done(true, accountInfo);
    }).catch(error => {
        done(false, error);
    })
}

async function accountBalance(currency_type, user_id, exchange_type, done) {
    await findApiKeySecret(user_id, async function (status, user) {
        if (status) {
            client2 = BinanceSecond({
                apiKey: user.api_key,
                apiSecret: user.api_secret,
            });

            await client2.accountInfo().then(accountInfo => {
                if (currency_type) {
                    done(true, accountInfo.balances.find(obj => obj.asset === currency_type));
                } else {
                    var balances = accountInfo.balances;
                    var balancesArray = balances.filter(function (balance) {
                        return balance.free > 0
                    })
                    done(true, balancesArray);
                }
            }).catch(error => {
                done(false, error);
            })
        } else {
            done(false, 'That email is not registered')
        }
    });
}

async function openOrdersList(symbol, user_id, exchange_type, done) {
    await findApiKeySecret(user_id, async function (status, user) {
        if (status) {
            binanceKeySecret(user.api_key, user.api_secret);

            if (symbol === "false") {
                binance.openOrders(false, (error, openOrders) => {
                    console.info("openOrders() false : ", openOrders.length);
                    var openOrdersArray = [];
                    var openOrdersObject = {
                        symbol: 'XLMBTC',
                        orderId: 11271740,
                        clientOrderId: 'ekHkROfW98gBN80LTfufQZ',
                        price: '0.00001081',
                        origQty: '1331.00000000',
                        executedQty: '0.00000000',
                        status: 'NEW',
                        timeInForce: 'GTC',
                        type: 'LIMIT',
                        side: 'BUY',
                        stopPrice: '0.00000000',
                        icebergQty: '0.00000000',
                        time: 1522682290485,
                        isWorking: true,
                    }

                    openOrdersArray.push(openOrdersObject)
                    openOrdersArray.push(openOrdersObject)
                    return done(error, openOrdersArray);
                });
            } else {
                client2 = BinanceSecond({
                    apiKey: user.api_key,
                    apiSecret: user.api_secret,
                });

                client2.openOrders({symbol: symbol}).then(res => {
                    return done(true, res);
                }).catch(error => {
                    return done(false, error);
                })

                // binance.openOrders(symbol, (error, openOrders) => {
                //     console.info("openOrders() : ", openOrders.length);
                //     var openOrdersArray = [];
                //     var openOrdersObject = {
                //         symbol: 'XLMBTC',
                //         orderId: 11271740,
                //         clientOrderId: 'ekHkROfW98gBN80LTfufQZ',
                //         price: '0.00001081',
                //         origQty: '1331.00000000',
                //         executedQty: '0.00000000',
                //         status: 'NEW',
                //         timeInForce: 'GTC',
                //         type: 'LIMIT',
                //         side: 'BUY',
                //         stopPrice: '0.00000000',
                //         icebergQty: '0.00000000',
                //         time: 1522682290485,
                //         isWorking: true,
                //     }
                //
                //     openOrdersArray.push(openOrdersObject)
                //     openOrdersArray.push(openOrdersObject)
                //     return done(error, openOrdersArray);
                // });
            }
        } else {
            done(false, 'That email is not registered')
        }
    });
}

async function tradesList(user_id, exchange_type, symbol, limit, fromId, orderId, startTime, endTime, done) {
    await findApiKeySecret(user_id, async function (status, user) {
        if (status) {
            client2 = BinanceSecond({
                apiKey: user.api_key,
                apiSecret: user.api_secret,
            });
            var options = {symbol: symbol}
            if (startTime) {
                options.startTime = startTime;
            }
            if (endTime) {
                options.endTime = endTime;
            }
            if (limit) {
                options.limit = limit;
            }
            if (fromId) {
                options.fromId = fromId;
            }
            if (orderId) {
                options.orderId = orderId;
            }

            await client2.myTrades(options).then(myTrades => {
                done(true, myTrades);
            }).catch(err => {
                done(false, err);
            })
        } else {
            done(false, 'That email is not registered', symbol)
        }
    });
}

async function orders_list(symbol, user_id, exchange_type, limit, done) {
    await findApiKeySecret(user_id, async function (status, user) {
        if (status) {
            client2 = BinanceSecond({
                apiKey: user.api_key,
                apiSecret: user.api_secret,
            });
            var options = {symbol: symbol}
            if (limit) {
                options.limit = limit;
            }
            await client2.allOrders(options).then(orders => {
                done(true, orders);
            }).catch(err => {
                done(false, err);

            })
        } else {
            done(false, 'That email is not registered')
        }
    });
}

async function ticker(pair, done) {
    if (pair) {
        await client.prices({symbol: pair}).then(prices => {
            done(true, prices)
        }).catch(err => {
            done(false, err)
        });
    } else {
        await client.prices().then(prices => {
            done(true, prices)
        }).catch(err => {
            done(false, err)
        });
    }
}

async function ticker24hr(pair, done) {
    if (pair) {
        await client.dailyStats({symbol: pair}).then(stats => {
            done(true, stats)
        }).catch(err => {
            done(false, err)
        })
    } else {
        await client.dailyStats().then(stats => {
            done(true, stats)
        }).catch(err => {
            done(false, err)
        })
    }
}

async function candlesticks(pair, interval, limit, startTime, endTime, done) {
    var options = {symbol: pair};
    if (startTime) {
        options.startTime = startTime;
    }
    if (endTime) {
        options.endTime = endTime;
    }
    if (limit) {
        options.limit = limit;
    }
    if (interval) {
        options.interval = interval;
    }
    await client.candles(options).then(candles => {
        done(true, candles);
    }).catch(err => {
        done(false, err);
    });
}

async function accountSnapShot(user_id, exchange_type, startTime, endTime, limit, done) {
    var options = {type: "SPOT"};
    if (limit) {
        options.limit = limit;
    }
    if (startTime) {
        options.startTime = startTime;
    }
    if (endTime) {
        options.endTime = endTime;
    }

    await findApiKeySecret(user_id, async function (status, user) {
        if (status) {
            client2 = BinanceSecond({
                apiKey: user.api_key,
                apiSecret: user.api_secret,
            });

            await client2.accountSnapshot(options).then(accountSnapshot => {
                done(true, accountSnapshot);
            }).catch(err => {
                done(false, err);
            })
        } else {
            done(false, 'That email is not registered');
        }
    });
}

async function protfolio(user_id, exchange_type, done) {
    await findApiKeySecret(user_id, async function (status, user) {
        if (status) {
            client2 = BinanceSecond({
                apiKey: user.api_key,
                apiSecret: user.api_secret,
            });
            var options = {type: "SPOT"};
            await client2.accountSnapshot(options).then(async accountSnapshot => {
                var snapshotVosLength = accountSnapshot.snapshotVos.length;
                var lastTotalAssetOfBtc = accountSnapshot.snapshotVos[snapshotVosLength - 1].data.totalAssetOfBtc;
                var secondLastTotalAssetOfBtc = accountSnapshot.snapshotVos[snapshotVosLength - 2].data.totalAssetOfBtc;
                var change = lastTotalAssetOfBtc - secondLastTotalAssetOfBtc;
                var changePercentage = (change / secondLastTotalAssetOfBtc) * 100
                change = change.toPrecision(8);
                changePercentage = changePercentage.toPrecision(8);
                var assetUsdtValue = lastTotalAssetOfBtc;
                var btc_price;
                await client.prices({symbol: "BTCUSDT"}).then(async prices => {
                    btc_price = prices.BTCUSDT;
                    assetUsdtValue = btc_price * lastTotalAssetOfBtc;

                    await client2.accountInfo().then(async res => {
                        var balances = res.balances;
                        var balancesArray = balances.filter(function (balance) {
                            return balance.free > 0
                        })
                        var response = {
                            'totalAssetOfBtc': lastTotalAssetOfBtc,
                            'btc_price': btc_price,
                            'change': change,
                            'change_percent': changePercentage,
                            'usdt_value': assetUsdtValue,
                            'totalAssets': balancesArray.length
                        }
                        done(true, response);
                    }).catch(err => {
                        done(false, err)
                    })
                }).catch(err => {
                    done(false, err)
                });
            }).catch(err => {
                done(false, err);
            })
        } else {
            done(false, 'That email is not registered');
        }
    });
}

async function currentAllocations(user_id, exchange_type, done) {
    await findApiKeySecret(user_id, async function (status, user) {
        if (status) {
            client2 = BinanceSecond({
                apiKey: user.api_key,
                apiSecret: user.api_secret,
            })

            client2.accountInfo().then(async result => {
                var responseArray = [];
                var balances = result.balances
                var balancesArray = balances.filter(function (balance) {
                    return balance.free > 0 || balance.locked > 0;
                })

                var prices;
                await client.prices().then(res => {
                    prices = res
                }).catch(err => {
                    done(false, err)
                });

                var resArray = [];
                var totalUSDT = 0;
                for (const balance of balancesArray) {
                    var resObject = {}
                    if (balance.asset == "USDT" || balance.asset == "BUSD") {
                        resObject.asset = balance.asset
                        resObject.usdtPrice = balance.free
                        resObject.freeAmount = balance.free
                        resObject.lockedAmount = balance.locked
                        totalUSDT += parseFloat(balance.free)
                    } else {
                        resObject.asset = balance.asset
                        resObject.usdtPrice = parseFloat(prices[balance.asset + "USDT"]) * parseFloat(balance.free)
                        resObject.freeAmount = balance.free
                        resObject.lockedAmount = balance.locked
                        totalUSDT += parseFloat(prices[balance.asset + "USDT"]) * parseFloat(balance.free)
                    }
                    resArray.push(resObject);
                }

                for (const res of resArray) {
                    var response = {}
                    var allocationPercent = (res.usdtPrice / totalUSDT) * 100
                    allocationPercent = allocationPercent.toPrecision(2);
                    response = {assetname: res.asset, allocationPercent: parseFloat(allocationPercent)};
                    responseArray.push(response);
                }
                done(true, responseArray);
            }).catch(error => {
                done(false, error);
            })
        } else {
            done(false, 'That email is not registered');
        }
    })
}

async function balanceProtfolio(user_id, exchange_type, done) {
    await findApiKeySecret(user_id, async function (status, user) {
        if (status) {
            var responseArray = [];
            var responseObject = {}
            client2 = BinanceSecond({
                apiKey: user.api_key,
                apiSecret: user.api_secret,
            });
            await client2.accountInfo().then(async res => {
                var balances = res.balances;
                var balancesArray = balances.filter(function (balance) {
                    return balance.free > 0
                })

                for (var i = 0; i < balancesArray.length; i++) {
                    responseObject = {}
                    var pair_usdt = balancesArray[i].asset + 'USDT'
                    var balance = parseFloat(balancesArray[i].locked) + parseFloat(balancesArray[i].free)
                    responseObject.asset = balancesArray[i].asset
                    responseObject.pair_usdt = pair_usdt
                    responseObject.balance = balance
                    responseArray.push(responseObject);
                }

                await client.prices().then(async prices => {
                    for (let i = 0; i < responseArray.length; i++) {
                        if (responseArray[i].asset == 'USDT' || responseArray[i].asset == 'BUSD') {
                            responseArray[i].current_market_value = responseArray[i].balance
                            responseArray[i].average_price = "1.00"
                            responseArray[i].price_change_24hour = '0.00'
                            responseArray[i].price_change_24hour_percent = '0.00'
                        } else {
                            var asset_usdt_value = parseFloat(prices[responseArray[i].pair_usdt]) * parseFloat(responseArray[i].balance)
                            responseArray[i].current_market_value = asset_usdt_value
                            const avgPrice = await client.avgPrice({symbol: responseArray[i].pair_usdt})
                            const price_change_24hour = await client.dailyStats({symbol: responseArray[i].pair_usdt})
                            responseArray[i].average_price = avgPrice.price
                            responseArray[i].price_change_24hour = price_change_24hour.priceChange
                            responseArray[i].price_change_24hour_percent = price_change_24hour.priceChangePercent
                        }
                        responseArray[i].cost_basis = 0
                        responseArray[i].net_base_purchased = 0
                        responseArray[i].profit_loss_average = 0
                        responseArray[i].profit_loss_percent = 0
                        responseArray[i].total_quote_spent = 0
                    }
                    done(true, responseArray)
                }).catch(err => {
                    done(false, err)
                });

            }).catch(err => {
                console.log(TAG + "balanceProtfolio status catch error: " + err);
                done(false, err)
            })
        } else {
            done(false, 'That email is not registered');
        }
    });
}

async function createTrade(user_id, options, done) {
    await findApiKeySecret(user_id, async function (status, user) {
        if (status) {
            console.log(TAG + "createTrade : " + JSON.stringify(options))
            console.log(TAG + "user.api_key : " + user.api_key)
            console.log(TAG + "user.api_secret : " + user.api_secret)

            client2 = BinanceSecond({
                apiKey: user.api_key,
                apiSecret: user.api_secret,
            });

            await client2.order(options).then(async res => {
                done(true, res);
            }).catch(err => {
                done(false, err.toString());
            })
        } else {
            done(false, 'That email is not registered');
        }
    });
}

async function cancelOrder(user_id, symbol, order_id, done) {
    await findApiKeySecret(user_id, async function (status, user) {
        if (status) {
            client2 = BinanceSecond({
                apiKey: user.api_key,
                apiSecret: user.api_secret,
            });
            var options = {symbol: symbol, orderId: order_id}

            await client2.cancelOrder(options).then(async res => {
                done(true, res);
            }).catch(err => {
                done(false, err.toString());
            })
        } else {
            done(false, 'That email is not registered');
        }
    });
}

async function cancelAllOrders(user_id, symbol, done) {
    await findApiKeySecret(user_id, async function (status, user) {
        if (status) {
            client2 = BinanceSecond({
                apiKey: user.api_key,
                apiSecret: user.api_secret,
            });
            var options = {symbol: symbol}

            await client2.cancelOpenOrders(options).then(async res => {
                done(true, res);
            }).catch(err => {
                done(false, err.toString());
            })
        } else {
            done(false, 'That email is not registered');
        }
    });
}


async function sellAllAsset(user_id, exchange_type, asset_name, done) {
    await findApiKeySecret(user_id, async function (status, user) {
        if (status) {
            done(true, "Asset successfully sold");
        } else {
            done(false, "Email not exists");
        }
    })
}

async function exchangeStats(done) {
    client.dailyStats().then(async data => {
        var symbolsLength = data.length;
        var tradingVolume = 0;
        for (var i = 0; i < data.length; i++) {
            tradingVolume += parseFloat(data[i].volume)
        }
        var response = {"twentyFourHourVolume": tradingVolume, "totalPairs": symbolsLength}
        done(true, response);
    }).catch(err => {
        console.log(TAG + "exchangeInfo error : " + err)
        done(false, err)
    })
}

async function exchangeInfo(done) {
    client.exchangeInfo().then(async data => {
        done(true, data);
    }).catch(err => {
        console.log(TAG + "exchangeInfo error : " + err)
        done(false, err)
    })
}

async function exchangeAllAssets(done) {
    client2 = BinanceSecond({
        apiKey: "Wx5FrI7LatBdVJJ4PKVTfr3SHsJu1f4x15M1iQBz7swMQz5gCNCw4HHIjF1Of9gV",
        apiSecret: "ty0p1Kwxz0p9tr1HwXHw6gYJ098GBmKFZRCloS5dXtaH1uB8S9TWT45siHYU3Ku1",
    });
    client2.accountCoins().then(async data => {
        done(true, data);
    }).catch(err => {
        console.log(TAG + "exchangeInfo error : " + err)
        done(false, err)
    })
}

module.exports = [accountBalance, openOrdersList, tradesList, orders_list, ticker, ticker24hr, candlesticks, accountStatus, accountSnapShot, protfolio, currentAllocations, balanceProtfolio, createTrade, cancelOrder, cancelAllOrders, sellAllAsset, exchangeStats, exchangeInfo, exchangeAllAssets];
