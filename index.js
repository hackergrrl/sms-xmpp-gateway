// TODO(noffle): this?
module.exports = 0;

var twilio = require('twilio');
var config = require('./config');
var client = twilio(config.accountSid, config.authToken);

client.sendMessage({
  to: config.to,
  from: config.phoneNumber,
  body: "Woah! It WERKS!"
}, function(err, response) {
  if (!err) {
    // http://www.twilio.com/docs/api/rest/sending-sms#example-1
    console.log(response.from);
    console.log(response.body);
  }
})

