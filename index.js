var twilio = require('twilio');
var xmpp = require('node-xmpp-server');
var JID = require('node-xmpp-core').JID;
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
    var gateway = this;
    c2s.on('connect', function(client) {

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
            if (!gateway.accounts[number] || gateway.accounts[number].password != opts.password) {
                cb(false);
            } else {
                cb(null, opts);
            }
        })

        client.on('online', function() {
            // TODO: track all online clients per-account, so we can fanout msgs to them
            console.log('ONLINE')
        })

        client.on('stanza', function(stanza) {
            var fromJid = new JID(stanza.from);
            var toJid = new JID(stanza.to);
            if (stanza.type === "chat") {
                // TODO: can we assume the sender's JID is well-formed?
                // TODO: does the 'client' object have a JID we can just use?
                // if (!fromJid.getLocal() || !fromJid.getDomain()) {
                //     client.send(new Message({ type: 'error' }).c('body').t('Hello there, little client.'))
                //     return;
                // }

                // Check for malformed 'to'; or incorrect domain.
                if (!toJid.getLocal() || !toJid.getDomain() || toJid.getDomain() !== gateway.domain) {
                    // TODO: return an error (invalid recipient)
                    return;
                }

                // Check for malformed phone number.
                // ...
                // return an error 'gone' if the account is not sendable to (i.e. not a phone #)
     // <error by='example.net'
     //        type='cancel'>
     //   <gone xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'>
     //     xmpp:romeo@afterlife.example.net
     //   </gone>
     // </error>
            } else {
                console.log("TODO: handle stanza type '" + stanza.type + "': " + stanza);
            }
            console.log('STANZA' + stanza)
            console.log(stanza.attrs);
        })

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

