var express = require('express');
var path = require('path');
var validUrl = require('valid-url');
var randomString = require('randomstring');
var mongodb = require('mongodb').MongoClient;
var dburl = 'mongodb://localhost:27017/urlshortenerdb';

var app = express();
app.use('/', express.static(path.join(__dirname, '/static')));
app.get('/new/:url*', function(req, res) {
    var originalUrl = req.params.url + req.params[0];
    originalUrl = validUrl.isWebUri(originalUrl);
    if(originalUrl == undefined) {
        res.end(JSON.stringify({
            "error": "Wrong url format, make sure you have a valid protocol and real site."
        }));
    }
    else {
        mongodb.connect(dburl, function(err, db) {
            if(err) console.log(err);
            var urls = db.collection('urls');
            var shortenedUrl = urlExists(originalUrl, urls);
            if(shortenedUrl) {
                res.end(JSON.stringify({
                    "original_url": originalUrl,
                    "shortened_url:": shortenedUrl
                }));
            }
            else {
                addUrl(generateShortUrl(), originalUrl, urls);
            }
    
            res.end(JSON.stringify({
                "url": originalUrl
            }));
        });
    }
    
});
app.listen(process.env.PORT || 8080);

function generateShortUrl() {
    return randomString.generate(5);
}

function urlExists(originalUrl, collection) {
    // fix callback timing error
    collection.findOne({url: originalUrl}, function(err, document){
        if(err) console.log(err);
        else {
            return Boolean(document) ? document : false;
        }
    });
}

function addUrl(shortUrl, originalUrl, collection) {
    collection.insert({
        url: originalUrl,
        short_url: shortUrl
    },
    function(err, result) {
       if(err) console.log(err);
       console.log("added result " + result);
    });
}