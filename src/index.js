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
      return LOCATIONS.nc
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
      var intent=this.event.request.intent;
      var typeSlot = intent.slots.Type;
      var nameSlot = intent.slots.Name;
      var speechOutput;

      if ((typeSlot && typeSlot.value) || (nameSlot && nameSlot.value)) {
        var loc = getLocationIntent(intent);
        var nodeName = getNodeNameIntent(intent);
        var nodeType = getNodeTypeIntent(intent);
        console.log('loc', loc, 'nodeName', nodeName, 'nodeType', nodeType);

        var endpoint = '';
        var queryString = '?';
        if (loc) {
          queryString += 'loc=' + loc;
        }
        if (nodeName) {
          queryString += '&name=' + nodeName;
        }
        if (nodeType) {
          queryString += '&type=' + nodeType;
        }

        https.get(endpoint + queryString, (res) => {
            var twsNetResponseString = '';
            console.log('Status Code: ' + res.statusCode);

            if (res.statusCode != 200) {
              console.log('Something went wrong!')
            }

            res.on('data', (data) => {
              twsNetResponseString += data;
                var twsNetResponseObject = JSON.parse(twsNetResponseString);
                speechOutput = 'The data at ' + loc + ' is:';
                twsNetResponseObject.forEach(function(type) {
                  speechOutput += ' in the ' + type.name;
                  type.data.forEach(function(data) {
                    speechOutput += ' the ' + data.parm + ' is ' + data.value + ' ' + data.units;
                  });
                });
          this.emit(':tell', speechOutput);
        });
        }).on('error', function (e) {
          this.emit(':tell', 'Something went wrong!')
        });
      }
    else {
          this.emit(':tell', 'Please provide a name or a type of data you want.');
      }
    },

    "LaunchRequest": function() {
      this.emit(':ask', 'Ask for some data!', 'Ask for some data!');
    },

    "AMAZON.HelpIntent": function () {
        this.emit(':ask', 'Try asking What is workshop?', 'Ask What is workshop?');
    },

    "AMAZON.StopIntent": function () {
        this.emit(':tell', 'Bye!');
    },

    "AMAZON.CancelIntent": function () {
        this.emit(':tell', 'Bye!');
    }
};
