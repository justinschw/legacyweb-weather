/*
 * Express weather app designed for
 * older browsers
 */
const express = require('express');
const weather = require('weather-js');
const geoip = require('geoip-lite');
const publicIp = require('public-ip');
const fs = require('fs');
const http = require('http');
const port = 8080;

var app = express();

app.set('view engine', 'pug');
app.use(express.static('public'));

// Public variables
var ip;
var location;

function codeToImageUrl(code) {
    const urlPrefix = 'http://blob.weather.microsoft.com/static/weather4/en-us/law/';
    return urlPrefix + code.toString() + '.gif';
}

function locationToString(location) {
    return location.city + ', ' + location.region;
}

async function cacheFileLocally(imageUrl) {
    const imageFilePath = imageUrl.split('/');
    const imageFile = imageFilePath[imageFilePath.length-1];
    const localImagePath = 'images/imagecache/' + imageFile;
    if (!fs.existsSync('./public/' + localImagePath)) {
	console.log('Fetching ' + imageUrl);
	const file = fs.createWriteStream('./public/' + localImagePath);
	const request = await http.get(imageUrl, async function(response) {
	    await response.pipe(file);
	});
    }
    return localImagePath;
}

async function getForecastImages(forecast) {
    forecast.forEach(async (day) => {
	day.localImage = await cacheFileLocally(codeToImageUrl(day.skycodeday));
    });
}

app.get('/', async function(req, res) {    
    weather.find({search: location, degreeType: 'F'}, async (err, result) => {
	if(err) {
	    console.log(err);
	}
	result[0].localImagePath = await cacheFileLocally(result[0].current.imageUrl);
	await getForecastImages(result[0].forecast);
	res.render('weather', result[0]);
    });
});

app.listen(port, async () => {
    ip = await publicIp.v4();
    console.log("Public IP: " + ip);
    location = locationToString(await geoip.lookup(ip));
    console.log("Location: " + location);
    console.log(`Weather app listening at http://localhost:${port}`)
});
