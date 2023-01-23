const express = require('express');
const [exchange_accounts] = require('../modules/databases/mongo_models')
const [accountBalance, openOrdersList, tradesList, orders_list, ticker, ticker24hr, candlesticks, accountStatus,
    accountSnapShot, protfolio, currentAllocations, balanceProtfolio, createTrade, cancelOrder, cancelAllOrders,
    sellAllAsset, exchangeStats, exchangeInfo, exchangeAllAssets] = require("../exchanges/binance_exchange")
const [accountRegister, accountBalanceTest, openOrderTest, tradesTest, portfolioTest, currentAllocationTest,
    balanceProtfolioTest, accountSnapShotTest, createTradeTest, addBalance, removeBalance, updateBalance, cancelOrderTest, cancelAllOrdersTest] = require("../exchanges/test_exchange")

const router = express.Router();
const TAG = "index.js : ";

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Live exchanges api'});
});

router.post('/register', async function (req, res, next) {
    try {
        let exchange_id = req.body.exchange_type;
        let api_key = req.body.api_key;
        let api_secret = req.body.api_secret;
        let user_id = req.body.user_id;
        let api_account = req.body.api_account;
        let fetch = req.body.fetch;
        let update = req.body.update;

        console.log(TAG + "/register req.body : " + JSON.stringify(req.body));

        if (!exchange_id) {
            exchange_id = 1;
        }
        exchange_id = exchange_id.toString();

        if (!user_id) {
            return res.send({"status": false, 'message': "User id required"});
        }

        if (exchange_id === '1') {
            if (!api_key || !api_secret) {
                return res.send({"status": false, 'message': 'api_key and api_secret needed for Binance'});
            } else {
                await accountStatus(api_key, api_secret, function (status, accountInfo) {
                    if (!status) {
                        return res.send({"status": false, 'message': "Api key invalid or permissions required"});
                    } else {
                        exchange_accounts.findOne({user_id: user_id, exchange_id: exchange_id}, {
                            _id: 0,
                            __v: 0
                        }, function (err, doc) {
                            if (doc) {
                                return res.send({"status": true, 'message': 'User already exists.', 'user': doc});
                            } else {
                                let user = {
                                    exchange_id: exchange_id,
                                    user_id: user_id,
                                    api_account: api_account,
                                    api_key: api_key,
                                    api_secret: api_secret,
                                    active: 1
                                };

                                exchange_accounts.create(user, function (err, doc) {
                                    if (err) {
                                        console.log(TAG + "mongo db error first : " + err);
                                        return res.send({"status": false, 'message': 'Error in creating user.'});
                                    } else {
                                        if (doc != null) {
                                            return res.send({
                                                "status": true,
                                                'message': 'user created successfully',
                                                'user': doc
                                            });
                                        } else {
                                            console.log(TAG + "mongo db error : " + err);
                                            return res.send({"status": false, 'message': 'Error in creating user.'});
                                        }
                                    }
                                })
                            }
                        });
                    }
                });
            }
        } else if (exchange_id === "2") {
            await accountRegister(user_id, fetch, exchange_id, update, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    if (response) {
                        return res.send({"status": true, 'message': 'Register successfully', 'data': response})
                    } else {
                        return res.send({"status": false, 'message': "Error registering user"});
                    }
                }
            })
        } else {
            return res.send({"status": false, 'message': 'Exchange not exist'});
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
});

