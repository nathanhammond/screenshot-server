var http = require('http');
var querystring = require('querystring');
var express = require('express');
var webdriver = require('selenium-webdriver');
var fs = require('fs');

// TODO: Select target rendering page

// base64 of previous screen
var prevScreen = undefined;
var prevTestId = undefined;
var testIdImgCount = 0;

// Null prototype doesn't have a few useful functions.
function o_keys(dict) {
  return Object.keys.call(Object, dict);
}

// Set up the drivers dictionary.
var drivers = Object.create(null);
drivers.firefox = undefined;
// drivers.safari = undefined;
// drivers.chrome = undefined;
// drivers.opera = undefined;

// Set up all of the drivers.
o_keys(drivers).forEach(function(browser) {
  var driver = new webdriver.Builder().forBrowser(browser);

  // Fix up Chrome's arguments.
  if (browser === 'chrome') {
    driver.withCapabilities({ browserName: 'chrome', 'chromeOptions': { args: ['test-type', 'start-maximized'] } });
  }

  drivers[browser] = driver.build();
});

// Prepare the screenshot server.
var app = express();

// Enable CORS.
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Take a screenshot, respond when complete.
app.get('/', function (req, res) {
  // TODO: enumerate clients.
  res.send('Screenshot server ready.');
});

app.post('/takeScreenshot', function (req, res) {
  var testid = req.query.testid;
  var browser = req.query.screenshotClientID;
  var driver = drivers[browser];

  // TODO: Force full-height screenshots outside of Firefox.
  // TODO: take screenshots at multiple sizes.
  // TODO: Enable size configuration.
  // driver.manage().window().setSize(1280, , 10));
  driver
    .takeScreenshot()
    .then(function(base64) {
      // TODO: Compress PNG.
      return new Promise(function(resolve, reject) {
        try {
          resolve(base64);
        } catch (e) {
          reject(e);
        }

      });
    })
    .then(function(base64) {
      if((testid != prevTestId) || (prevScreen !== base64)){
        prevScreen = base64;

        return new Promise(function(resolve, reject) {
          fs.writeFile('./screenshots/' + browser + '/' + getFileName(testid) + '.png', base64, {encoding: 'base64'}, function(error) {
            error ? reject(error) : resolve(true);
          });
        });
      }
    })
    .then(function() {
      return res.sendStatus(204);
    });
});

function getFileName(testid){
  if(prevTestId !== testid){
    prevTestId = testid;
    testIdImgCount = 0;
  }else{
    testIdImgCount++;
  }
  return testid + '-' + testIdImgCount;
}

// Kick off the server.
var server = app.listen(3000, function() {
  var host = server.address().address === "::" ? "localhost" : server.address().address;
  var port = server.address().port;

  var screenshotServerURL = 'http://'+host+':'+port+'/';

  console.log('Screenshot server listening at ' + screenshotServerURL);

  // Kick off the testing.
  o_keys(drivers).forEach(function(browser) {
    var driver = drivers[browser];
    driver.manage().window().setPosition(0, 0)
    driver.manage().window().maximize();
    driver.get('http://localhost:4200/tests?nojshint&filter=acceptance&'+querystring.stringify({ screenshotServerURL: screenshotServerURL, screenshotClientID: browser }));
  });
});
