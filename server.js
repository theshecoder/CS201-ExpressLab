var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
var util = require('util');
var url = require('url');
var readline = require('readline');
var MongoClient = require('mongodb').MongoClient;
var request = require("request");
var bodyParser = require('body-parser');
var basicAuth = require('basic-auth-connect');
var mkdirp = require('mkdirp');
var app = express();
var options = {
    host: '127.0.0.1',
    key: fs.readFileSync('ssl/server.key'),
    cert: fs.readFileSync('ssl/server.crt')
};

http.createServer(app).listen(80);
https.createServer(options, app).listen(443);

app.use(bodyParser());

app.use('/projects', express.static('../..', {maxAge: 60*60*1000}));
app.use('/Lab6-Express', express.static('./auth-comments', {maxAge: 60*60*1000}));
app.use('/static', express.static('../Lab4-NodeJS/html', {maxAge: 60*60*1000}));
app.set("view options", {layout: false});
app.use(express.static('../../views'));
app.use('/', express.static('../..'));
app.get('/', function (req, res) {
    res.render("/../../views/index.html");
});

//GET Methods
app.get('/getcity', function (req, res) {
// Execute the REST service
   var urlObj = url.parse(req.url, true, false);
   fs.readFile('cities.dat.txt', function (err, data) {
      if (data != 'undefined') {
          var myRe = new RegExp("^"+urlObj.query["q"]);
          var cities = data.toString().split("\n");
          var jsonresult = [];
          for(var i = 0; i < cities.length; i++) {
            var result = cities[i].search(myRe); 
            if(result != -1) {
              jsonresult.push({city:cities[i]});
            } 
          }  
          console.log(JSON.stringify(jsonresult));
          res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
          res.end(JSON.stringify(jsonresult));
      } else {
          res.writeHead(500, {'Access-Control-Allow-Origin': '*'});
          res.end("Undefined data");
      }

    });
});
app.get('/comment', function (req, res) {
  // Read all of the database entries and return them in a JSON array
  MongoClient.connect("mongodb://localhost/comments", function(err, db) {
    if(err) throw err;
    db.collection("comments", function(err, comments){
      if(err) console.log(err);
      comments.find(function(err, items){
        items.toArray(function(err, itemArr){
            console.log(itemArr);
            res.writeHead(200, { "Access-Control-Allow-Origin": "http://ec2-52-88-191-100.us-west-2.compute.amazonaws.com" });
            res.end(JSON.stringify(itemArr));
        });
      });
    });
  });
});

var auth = basicAuth(function(user, pass) {
    return((user === 'cs201r')&&(pass === 'test'));
});

//POST Methods
app.post('/comment', auth, function (req, res) {
    console.log(req.user);
    console.log("Remote User");
    console.log(req.remoteUser);
    console.log("POST comment route");
    var reqObj = req.body;
    MongoClient.connect("mongodb://localhost/comments", function(err, db) {
        if(err) console.log(err);
        db.collection('comments').insert(reqObj,function(err, records) {
            console.log("Record added as "+records[0]._id);
            res.writeHead(200, { "Access-Control-Allow-Origin": "http://ec2-52-88-191-100.us-west-2.compute.amazonaws.com" });
            
            res.end(JSON.stringify(records[0]));
        });
    });
});
