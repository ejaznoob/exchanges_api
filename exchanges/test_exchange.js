const _ = require("underscore");
const [exchange_accounts] = require('../modules/databases/mongo_models')
const [postRequest, getRequest] = require('../Extension/api_calls');
const mongoose = require("mongoose");
const Binance = require('binance-api-node').default


const TAG = "test_exchange.js : ";
const client = Binance()

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

async function accountRegister(user_id, fetch, exchange_id, update, done) {
    await fetchUserData(user_id, async function (status, user) {
        if (status) {
            return done(true, user);
        } else {
            let reqData = {
                fetch: fetch,
                user_id: user_id,
            };
            let endpoint = "register_user"
            await getRequest(endpoint, reqData, null, async function (status, response) {
                if (status) {
                    let user = new exchange_accounts({
                        user_id: user_id,
                        exchange_id: exchange_id,
                        api_account: "Test user",
                        api_token: response.apikey,
                        active: 1
                    });
                    user.save(function (err, user) {
                        if (err) {
                            return done(false, err);
                        } else {
                            return done(true, user);
                        }
                    })
                } else {
                    return done(false, "That email is not registered")
                }
            })
        }
    });
}

async function accountBalanceTest(currency_type, user_id, done) {
    await fetchUserData(user_id, async function (status, user) {
        if (status) {
            let reqData = {
                currency: currency_type,
            };
            let endpoint = "auth/user_balance"
            await getRequest(endpoint, reqData, user.api_token, async function (status, response) {
                if (status) {
                    done(true, response.message)
                } else {
                    done(false, response)
                }
            })
        } else {
            done(false, 'That email is not registered')
        }
    });
}

async function openOrderTest(user_id, order_pair, done) {
    await fetchUserData(user_id, async function (status, user) {
        if (status) {
            let reqData = {
                pair: order_pair
            };
            let endpoint = "auth/open_orders"
            await getRequest(endpoint, reqData, user.api_token, async function (status, response) {
                if (status) {
                    var resposeArray = []
                    for (let key in response.res) {
                        var resposeObject = {}
                        var unixTimestamp = Math.floor(new Date(response.res[key].createdAt).getTime() / 1000);
                        resposeObject.symbol = response.res[key].pair
                        resposeObject.orderId = response.res[key]._id
                        resposeObject.clientOrderId = response.res[key].fk_user_id.toString()
                        resposeObject.price = response.res[key].price.toString()
                        resposeObject.origQty = response.res[key].amount.toString()
                        resposeObject.executedQty = (parseFloat(response.res[key].amount) - parseFloat(response.res[key].remaining_amount)).toString()
                        resposeObject.timeInForce = "GTC"
                        resposeObject.type = "LIMIT"
                        resposeObject.side = response.res[key].type
                        resposeObject.stopPrice = "0.00000000"
                        resposeObject.icebergQty = "0.00000000"
                        resposeObject.time = unixTimestamp
                        resposeObject.isWorking = true
                        resposeArray.push(resposeObject)
                    }
                    done(true, resposeArray)
                } else {
                    done(false, response)
                }
            })
        } else {
            done(false, 'That email is not registered')
        }
    });
}

async function tradesTest(user_id, trade_pair, done) {
    await fetchUserData(user_id, async function (status, user) {
        if (status) {
            let reqData = {
                pair: trade_pair
            };
            let endpoint = "auth/trades"
            await getRequest(endpoint, reqData, user.api_token, async function (status, response) {
                if (status) {
                    var resposeArray = []
                    for (let key in response.res) {
                        var resposeObject = {}
                        var unixTimestamp = Math.floor(new Date(response.res[key].createdAt).getTime() / 1000);
                        var quoteQty = parseFloat(response.res[key].amount) * parseFloat(response.res[key].price)

                        resposeObject.symbol = response.res[key].pair
                        resposeObject.orderId = response.res[key]._id
                        resposeObject.id = response.res[key]._id
                        resposeObject.orderListId = response.res[key]._id
                        resposeObject.price = response.res[key].price.toString()
                        resposeObject.qty = response.res[key].amount.toString()
                        resposeObject.quoteQty = quoteQty.toString()
                        resposeObject.commission = "0.00000000"
                        resposeObject.commissionAsset = "USDT"
                        resposeObject.time = unixTimestamp
                        resposeObject.isBuyer = response.res[key].type == "BUY"
                        resposeObject.isMaker = response.res[key].type == "SELL"
                        resposeObject.isBestMatch = true
                        resposeArray.push(resposeObject)
                    }
                    done(true, resposeArray)
                } else {
                    done(false, response)
                }
            })
        } else {
            console.log(TAG, "accountBalance error : ", user);
            done(false, 'That email is not registered')
        }
    });
}

