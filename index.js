var express = require('express');
var mongo = require('mongodb').MongoClient;
var validUrl = require('valid-url');
var shorter = require('./randomID.js');

var app = express();

var port = process.env.PORT || 8080;

//var mongoUrl = 'mongodb://hilz:0zziizz0@ds139979.mlab.com:39979/a-url-db';

var mongoUrl = process.env.MONGOLAB_URI;

app.use('/', express.static('public'));

app.get('/new/:url(*)', function(req, res) {
	var urlToShorten = req.params.url;
	if (validUrl.isUri(urlToShorten)) {
		mongo.connect(mongoUrl, function (err, db) {
			if (err) {
				res.status(404).end();
			} else {
				var shortURLs = db.collection('shortURLs');
				shortURLs
				.findOne({originalUrl: urlToShorten}, {_id: 0})
				.then(function(doc) {
					if (doc) {
						res.send(doc);
					} else {
						var newUrl = shorter();
						var urlObj = {
							originalUrl: urlToShorten,
							shortUrl: 'http://' + req.headers['host'] + '/' + newUrl
						};
						shortURLs.insert(urlObj);
						db.close();
						res.json({
							originalUrl: urlToShorten,
							shortUrl: 'http://' + req.headers['host'] + '/' + newUrl
						});
					}
				});
			}
		});
	} else {
		res.send('Not a valid URL');
	}
});

app.get('/:id', function(req, res) {
	var shortID = req.params.id;
	mongo.connect(mongoUrl, function(err, db) {
		if (err) {
			res.status(404).end();
		} else {
			var shortURLs = db.collection('shortURLs');
			shortURLs
			.findOne({shortUrl: 'http://' + req.headers['host'] + '/' + shortID})
			.then(function(doc) {
				if (doc) {
					db.close();
					res.redirect(doc.originalUrl);
				} else {
					res.send('Not a valid URL');
				}
			});
		}
	});
});

app.listen(port);