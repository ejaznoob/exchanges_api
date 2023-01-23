const mongoose = require("mongoose");
const {json} = require("express");
const Schema = mongoose.Schema;


let exchange_account = new Schema({
    exchange_id:{
        type:String,
    },
    user_id: {
        type: Number,
    },
    api_username:{
        type:String,
    },
    api_password:{
        type:String,
    },
    api_account:{
        type:String,
    },
    api_key:{
        type:String,
    },
    api_secret:{
        type:String,
    },
    api_token:{
        type:String,
    },
    passphrase:{
        type:String,
    },
    created_at:{
        type: String
    },
    updated_at:{
        type: String
    },
    active:{
        type:Number,
    }
}, { collection: 'users', timestamps: true , strict: false, toJSON: {getters: true}});

let exchange_accounts =mongoose.model('users', exchange_account);

module.exports = [exchange_accounts];