router.get('/balance', async function (req, res, next) {
    try {
        let exchange_type = req.query.exchange_type;
        let user_id = req.query.user_id;
        let currency = req.query.currency;

        console.log(TAG + "/balance req.query : " + JSON.stringify(req.query));

        if (currency) {
            currency = currency.toUpperCase();
        }
        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (!user_id) {
            return res.send({"status": false, 'message': 'user_id required'});
        }

        if (exchange_type === "1") {
            await accountBalance(currency, user_id, exchange_type, function (status, balance) {
                if (status === false) {
                    return res.send({"status": false, 'message': balance});
                } else {
                    if (balance) {
                        return res.send({"status": true, 'message': 'Data Found', 'balance': balance})
                    } else {
                        return res.send({"status": false, 'message': "Coin not found"});
                    }
                }
            })
        } else if (exchange_type === "2") {
            await accountBalanceTest(currency, user_id, function (status, balance) {
                if (status === false) {
                    return res.send({"status": false, 'message': balance});
                } else {
                    if (balance) {
                        return res.send({"status": true, 'message': 'Data Found', 'balance': balance})
                    } else {
                        return res.send({"status": false, 'message': "Coin not found"});
                    }
                }
            })
        } else {
            return res.send({"status": false, 'message': 'This is not Exchange'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }

});

router.get('/open_orders', async function (req, res, next) {
    try {
        console.log(TAG + "/open_orders req.query : " + JSON.stringify(req.query));
        let exchange_type = req.query.exchange_type;
        var order_pair = req.query.order_pair;
        let user_id = req.query.user_id;

        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (!user_id) {
            return res.send({"status": false, 'message': 'user_id required'});
        }

        if (!order_pair) {
            order_pair = "false";
        } else {
            order_pair = order_pair.toUpperCase();
        }
        if (exchange_type === "1") {
            order_pair = order_pair.replace("/", "")
            console.log(TAG + "order_pair: " + order_pair);
            await openOrdersList(order_pair, user_id, exchange_type, function (error, openOrders) {
                if (error === false) {
                    return res.send({"status": false, 'message': openOrders.message});
                } else {
                    if (openOrders.length === 0) {
                        return res.send({"status": false, 'message': "no open order found for pair " + order_pair});
                    } else {
                        return res.send({"status": true, 'message': 'Data Found', 'data': openOrders})
                    }
                }
            });
        } else if (exchange_type === "2") {
            await openOrderTest(user_id, order_pair, function (error, openOrders) {
                if (error === false) {
                    return res.send({"status": false, 'message': openOrders});
                } else {
                    return res.send({"status": true, 'message': 'Data Found', 'data': openOrders})
                }
            });
        } else {
            return res.send({"status": false, 'message': 'This is not Exchange'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
});

router.get('/trades', async function (req, res, next) {
    try {
        console.log(TAG + "/trades req.query : " + JSON.stringify(req.query));
        let exchange_type = req.query.exchange_type;
        let user_id = req.query.user_id;
        var trade_pair = req.query.trade_pair;
        var limit = req.query.limit;
        var fromId = req.query.fromId;
        var orderId = req.query.orderId;
        var startTime = req.query.startTime;
        var endTime = req.query.endTime;

        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (!user_id) {
            return res.send({"status": false, 'message': 'user_id required'});
        }
        if (!trade_pair) {
            return res.send({"status": false, 'message': 'please provide trade_pair'});
        }

        if (exchange_type === "1") {
            trade_pair = trade_pair.replace("/", "")
            await tradesList(user_id, exchange_type, trade_pair.toUpperCase(), limit, fromId, orderId, startTime, endTime, function (error, trade_list, symbol) {
                if (error === false) {
                    return res.send({"status": false, 'message': trade_list.message});
                } else {
                    if (trade_list.length === 0) {
                        return res.send({"status": false, 'message': "no trade found"});
                    } else {
                        return res.send({"status": true, 'message': 'Data Found', 'data': trade_list})
                    }
                }
            })
        } else if (exchange_type === "2") {
            await tradesTest(user_id, trade_pair, function (error, orders) {
                if (error === false) {
                    return res.send({"status": false, 'message': orders});
                } else {
                    return res.send({"status": true, 'message': 'Data Found', 'data': orders})
                }
            });
        } else {
            return res.send({"status": false, 'message': 'This is not Exchange'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
});

router.get('/orders_list', async function (req, res, next) {
    try {
        let exchange_type = req.query.exchange_type;
        var order_pair = req.query.order_pair;
        var limit = req.query.limit;
        let user_id = req.query.user_id;

        console.log(TAG + "/orders_list req.query : " + JSON.stringify(req.query));

        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (!user_id) {
            return res.send({"status": false, 'message': 'user_id required'});
        }
        if (!order_pair) {
            return res.send({"status": false, 'message': 'Please provide pair'});
        }

        if (exchange_type === "1") {
            order_pair = order_pair.replace("/", "")
            await orders_list(order_pair.toUpperCase(), user_id, exchange_type, limit, function (status, trade_list) {
                if (status === false) {
                    return res.send({"status": false, 'message': trade_list});
                } else {
                    if (trade_list.length === 0) {
                        return res.send({"status": false, 'message': "no orders found"});
                    } else {
                        return res.send({"status": true, 'message': 'Data Found', 'data': trade_list})
                    }
                }
            })
        } else if (exchange_type === "2") {
            await tradesTest(user_id, order_pair, function (error, orders) {
                if (error === false) {
                    return res.send({"status": false, 'message': orders});
                } else {
                    return res.send({"status": true, 'message': 'Data Found', 'data': orders})
                }
            });
        } else {
            return res.send({"status": false, 'message': 'This is not Exchange'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
});

router.get('/ticker', async function (req, res, next) {
    try {
        let exchange_type = req.query.exchange_type;
        var pair = req.query.pair;

        console.log(TAG + "/ticker req.query : " + JSON.stringify(req.query));

        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (exchange_type === "1") {
            if (pair) {
                pair = pair.toUpperCase();
                pair = pair.replace("/", "")
            }
            await ticker(pair, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': 'Data Found', 'price': response});
                }
            })
        } else if (exchange_type === "2") {
            if (pair) {
                pair = pair.toUpperCase();
                pair = pair.replace("/", "")
            }
            await ticker(pair, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': 'Data Found', 'price': response});
                }
            })
        } else {
            return res.send({"status": false, 'message': 'This is not Exchange'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
});

router.get('/ticker24hr', async function (req, res, next) {
    try {
        let exchange_type = req.query.exchange_type;
        var pair = req.query.pair;

        console.log(TAG + "/ticker24hr req.query : " + JSON.stringify(req.query));

        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (exchange_type === "1") {
            if (pair) {
                pair = pair.toUpperCase();
                pair = pair.replace("/", "")
            } else {
                pair = false;
            }
            await ticker24hr(pair, function (status, ticker) {
                if (status === false) {
                    return res.send({"status": false, 'message': ticker});
                } else {
                    return res.send({"status": true, 'message': 'Data Found', 'price': ticker});
                }
            })
        } else if (exchange_type === "2") {
            if (pair) {
                pair = pair.toUpperCase();
                pair = pair.replace("/", "")
            } else {
                pair = false;
            }
            await ticker24hr(pair, function (status, ticker) {
                if (status === false) {
                    return res.send({"status": false, 'message': ticker});
                } else {
                    return res.send({"status": true, 'message': 'Data Found', 'price': ticker});
                }
            })
        } else {
            return res.send({"status": false, 'message': 'This is not Exchange'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }

});

router.get('/candlesticks', async function (req, res, next) {
    try {
        let exchange_type = req.query.exchange_type;
        var pair = req.query.pair;
        var interval = req.query.interval;
        var limit = req.query.limit;
        var startTime = req.query.startTime;
        var endTime = req.query.endTime;

        console.log(TAG + "/candlesticks req.query : " + JSON.stringify(req.query));

        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (exchange_type === "1") {
            if (pair) {
                pair = pair.toUpperCase();
                pair = pair.replace("/", "")
                await candlesticks(pair, interval, limit, startTime, endTime, function (status, candles) {
                    if (status === false) {
                        return res.send({"status": false, 'message': candles});
                    } else {
                        return res.send({"status": true, 'message': 'Data Found', 'ticks': candles});
                    }
                })
            } else {
                return res.send({"status": false, 'message': "please provide pair"});
            }
        } else if (exchange_type === "2") {
            if (pair) {
                pair = pair.toUpperCase();
                pair = pair.replace("/", "")
                await candlesticks(pair, interval, limit, startTime, endTime, function (status, candles) {
                    if (status === false) {
                        return res.send({"status": false, 'message': candles});
                    } else {
                        return res.send({"status": true, 'message': 'Data Found', 'ticks': candles});
                    }
                })
            } else {
                return res.send({"status": false, 'message': "please provide pair"});
            }
        } else {
            return res.send({"status": false, 'message': 'This is not Exchange'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }

});

router.get('/accountSnapShot', async function (req, res, next) {
    try {
        let user_id = req.query.user_id;
        let exchange_type = req.query.exchange_type;
        let startTime = req.query.startTime;
        let endTime = req.query.endTime;
        let limit = req.query.limit;

        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (exchange_type === "1") {
            await accountSnapShot(user_id, exchange_type, startTime, endTime, limit, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': 'Data Found', 'ticks': response});
                }
            })
        } else if (exchange_type === "2") {
            await accountSnapShotTest(user_id, function (status, response) {
                if (status) {
                    return res.send({"status": true, 'message': 'Data Found', 'ticks': response})

                } else {
                    return res.send({"status": false, 'message': response});
                }
            });
        } else {
            return res.send({"status": false, 'message': 'This is not Exchange'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
});

router.get('/accountPortfolio', async function (req, res, next) {
    try {
        let user_id = req.query.user_id;
        let exchange_type = req.query.exchange_type;

        console.log(TAG + "/accountPortfolio req.query : " + JSON.stringify(req.query));
        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (exchange_type === "1") {
            await protfolio(user_id, exchange_type, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': 'Data Found', 'data': response});
                }
            })
        } else if (exchange_type === "2") {
            await portfolioTest(user_id, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': 'Data Found', 'data': response});
                }
            })
        } else {
            return res.send({"status": false, 'message': 'This is not Exchange'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
});

router.get('/currentAllocations', async function (req, res, next) {
    try {
        let user_id = req.query.user_id;
        let exchange_type = req.query.exchange_type;

        console.log(TAG + "/currentAllocations req.query : " + JSON.stringify(req.query));
        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (exchange_type === "1") {
            await currentAllocations(user_id, exchange_type, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': 'Data Found', 'data': response});
                }
            })
        } else if (exchange_type === "2") {
            await currentAllocationTest(user_id, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': 'Data Found', 'data': response});
                }
            })
        } else {
            return res.send({"status": false, 'message': 'This is not Exchange'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
});

router.get('/balance_portfolio', async function (req, res, next) {
    try {
        let user_id = req.query.user_id;
        let exchange_type = req.query.exchange_type;

        console.log(TAG + "/balance_portfolio req.query : " + JSON.stringify(req.query));
        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (exchange_type === "1") {
            await balanceProtfolio(user_id, exchange_type, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': 'Data Found', 'data': response});
                }
            })
        } else if (exchange_type === "2") {
            await balanceProtfolioTest(user_id, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': 'Data Found', 'data': response});
                }
            })
        } else {
            return res.send({"status": false, 'message': 'This is not Exchange'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
});

router.get('/create_trade', async function (req, res, next) {
    try {
        console.log(TAG + "/create_trade : " + JSON.stringify(req.query));

        let user_id = req.query.user_id;
        let exchange_type = req.query.exchange_type;
        let type = req.query.type;  // MARKET || LIMIT
        let side = req.query.side.toUpperCase();  //BUY ||SELL
        let symbol = req.query.symbol.toUpperCase(); //pair
        let quantity = req.query.quantity;
        let price = req.query.price; // if type limit needs price if type is market price not needed

        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        var options = {side: side, quantity: quantity, useServerTime: true};
        if (type) {
            type = type.toUpperCase();
            if (type == "MARKET") {
                options.type = "MARKET"
            } else {
                options.price = price
            }
        } else {
            options.price = price
        }

        if (exchange_type === "1") {
            symbol = symbol.replace("/", "")
            options.symbol = symbol
            await createTrade(user_id, options, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': "Bid created successfully", 'data': response});
                }
            });
        } else if (exchange_type === "2") {
            options.symbol = symbol
            await createTradeTest(user_id, options, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send(response);
                }
            })
        } else {
            return res.send({"status": false, 'message': 'This is not Exchange'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
})

router.get('/cancel_order', async function (req, res, next) {
    try {
        console.log(TAG + "/cancel_order : " + JSON.stringify(req.query));

        let user_id = req.query.user_id;
        let exchange_type = req.query.exchange_type;
        let symbol = req.query.symbol.toUpperCase();
        let order_id = req.query.order_id;

        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (exchange_type === "1") {
            symbol = symbol.replace("/", "")
            await cancelOrder(user_id, symbol, order_id, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': "Order cancelled", 'data': response});
                }
            });
        } else if (exchange_type === "2") {
            await cancelOrderTest(user_id, symbol, order_id, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send(response);
                }
            })
        } else {
            return res.send({"status": false, 'message': 'This is not Exchange'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
})

router.get('/cancel_all_orders', async function (req, res, next) {
    try {
        console.log(TAG + "/cancel_all_orders : " + JSON.stringify(req.query));

        let user_id = req.query.user_id;
        let exchange_type = req.query.exchange_type;
        let symbol = req.query.symbol.toUpperCase();

        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (exchange_type === "1") {
            symbol = symbol.replace("/", "")
            await cancelAllOrders(user_id, symbol, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': "Orders cancelled", 'data': response});
                }
            });
        } else if (exchange_type === "2") {
            await cancelAllOrdersTest(user_id, symbol, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send(response);
                }
            })
        } else {
            return res.send({"status": false, 'message': 'This is not Exchange'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
})

router.get('/convert_all_asset', async function (req, res, next) {
    try {
        let user_id = req.query.user_id;
        let exchange_type = req.query.exchange_type;
        let assetName = req.query.asset_name;

        console.log(TAG + "/convert_all_asset : " + JSON.stringify(req.query));
        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (exchange_type === "1") {
            await sellAllAsset(user_id, exchange_type, assetName, function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': response});
                }
            });
        } else if (exchange_type === "2") {
            return res.send({"status": false, 'message': 'This feature not available on test exchange'})
        } else {
            return res.send({"status": false, 'message': 'This is not Exchange'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
})

router.get('/add_balance', async function (req, res, next) {
    try {
        let user_id = req.query.user_id;
        let exchange_type = req.query.exchange_type;
        let currency = req.query.currency
        let balance = req.query.balance

        console.log(TAG + "/add_balance : " + JSON.stringify(req.query));

        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (exchange_type === "1") {
            return res.send({"status": false, 'message': 'Add balance feacture not added for this exchange'})
        } else if (exchange_type === "2") {
            await addBalance(currency, balance, user_id, function (status, balance) {
                if (status === false) {
                    return res.send({"status": false, 'message': balance});
                } else {
                    if (balance) {
                        return res.send({"status": true, 'message': 'Balance Added', 'data': balance})
                    } else {
                        return res.send({"status": false, 'message': "Error in ading balance"});
                    }
                }
            })
        } else {
            return res.send({"status": false, 'message': 'Exchange not registered'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
})

router.get('/exchange_info', async function (req, res, next) {
    try {
        let exchange_type = req.query.exchange_type;

        console.log(TAG + "/exchange_info : " + JSON.stringify(req.query));

        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (exchange_type === "1") {
            await exchangeStats(function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': "Data Found", data: response});
                }
            });
        } else if (exchange_type === "2") {
            return res.send({
                "status": true,
                'message': "Data Found",
                data: {'twentyFourHourVolume': 0, 'totalPairs': 4}
            });
        } else {
            return res.send({"status": false, 'message': 'Exchange not registered'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
})

router.get('/exchange_info_pairs', async function (req, res, next) {
    try {
        console.log(TAG + "/exchange_info_pairs : " + JSON.stringify(req.query));
        let exchange_type = req.query.exchange_type;

        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (exchange_type === "1") {
            await exchangeInfo(function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': "Data Found", data: response});
                }
            });
        } else if (exchange_type === "2") {
            return res.send({"status": false, 'message': 'Feature not available'})
        } else {
            return res.send({"status": false, 'message': 'Exchange not registered'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
})

router.get('/exchange_all_asset', async function (req, res, next) {
    try {
        console.log(TAG + "/exchange_all_asset : " + JSON.stringify(req.query));
        let exchange_type = req.query.exchange_type;

        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();

        if (exchange_type === "1") {
            await exchangeAllAssets(function (status, response) {
                if (status === false) {
                    return res.send({"status": false, 'message': response});
                } else {
                    return res.send({"status": true, 'message': "Data Found", data: response});
                }
            });
        } else if (exchange_type === "2") {
            return res.send({"status": false, 'message': 'Feature not available'})
        } else {
            return res.send({"status": false, 'message': 'Exchange not registered'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
})

router.get('/delete_exchange', async function (req, res, next) {
    try {
        let exchange_type = req.query.exchange_type;
        let user_id = req.query.user_id;

        console.log(TAG + "/delete_exchange : " + JSON.stringify(req.query));

        if (!exchange_type) {
            exchange_type = 1;
        }
        exchange_type = exchange_type.toString();
        if (!user_id) {
            return res.send({"status": false, 'message': "user id required"});
        }

        if (exchange_type === "1") {
            exchange_accounts.deleteOne({user_id: user_id, exchange_id: exchange_type}, {
                _id: 0,
                __v: 0
            }, function (err, doc) {
                if (err) {
                    return res.send({"status": false, 'message': err});
                } else {
                    return res.send({"status": true, 'message': doc});
                }
            })
        } else if (exchange_type === "2") {
            await removeBalance(user_id, function (status, balance) {
                if (status === false) {
                    return res.send({"status": false, 'message': balance});
                } else {
                    if (balance) {
                        exchange_accounts.deleteOne({user_id: user_id, exchange_id: exchange_type}, {
                            _id: 0,
                            __v: 0
                        }, function (err, doc) {
                            if (err) {
                                return res.send({"status": false, 'message': err});
                            } else {
                                return res.send({"status": true, 'message': doc});
                            }
                        })
                    } else {
                        return res.send({"status": false, 'message': "Error in removing balance"});
                    }
                }
            })
        } else {
            return res.send({"status": false, 'message': 'Exchange not registered'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
})

router.get('/update_balance', async function (req, res, next) {
    try {
        let exchange_type = req.query.exchange_type;
        let user_id = req.query.user_id;

        if (!exchange_type) {
            exchange_type = 2;
        }
        exchange_type = exchange_type.toString();

        if (!user_id) {
            return res.send({"status": false, 'message': "user id required"});
        }

        if (exchange_type === "1") {
            return res.send({"status": false, 'message': "Not for binance exchange"});
        } else if (exchange_type === "2") {
            await updateBalance(user_id, function (status, balance) {
                if (status === false) {
                    return res.send({"status": false, 'message': "can not update balance"});
                } else {
                    return res.send({"status": true, 'message': "Balance updated"});
                }
            })
        } else {
            return res.send({"status": false, 'message': 'Error in updating balance'})
        }
    } catch (err) {
        return res.send({"status": false, 'message': 'Something went wrong'});
    }
})

router.get('/auth-fail', function (req, res, next) {
    let result = {"error": true, 'message': 'Invalid Auth key'};
    res.send(result);
});

module.exports = router;
