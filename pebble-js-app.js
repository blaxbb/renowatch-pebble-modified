//
//
// Register for an API Key here https://openweathermap.org/api
//
//
var API_KEY = "SECRETKEYHERE";
//
//
//
//
//

// thresholds for considering the weather "cold" if otherwise clear
var COLD_C = 0
var COLD_F = 32
//thresholds for considering the weather "windy" if otherwise clear
var WIND_MS = 8.9
var WIND_MPH = 20

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

function getIcon(id, dayBool, temp, wind)
{
	var category = id[0];
	
	switch(category){
		case "2":
			return STORM;
		case "3":
		case "5":
			return RAIN;
		case "6":
			return SNOW;
		case "7":
			return HAZE;
		case "8":
			if(id == "800")
			{
				if (options.units == "fahrenheit" && wind > WIND_MPH)
					return WINDY;
				else if (options.units == "celsius" && wind > WIND_MS)
					return WINDY;
				if (options.units == "fahrenheit" && temp < COLD_F)
					return COLD;
				else if (options.units == "celsius" && temp < COLD_C)
					return COLD;
				
				return (dayBool ? CLEAR_DAY : CLEAR_NIGHT);
			}
			if(id == "801" || id == "802")
			{
				return (dayBool ? PARTLY_CLOUDY_DAY : PARTLY_CLOUDY_NIGHT);
			}
			return CLOUD;
	}
		
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
  
  var unitsCode = "auto";
  if (options.units == "fahrenheit") unitsCode = "imperial"
  else if (options.units == "celsius") unitsCode = "metric"
  var forecastUrl = "https://api.openweathermap.org/data/2.5/weather?lat=" + latitude + "&lon=" + longitude + "&units=" + unitsCode + "&appid=" + API_KEY;
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

function getWeatherFromLocation(location) {
  console.log(location);
  var forecastReq = new XMLHttpRequest();
  
  var unitsCode = "auto";
  if (options.units == "fahrenheit") unitsCode = "imperial"
  else if (options.units == "celsius") unitsCode = "metric"
  
  var forecastUrl = "https://api.openweathermap.org/data/2.5/weather?q=" + location + "&units=" + unitsCode + "&appid=" + API_KEY;
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
	var temp = data.main.temp;
	console.log("TEMP: " + temp);
	console.log(data.weather[0].id);
	
	var wind = data.wind.speed;
	
	var time = data.dt;
	var sunrise = data.sys.sunrise;
	var sunset = data.sys.sunset;
	
	var dayBool = time > sunrise && time < sunset;
	
	var icon = getIcon(data.weather[0].id.toString(), dayBool, temp, wind);
	Pebble.sendAppMessage({
		"icon" : icon,
		"temperature" : Math.round(temp) + "\u00B0",
		"invert_color" : (options.invert_color == "true" ? 1 : 0),
	});
}
	

var locationOptions = {
  "timeout": 15000,
  "maximumAge": 60000
};

function updateWeather() {
	if (options.location === null || options.location === "") {
		navigator.geolocation.getCurrentPosition(locationSuccess,
                                                    locationError,
                                                    locationOptions);
	}
	else {
		getWeatherFromLocation(options.location);
	}
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
