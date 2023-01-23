var express = require('express');
var router = express.Router();
const Binance = require("node-binance-api");

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET User Balance. */
router.get('/balance', async function(req, res, next) {
  try {
    let currency = req.query.currency
    let exchange_type = req.query.exchange_type
    if (exchange_type === 1){
      res.send({"success": true, 'message': 'This is binance Exchange' , 'currency' : currency})
    }else if (exchange_type === 2){
      res.send({"success": true, 'message': 'This is test Exchange', 'currency' : currency})
    }else{
      res.send({"error": true, 'message': 'This is not Exchange'})
    }
  }
  catch (exception_var) {
    console.log("Request error: " + exception_var)
    res.send(["Error processing your request"]);
  }
});

module.exports = router;
