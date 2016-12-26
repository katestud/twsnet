var LOCATIONS = {
    '219 carillon': 219,
    '219': 219,
    'pittsboro': 219,
    'nc': 219,
    '12 primrose': '12P',
    'belfast': '12P',
    'maine': '12P',
    '12p': '12P'
};

var https = require('https');

var Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(intentHandlers);
    alexa.execute();
};

function getLocationIntent(intent) {
  var locationSlot = intent.slots.Loc;
  if (!locationSlot || !locationSlot.value) {
    return null;
  } else {
      var locationName = locationSlot.value;
      if (LOCATIONS[locationName.toLowerCase()]) {
        return LOCATIONS[locationName.toLowerCase()]
      } else {
        return LOCATIONS.nc
      }
  }
}

function getNodeNameIntent(intent) {
  var nameSlot = intent.slots.Name;
  if (!nameSlot || !nameSlot.value) {
    return null;
  } else {
    return nameSlot.value;
  }
}

function getNodeTypeIntent(intent) {
  var typeSlot = intent.slots.Type;
  if (!typeSlot || !typeSlot.value) {
    return null;
  } else {
    return typeSlot.value;
  }
}


var intentHandlers = {

    "GetDataIntent": function () {
      var intent = this.event.request.intent;
      var typeSlot = intent.slots.Type;
      var nameSlot = intent.slots.Name;
      var speechOutput = '';

      if ((typeSlot && typeSlot.value) || (nameSlot && nameSlot.value)) {
        var loc = getLocationIntent(intent);
        var nodeName = getNodeNameIntent(intent);
        var nodeType = getNodeTypeIntent(intent);

        if (nodeName && nodeType) {
          var slotMismatchMessage = 'Sorry, please provide a name or a type, not both. Try saying what is workshop?'
          this.emit(':tell', slotMismatchMessage);
          return
        }

        var endpoint = 'https://tomstudwell.com/alexa/whatis.php';
        var queryString = '?';
        if (nodeName) {
          queryString += 'name=' + nodeName;
        }
        if (nodeType) {
          queryString += 'type=' + nodeType;
        }
        if (loc) {
          queryString += '&loc=' + loc;
        }

        https.get(endpoint + queryString, (res) => {
            var twsNetResponseString = '';
            console.log('Status Code: ' + res.statusCode);

            if (res.statusCode != 200) {
              console.log('Something went wrong!')
            }

            res.on('data', (data) => {
              twsNetResponseString += data;
            });

            res.on('end', (end) => {
              var twsNetResponseObject = JSON.parse(twsNetResponseString);
              twsNetResponseObject.forEach(function(type) {
                speechOutput += 'In the ' + type.name;
                type.data.forEach(function(data, index, array) {
                  if (index === array.length - 1) {
                    speechOutput += 'and';
                  }
                  speechOutput += ' the ' + data.parm + ' is ' + data.value + ' ' + data.units + '<break time="100ms"/>';
                });
              });
              this.emit(':tell', speechOutput);
            });

        }).on('error', function () {
          this.emit(':tell', 'Sorry, something went wrong!')
        });
      }
    else {
        var noSlotMessage = 'Sorry, you need to provide a name or a type. Try saying what is workshop?'
        this.emit(':tell', noSlotMessage);
      }
    },

    "LaunchRequest": function() {
      this.emit(':ask', 'Ask for some data!', 'Ask for some data!');
    },

    "AMAZON.HelpIntent": function () {
        this.emit(':ask', 'Try asking What is workshop?', 'Ask What is workshop?');
    },

    "AMAZON.StopIntent": function () {
        this.emit(':tell', 'Thanks for using twiz net. Bye!');
    },

    "AMAZON.CancelIntent": function () {
        this.emit(':tell', 'Okay, I won\'t retrieve any daya. Bye!');
    }
};
