var XmppClient = require('node-xmpp-client');
var xmppsms = require('../index');
var ltx = require('ltx');
var test = require('tape');


// Test config.
var accounts = {
    '14356024496': {
        type: 'twilio',
        accountSid: 'xxx',
        authToken: 'xxx',
        password: 'foobar',
    },
};

var runServer = function() {
    var server = new xmppsms.Gateway({
      port: 5222,
      domain: 'localhost',
      accounts: accounts,
    });
    server.listen();

    return server;
};


test('client connect', function(t) {
    t.plan(1);

    var server = runServer();

    var number = '14356024496';
    var account = accounts[number];

    var client = new XmppClient({ jid: number+'@localhost/test', password: account.password })
    client.addListener('online', function(data) {
        t.ok(true);
        client.end()
        server.end();
    });
    client.addListener('error', function(err) {
        t.ok(false);
        console.log(err);
        client.end()
        server.end();
    });
});

test('client send', function(t) {
    t.plan(1);

    var server = runServer();

    var number = '14356024496';
    var account = accounts[number];

    var client = new XmppClient({ jid: number+'@localhost/test', password: account.password })
    client.addListener('online', function(data) {
        var msg = new ltx.Element('message', {
            to: '16696009123',
            type: 'chat'
        })
        msg.c('body').t('hello warld')
        client.send(msg)
        // TODO: this isn't a real check for success
        t.ok(true);
        server.end();
    });
    client.addListener('error', function(err) {
        t.ok(false);
        console.log(err);
        client.end()
        server.end();
    });
});
