const axios = require('axios').default;

const baseUrl = process.env.PAPER_URL
const TAG = "api_calls.js : ";

async function postRequest(endpoint, reqBody, api_key, done) {
    let headers = {
        'Connection': 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
        'Authorization': 'Api-Key ' + api_key
    }
    const config = {
        headers: headers,
    };

    axios.post(baseUrl + endpoint, reqBody, config)
        .then(function (response) {
            if (response.data.status === true) {
                done(true, response.data);
            } else {
                done(false, response.data.message);
            }
        })
        .catch(function (error) {
            done(false, error);
        });
}

async function getRequest(endpoint, reqParams, api_key, done) {

    let headers = {
        'Connection': 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Api-Key ' + api_key
    }
    let config = {}
    if (api_key) {
        config = {
            headers: headers,
            params: reqParams
        };
    } else {
        config = {
            params: reqParams
        };
    }

    axios.get(baseUrl + endpoint, config)
        .then(function (response) {
            if (response.data.status === true) {
                done(true, response.data);
            } else {
                done(false, response.data.message);
            }
        })
        .catch(function (error) {
            done(false, error);
        });
}


module.exports = [postRequest, getRequest]