async function portfolioTest(user_id, done) {
    await fetchUserData(user_id, async function (status, user) {
        if (status) {
            let reqData = {
                currency: null,
            };
            let endpoint = "auth/user_balance";
            await getRequest(
                endpoint,
                reqData,
                user.api_token,
                async function (status, response) {
                    if (status) {
                        var resposeObject = {};
                        let btcPrice = await client.prices();
                        var usdtTotal = 0;
                        response.message.forEach((element) => {
                            if (element.asset == "USDT" || element.asset == "BUSD") {
                                usdtTotal += parseFloat(element.free) + parseFloat(element.locked);
                            } else {
                                let pair = element.asset + "USDT";
                                let freeLocked = parseFloat(element.free) + parseFloat(element.locked);
                                usdtTotal += freeLocked * parseFloat(btcPrice[pair]);
                            }
                        });
                        let btcObject = await client.dailyStats({ symbol: "BTCUSDT" });

                        resposeObject.totalAssetOfBtc = usdtTotal / parseFloat(btcPrice["BTCUSDT"]);
                        resposeObject.btc_price = btcObject.lastPrice;
                        resposeObject.change = btcObject.priceChange;
                        resposeObject.change_percent = btcObject.priceChangePercent;
                        resposeObject.usdt_value = usdtTotal;
                        resposeObject.totalAssets = response.message?.length;
                        done(true, resposeObject);
                    } else {
                        done(false, response);
                    }
                }
            );
        } else {
            done(false, "That email is not registered");
        }
    });
}

