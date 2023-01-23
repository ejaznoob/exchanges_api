// auth.js
const passport = require("passport");
const HeaderAPIKeyStrategy = require('passport-headerapikey').HeaderAPIKeyStrategy
let [exchange_accounts] = require('./modules/databases/mongo_models')

const authUser = passport.use(new HeaderAPIKeyStrategy({ header: 'Authorization', prefix: 'Api-Key ', },
    false,
    async function (apikey, done) {
        exchange_accounts.findOne({api_key: apikey}, function (err, user) {
            //console.log(user.name);        //logged user name.
            if (!user) {
                return done(null, false, {message: 'That email is not registered'});
            } else {
                console.log('password matched.');         //logged when password matched.
                return done(null, user);
            }
        });
    }
));
const serializeUser = passport.serializeUser(function(user, done) {
    console.log('serialized auth: ', user.user_id);       //logged when credentials matched.
    return done(null, user.id);
});

const deserializeUser = passport.deserializeUser(function(user, done) {
    console.log('deserializeUser: ', user.user_id);
    return done(null, user);
});

function call_all(){
    console.log("Calling")
    authUser;
    serializeUser;
    deserializeUser;
}

module.exports =  call_all()