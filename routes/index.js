var express = require('express');
var router = express.Router();
var multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
const rekognition = new AWS.Rekognition({
  // Detect moderation labels is available on AWS region us-east-1, us-west-2 and eu-west-1
  region: "eu-west-1",
  accessKeyId: process.env.AMAZON_ACCESS_KEY_ID,
  secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY
});



function detect(image, success, error) {
  fs.readFile(image, function read(err, data) {
    rekognition.detectFaces({
      "Attributes": ["ALL"],
      "Image": {
      Bytes: data 
    },}, function(err, data) {
        if (err){
          console.log(err, err.stack);
        }else{
          if(data.FaceDetails[0] === undefined) {
            error()
          } else {
            success(data.FaceDetails[0].Emotions)
          }
        }       // successful response
    });
  });
    
}

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Vocap' });
});

router.post('/image', function(req, res, next) {
  detect(req.files[0].path, function(resp) {
    
    res.send(resp)
  }, function() {
    res.send("Error")
  })
});

router.get('/json', function(req, res, next) {
  fs.readFile("json/images.json", function read(err, data) {
    res.send(JSON.parse(data))
  });
});

module.exports = router;
