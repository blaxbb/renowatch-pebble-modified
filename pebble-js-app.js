//
//
// Register for an API Key here https://darksky.net/dev
//
//
var API_KEY = 192a8d1608b3e57320386258a857d487
//
//
//
//
//

var CLEAR_DAY = 0;
var CLEAR_NIGHT = 1;
var WINDY = 2;
var COLD = 3;
var PARTLY_CLOUDY_DAY = 4;
var PARTLY_CLOUDY_NIGHT = 5;
var HAZE = 6;
var CLOUD = 7;
var RAIN = 8;
var SNOW = 9;
var HAIL = 10;
var CLOUDY = 11;
var STORM = 12;
var NA = 13;

var iconMap = {
	clearday: CLEAR_DAY,
	clearnight: CLEAR_NIGHT,
	rain: RAIN,
	snow: SNOW,
	sleet: SNOW,
	wind: WINDY,
	fog: HAZE,
	cloudy: CLOUDY,
	partlycloudyday: PARTLY_CLOUDY_DAY,
	partlycloudynight: PARTLY_CLOUDY_NIGHT
}

var options = JSON.parse(localStorage.getItem('options'));
//console.log('read options: ' + JSON.stringify(options));
if (options === null) options = { "use_gps" : "true",
                                  "location" : "",
                                  "units" : "fahrenheit",
                                  "invert_color" : "false"};

function getWeatherFromLatLong(latitude, longitude) {
  console.log(latitude + ", " + longitude);
  var forecastReq = new XMLHttpRequest();
  var unitsCode = "auto"
  if (options.units == "fahrenheit") unitsCode = "us"
  else if (options.units == "celsius") unitsCode = "si"
  var forecastUrl = "https://api.darksky.net/forecast/" + API_KEY + "/" + latitude + "," + longitude + "?units=" + unitsCode;
  forecastReq.open('GET', forecastUrl, true);
  forecastReq.onload = function(e)
  {
	  //console.log(e.status);
	  if(forecastReq.status == 200)
	  {
		  var data = JSON.parse(forecastReq.responseText);
		  if(data)
		  {
			  getWeatherForecastIO(data);
		  }
	  }
  }
  forecastReq.send(null);
  return;
}

function getWeatherForecastIO(data)
{
	var temp = data.currently.temperature;
	console.log("TEMP: " + temp);
	var icon = data.currently.icon.replace(/-/g, "");
	Pebble.sendAppMessage({
		"icon" : iconMap[icon],
		"temperature" : Math.round(temp) + "\u00B0",
		"invert_color" : (options.invert_color == "true" ? 1 : 0),
	});
}

var locationOptions = {
  "timeout": 15000,
  "maximumAge": 60000
};

function updateWeather() {
	navigator.geolocation.getCurrentPosition(locationSuccess,
                                                    locationError,
                                                    locationOptions);
}

function locationSuccess(pos) {
  var coordinates = pos.coords;
  getWeatherFromLatLong(coordinates.latitude, coordinates.longitude);
}

function locationError(err) {
  console.warn('location error (' + err.code + '): ' + err.message);
  Pebble.sendAppMessage({
    "icon":11,
    "temperature":""
  });
}

Pebble.addEventListener('showConfiguration', function(e) {
  var uri = 'http://client.flip.net.au/reno/circle.html?' +
    'use_gps=' + encodeURIComponent(options.use_gps) +
    '&location=' + encodeURIComponent(options.location) +
    '&units=' + encodeURIComponent(options.units) +
    '&invert_color=' + encodeURIComponent(options.invert_color) +
    '&account_token=' + encodeURIComponent(Pebble.getAccountToken());
  //console.log('showing configuration at uri: ' + uri);

  Pebble.openURL(uri);
});

Pebble.addEventListener('webviewclosed', function(e) {
  if (e.response) {
    options = JSON.parse(decodeURIComponent(e.response));
    localStorage.setItem('options', JSON.stringify(options));
    //console.log('storing options: ' + JSON.stringify(options));
    updateWeather();
  } else {
    console.log('no options received');
  }
});

Pebble.addEventListener("appmessage", function(e) {
  if(e.payload.request_weather) {
    console.log("Got weather request from watch.");
    updateWeather();
  }
});

Pebble.addEventListener("ready", function(e) {
  //console.log("connect!" + e.ready);
  updateWeather();
  console.log(e.type);
});
