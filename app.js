var express = require('express'),
    app = express(),
    engines = require('consolidate'),
    MongoClient = require('mongodb').MongoClient,  
    assert = require('assert'),
    bodyParser = require('body-parser'),
    port = process.env.PORT || 3000,
    dotenv = require('dotenv');
dotenv.load();
var db_userName = process.env.DB_USERNAME;
var db_password = process.env.DB_PASSWORD;
var db_database = process.env.DB_DATABASE;
var uri = `mongodb://${db_userName}:${db_password}@ds161041.mlab.com:61041/cameron_sandbox`;
var newEntryId;
    
app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));

function errorHandler(err, req, res, next) {
  console.error(err.message);
  console.error(err.stack);
  res.status(500).render('error_template', { error: err });
}

function formatDoc(title, year, imdb) {
  if (title == '' || year == '' || imdb == '') {
    return false;
  }
  var obj = {
    "title": title,
    "year": +year,
    "imdb": imdb
  }
  return obj;
}
function viewMovies(req, res, db, newEntryId) {
  db.collection('movies').find({}).toArray(function(err, docs) {
    if (newEntryId) {
      res.render('movies', { 'movies': docs, 'newEntryId': newEntryId });
    } else {
      res.render('movies', { 'movies': docs });
    }
  })
}

MongoClient.connect(uri, function(err, db) {

  assert.equal(null, err);
  console.log("Successfully connected to MonagoDB.");

  app.get('/', function(req, res) {
    res.render('movie_entry');
  });

  app.post('/movie_post', function(req, res, next) {

    var entry = formatDoc(req.body.title, req.body.year, req.body.imdb);
    if (!entry) {
      next(Error('please complete all fields'));
    } else {
    
      db.collection('movies').insertOne(entry, function(err, newdoc) {
        assert.equal(null, err);
        newEntryId = newdoc.insertedId;
        viewMovies(req, res, db, newEntryId);
      });
    }
  });
  //serve movie database without new entry
  app.get('/movies', function(req, res) {
    viewMovies(req, res, db);
  })

  app.post('/remove_entry', function(req, res, next) {
    db.collection('movies').remove({ '_id': newEntryId }, function(err, removed) {
      res.render('movie_entry');
    });

  })
  

  app.use(errorHandler);

});

var server = app.listen(port, function() {
  console.log('Express server listening on port %s', port);
});