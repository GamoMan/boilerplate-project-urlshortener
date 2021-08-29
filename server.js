require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();





///////////////////////////////////////////////////////////////////
//MY CODE BELOW
///////////////////////////////////////////////////////////////////
/** 1) Install & Set up mongoose */
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

//Need the two lines below to parse the data coming from POST requests
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
///////////////////////////////////////////////////////////////////
//MY CODE ABOVE
///////////////////////////////////////////////////////////////////




// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


///////////////////////////////////////////////////////////////////
//MY CODE BELOW
///////////////////////////////////////////////////////////////////

//Create a 'UrlPair' Model 
const { Schema } = mongoose;
const urlSchema = new Schema({
    longUrl: String,
    shortUrl: Number,
  });
const UrlPair = mongoose.model('UrlPair', urlSchema);

app.post('/api/shorturl', function(req, res, next) {

  const test = (/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/).test(req.body.url)
  if( test == false ) {
    res.json({
      error: 'invalid url' 
    });
  } else {

    //Find whether longUrl (req.body.url) posted exists in mongoose database  
    const urlToSearch = req.body.url;
    UrlPair.findOne({ longUrl: urlToSearch }, function(err, urlPairFound_1) {
      console.log('log 1: ' + urlPairFound_1);

      if(err){
        return console.log(err);
      };

      //If that long url has never been posted...
      if(urlPairFound_1 == null){ //...need to create new UrlPair with (max shortUrl) + 1
        UrlPair.findOne({})
        .sort({shortUrl: 'desc'})
        .exec(function(err, urlPairFound_2) {
          //If there is at least one record of any url in the database...
          if(urlPairFound_2 != null){
            const createAndSaveUrl = function(done) {
              new UrlPair({
                  longUrl: req.body.url,
                  shortUrl: urlPairFound_2.shortUrl + 1,
              }).save(function(err, data) {
                console.log(data);
                if(err){
                  return console.error(err);
                }else{
                  done(null,data);
                };
              });
            };
            createAndSaveUrl(() => {});
            //Show client the long url and short url in json format
            res.json({ 
              original_url: req.body.url,
              short_url: urlPairFound_2.shortUrl + 1
            });
          };
          
          //If there are no records in the database (first url posted)...
          if(urlPairFound_2 == null){ 
            const createAndSaveUrl = function(done) {
              new UrlPair({
                  longUrl: req.body.url,
                  shortUrl: 1,
              }).save(function(err, data) {
                console.log(data);
                if(err){
                  return console.error(err);
                }else{
                  done(null,data);
                };
              });
            };
            createAndSaveUrl(() => {});
            //Show client the long url and short url in json format
            res.json({ 
              original_url: req.body.url,
              short_url: 1
            });
          };
        });

      };

      //If that long url has been posted in the past...
      if(urlPairFound_1 != null){
        //Show client the long url and short url in json format
        res.json({ 
          original_url: req.body.url,
          short_url: urlPairFound_1.shortUrl
        });
      };

      console.log('log 5: ' + req.shortUrl);
    });
  }
});

//When you visit /api/shorturl/<short_url>, you will be redirected to the original URL.
app.get("/api/shorturl/:short_url", function (req, res) {
  console.log('log 6: ' + req.params.short_url);
  UrlPair.findOne( {shortUrl: req.params.short_url}, function(err, urlPairFound_3) {
    console.log('log 7: ' + urlPairFound_3);
    if(err){
      return console.log(err);
    }else{
      res.redirect(urlPairFound_3.longUrl);
    };
  });
}); 
///////////////////////////////////////////////////////////////////
//MY CODE ABOVE
///////////////////////////////////////////////////////////////////

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
})