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
            else {
                var urls = db.collection('urls');
                shortenUrl(originalUrl, urls, db, req, res);
            }
        });
    }
});
app.get('/:shortUrl', function(req, res) {
    var shortUrl = req.params.shortUrl;
    console.log(shortUrl);
    mongodb.connect(dburl, function(err, db) {
        if(err) console.log(err);
        else {
            getOriginalUrl(shortUrl, db, req, res);
        }
    });
});
app.listen(process.env.PORT || 8080);

function generateShortUrl() {
    return randomString.generate(5);
}

function absoluteUrl(shortUrl, req) {
    return req.protocol + '://' + req.get('host') + '/' + shortUrl;
}

function getOriginalUrl(shortUrl, db, req, res) {
    var urls = db.collection('urls');
    urls.findOne({short_url: shortUrl}, function(err, document) {
        if(err) console.log(err);
        else {
            if(document) {
                res.redirect(document.url);
            }
            else {
                res.end(JSON.stringify({
                    "error": "url doesn't exist in database."
                }));
            }
            db.close();
        }
    });
}

function shortenUrl(originalUrl, collection, db, req, res) {
    collection.findOne({url: originalUrl}, function(err, document){
        if(err) console.log(err);
        else {
            if(document) {
                res.end(JSON.stringify({
                    "original_url": originalUrl,
                    "shortened_url": absoluteUrl(document.short_url, req)
                }));
                console.log("short url exists");
                db.close();
            }
            else {
                addUrl(generateShortUrl(), originalUrl, collection, db, req, res);
            }
        }
    });
}

function addUrl(shortUrl, originalUrl, collection, db, req, res) {
    collection.insert({
        url: originalUrl,
        short_url: shortUrl
    }, function(err, result) {
        if(err) console.log(err);
        else {
            console.log("added result " + result);
            res.end(JSON.stringify({
                "original_url": originalUrl,
                "shortened_url:": shortUrl
            }));
            db.close();
        }
    });
}