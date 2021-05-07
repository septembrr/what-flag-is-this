// Express Routes
var express = require('express');
var app = express();

// HTTP Request
const axios = require('axios');
const cheerio = require('cheerio');

// Handlebars Template Engine
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 8080);

app.use(express.static('public'));

var countries = require('./countries.js');

// Image Service
app.get('/image',function(req,res,next){
    const country = req.query.keyword;

    if (countries.includes(country)) {
        const countryUrl = country.replace(" ", "_");
        axios.get(`https://en.wikipedia.org/wiki/${countryUrl}`).then(function(response) {
            const pageHtml = response.data;
            const $ = cheerio.load(pageHtml);
    
            const result = $('a.image > img')[0].attribs.src;
            const imgUrl = "https:" + result.replace("125px", "500px");
    
            axios.get(imgUrl, {responseType: 'arraybuffer'}).then(function(response) {
                let base64Image = Buffer.from(response.data, 'binary').toString('base64');
                return res.send(base64Image);
            }).catch(function(err) {
                console.log("ERROR", err);
            });
        }).catch(function(err) {
            console.log("ERROR", err);
        });
    } else {
        return res.send("");
    }
});

// Guess Results
app.get('/guess', function(req,res,next){
    const solution = req.query.solution;

    axios.get(`http://localhost:8080/image?keyword=${solution}`).then(function (response) {
        const result = solution.toUpperCase() == req.query.guess.toUpperCase();
        const context = {
            solution,
            guess: req.query.guess,
            resultText: (result ? "CORRECT" : "INCORRECT"),
            resultClass: (result ? "correct" : "incorrect"),
            country: solution,
            imageData: response.data,
        };

        res.render("guess", context);
    }).catch(function(err){
        console.log("ERROR", err);
    });
});

// Main Page
app.get('/',function(req,res){
    const country = countries[Math.floor(Math.random() * countries.length)];

    axios.get(`http://localhost:8080/image?keyword=${country}`).then(function (response) {
        const context = {
            country,
            imageData: response.data,
        };

        res.render('index', context);
    }).catch(function(err){
        console.log("ERROR", err);
    });
});

// 404
app.use(function(req,res){
    res.status(404);
    res.render('404');
});

// 500
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.type('plain/text');
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function(){
    console.log('Express started; press Ctrl-C to terminate.');
});