async function currentAllocationTest(user_id, done) {
    await fetchUserData(user_id, async function (status, user) {
        if (status) {
            let reqData = {
                currency: null,
            };
            let endpoint = "auth/user_balance"
            await getRequest(endpoint, reqData, user.api_token, async function (status, response) {
                if (status) {
                    var responseArray = [];
                    var resArray = [];
                    var totalUSDT = 0;
                    var prices;
                    await client.prices().then(res => {
                        prices = res
                    }).catch(err => {
                        done(false, err)
                    });
                    for (const balance of response.message) {
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
                    done(true, responseArray)
                } else {
                    done(false, response)
                }
            })
        } else {
            done(false, 'That email is not registered')
        }
    });
}

async function balanceProtfolioTest(user_id, done) {
    await fetchUserData(user_id, async function (status, user) {
        if (status) {
            let reqData = {
                currency: null,
            };
            let endpoint = "auth/user_balance";
            await getRequest(endpoint, reqData, user.api_token,
                async function (status, response) {
                    if (status) {
                        var responseArray = [];
                        var responseObject = {};
                        console.log(TAG, "response : ", response);

                        var balances = response.message;
                        var balancesArray = balances.filter(function (balance) {
                            return balance.free > 0;
                        });
                        for (var i = 0; i < balancesArray.length; i++) {
                            responseObject = {};
                            var pair_usdt = balancesArray[i].asset + "USDT";
                            var balance = parseFloat(balancesArray[i].locked) + parseFloat(balancesArray[i].free);
                            responseObject.asset = balancesArray[i].asset;
                            responseObject.pair_usdt = pair_usdt;
                            responseObject.balance = balance;
                            responseArray.push(responseObject);
                        }

                        await client.prices().then(async (prices) => {
                                for (let i = 0; i < responseArray.length; i++) {
                                    if (responseArray[i].asset == "USDT" || responseArray[i].asset == "BUSD"
                                    ) {
                                        responseArray[i].current_market_value = responseArray[i].balance;
                                        responseArray[i].average_price = "1.00";
                                        responseArray[i].price_change_24hour = "0.00";
                                        responseArray[i].price_change_24hour_percent = "0.00";
                                    } else {
                                        var asset_usdt_value = parseFloat(prices[responseArray[i].pair_usdt]) * parseFloat(responseArray[i].balance);
                                        responseArray[i].current_market_value = asset_usdt_value;
                                        const avgPrice = await client.avgPrice({
                                            symbol: responseArray[i].pair_usdt,
                                        });
                                        const price_change_24hour = await client.dailyStats({
                                            symbol: responseArray[i].pair_usdt,
                                        });
                                        responseArray[i].average_price = avgPrice.price;
                                        responseArray[i].price_change_24hour = price_change_24hour.priceChange;
                                        responseArray[i].price_change_24hour_percent = price_change_24hour.priceChangePercent;
                                    }
                                    responseArray[i].cost_basis = 0;
                                    responseArray[i].net_base_purchased = 0;
                                    responseArray[i].profit_loss_average = 0;
                                    responseArray[i].profit_loss_percent = 0;
                                    responseArray[i].total_quote_spent = 0;
                                }
                                done(true, responseArray);
                            })
                            .catch((err) => {
                                done(false, err);
                            });
                    } else {
                        done(false, response);
                    }
                }
            );
        } else {
            done(false, "That email is not registered");
        }
    });
}


async function accountSnapShotTest(user_id, done) {
    await fetchUserData(user_id, async function (status, user) {
        if (status) {
            let reqData = {};
            let endpoint = "auth/accountSnapShot"
            await getRequest(endpoint, reqData, user.api_token, async function (status, response) {
                if (status) {
                    var resReturn = {
                        code: 200,
                        msg: "",
                    }
                    var snapshotVosArray = []
                    for (var i = 0; i < response.message.length; i++) {
                        var snapshotVos = {
                            type: "spot",
                            updateTime: response.message[i].updateTime,
                        }
                        snapshotVos.data = {
                            totalAssetOfBtc: response.message[i].totalAssetOfBtc,
                            balances: response.message[i].balances,
                        }
                        snapshotVosArray.push(snapshotVos)
                    }
                    resReturn.snapshotVos = snapshotVosArray
                    done(true, resReturn)
                } else {

                    done(false, response)
                }
            })
        } else {
            done(false, 'That email is not registered')
        }
    });
}

async function createTradeTest(user_id, options, done) {
    await fetchUserData(user_id, async function (status, user) {
        if (status) {
            let reqData = {}
            if(options.type == "MARKET"){
                let symbol = options.symbol.toUpperCase()
                symbol = symbol.replace("/", "")
                await client.prices({symbol: symbol}).then(async prices => {
                    console.log("prices finding error")
                    let price = prices[symbol]
                    reqData = {
                        price: price,
                        pair: options.symbol,
                        amount: options.quantity,
                    };
                }).catch(err => {
                    console.log("prices finding error" , err)
                    done(false, err)
                });
            }else{
                reqData = {
                    price: options.price,
                    pair: options.symbol,
                    amount: options.quantity,
                };
            }

            console.log(reqData);
            let endpoint = ""
            if (options.side == "SELL") {
                endpoint = "auth/user_sell"
            } else {
                endpoint = "auth/user_buy"
            }
            await getRequest(endpoint, reqData, user.api_token, async function (status, response) {
                done(status, response)
            })
        } else {
            done(false, 'That email is not registered')
        }
    });
}

async function addBalance(currency, balance, user_id, done) {
    await fetchUserData(user_id, async function (status, user) {
        if (status) {
            let reqData = {
                currency: currency,
                balance: balance,
            };
            console.log(reqData);
            let endpoint = "auth/user_add_balance"

            await postRequest(endpoint, reqData, user.api_token, async function (status, response) {
                console.log(JSON.stringify(response));
                if (status) {
                    done(true, response)
                } else {
                    done(false, response)
                }
            })
        } else {
            console.log(TAG, "accountBalance error : ", user);
            done(false, 'That email is not registered')
        }
    });
}

async function removeBalance(user_id, done) {
    await fetchUserData(user_id, async function (status, user) {
        if (status) {
            let reqData = {};
            let endpoint = "auth/user_remove_balances"

            await postRequest(endpoint, reqData, user.api_token, async function (status, response) {
                if (status) {
                    done(true, response)
                } else {
                    done(false, response)
                }
            })
        } else {
            done(false, 'That email is not registered')
        }
    });
}
async function updateBalance(user_id, done) {
    await fetchUserData(user_id, async function (status, user) {
        if (status) {
            let reqData = {};
            let endpoint = "auth/user_update_balances"

            await postRequest(endpoint, reqData, user.api_token, async function (status, response) {
                if (status) {
                    done(true, response)
                } else {
                    done(false, response)
                }
            })
        } else {
            done(false, 'That email is not registered')
        }
    });
}

async function cancelOrderTest(user_id, symbol, order_id, done) {
    await fetchUserData(user_id, async function (status, user) {
        if (status) {
            let reqData = {
                orderId: order_id,
                pair: symbol
            };
            let endpoint = "auth/user_cancel"

            await postRequest(endpoint, reqData, user.api_token, async function (status, response) {
                if (status) {
                    done(true, response)
                } else {
                    done(false, response)
                }
            })
        } else {
            done(false, 'That email is not registered')
        }
    });
}

async function cancelAllOrdersTest(user_id, symbol, done) {
    await fetchUserData(user_id, async function (status, user) {
        if (status) {
            let reqData = {
                pair: symbol,
            };
            let endpoint = "auth/user_cancel_all"

            await postRequest(endpoint, reqData, user.api_token, async function (status, response) {
                if (status) {
                    done(true, response)
                } else {
                    done(false, response)
                }
            })
        } else {
            done(false, 'That email is not registered')
        }
    });
}

module.exports = [accountRegister, accountBalanceTest, openOrderTest, tradesTest, portfolioTest, currentAllocationTest,
    balanceProtfolioTest, accountSnapShotTest, createTradeTest, addBalance, removeBalance, updateBalance, cancelOrderTest, cancelAllOrdersTest]