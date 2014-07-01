var twilio = require('twilio');
var xmpp = require('node-xmpp-server');
var Message = require('node-xmpp').Message;
var config = require('./config');

var Gateway = function(opts) {
    // TODO: TLS support (accept key+cert content _or_ key+cert local path)
    // TODO(someday): BOSH support (for web clients)

    this.port = opts.port || 5222;
    this.domain = opts.domain || 'localhost'
    this.accounts = opts.accounts || {};
};

Gateway.prototype.listen = function() {
    this.client = twilio(config.accountSid, config.authToken);

    // client.sendMessage({
    //   to: config.to,
    //   from: config.phoneNumber,
    //   body: "Woah! It WERKS!"
    // }, function(err, response) {
    //   if (!err) {
    //     // http://www.twilio.com/docs/api/rest/sending-sms#example-1
    //     console.log(response.from);
    //     console.log(response.body);
    //   }
    // })

    var c2s = new xmpp.C2SServer({
        port: this.port,
        domain: this.domain,
        // key : "key.pem content",
        // cert : "cert.pem content",
        // // or
        // tls: {
        // keyPath: './examples/localhost-key.pem',
        // certPath: './examples/localhost-cert.pem'
        // }
    });
    this.c2s = c2s;

    // On Connect event. When a client connects.
    var that = this;
    c2s.on('connect', function(client) {
        // That's the way you add mods to a given server.

        // Allows the developer to register the jid against anything they want
        c2s.on('register', function(opts, cb) {
            console.log('REGISTER')
            cb(true)
        })

        // Allows the developer to authenticate users against anything they want.
        client.on('authenticate', function(opts, cb) {
            console.log('AUTH: ' + opts.jid + ' -> ' +opts.password)
            // client.send(new Message({ type: 'chat' }).c('body').t('Hello there, little client.'))
            var number = opts.jid.local;
            if (!that.accounts[number] || that.accounts[number].password != opts.password) {
                cb(false);
            } else {
                cb(null, opts);
            }
        })

        client.on('online', function() {
            // TODO: track all online clients per-account, so we can fanout msgs to them
            console.log('ONLINE')
        })

        // Stanza handling
        client.on('stanza', function(stanza) {
            // TODO: parse + validate FROM (domain + number)
            // TODO: parse + validate TO (domain + is-actual-phone-number)
            // TODO: make sure stanza.attrs.type == 'chat' (not 'error'; drop anything else)
            console.log('STANZA' + stanza)
            console.log(stanza.attrs);
        })

        // On Disconnect event. When a client disconnects
        client.on('disconnect', function() {
            // TODO: track all online clients per-account, so we can fanout msgs to them
            console.log('DISCONNECT')
        })

    });
};

Gateway.prototype.end = function() {
  this.c2s.shutdown();
};


module.exports.Gateway = Gateway;

