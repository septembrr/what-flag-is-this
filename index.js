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
app.set('port', 9092);

app.use(express.static('public'));

var countries = require('./countries.js');

// Image Service
app.get('/image', function(req, res, next){
    const country = req.query.keyword;
    const size = req.query.size ? req.query.size : "500px";
    const altSearchTerm = req.query.alt_search_term;

    if (country) {
        const countryUrl = country.replace(" ", "_");
        axios.get(`https://en.wikipedia.org/wiki/${countryUrl}`).then(function(pageResponse) {
            const pageHtml = pageResponse.data;
            const $ = cheerio.load(pageHtml);
    
            const imgs = $('a.image > img');

            if (!imgs.length) {
                return res.send({
                    image: "",
                    alt: "",
                });
            }
    
            let src = imgs[0].attribs.src;
            let alt = imgs[0].attribs.alt;
            let i = 1;
    
            if (altSearchTerm) {
                while (!alt.toUpperCase().includes(altSearchTerm.toUpperCase()) && i < imgs.length) {
                    src = imgs[i].attribs.src;
                    alt = imgs[i].attribs.alt;
                    i++;
                }
    
                if (i == imgs.length) {
                    src = imgs[0].attribs.src;
                    alt = imgs[0].attribs.alt.toUpperCase();
                }
            }
    
            const imgUrl = "https:" + src.replace(/\/\d+px/i, `/${size}`);
        
            axios.get(imgUrl, {responseType: 'arraybuffer'}).then(function(imgResponse) {
                let base64Image = Buffer.from(imgResponse.data, 'binary').toString('base64');
                return res.send({
                    image: base64Image,
                    alt,
                });
            });
        });
    } else {
        return res.status('404').send(new Error('No keyword provided'));
    }
});

// Guess Results
app.get('/guess', function(req, res, next){
    const solution = req.query.solution;

    let alt_search_term = "Flag";
    if (solution == 'Nepal' || solution == 'Canada') {
        alt_search_term = '';
    }

    axios.get(`http://localhost:9092/image?alt_search_term=${alt_search_term}&keyword=${solution}`).then(function (response) {
        const result = solution.toUpperCase() == req.query.guess.toUpperCase();

        let context = {
            solution,
            guess: req.query.guess,
            resultText: (result ? "CORRECT" : "INCORRECT"),
            resultClass: (result ? "correct" : "incorrect"),
            country: solution,
            imageData: response.data.image,
            imageAlt: response.data.alt,
            formStatus: "disabled",
        };

        axios.get(`https://portfive.net/api/text-scraper?page=${solution}&introOnly=true`).then(function(textRes) {
            context.countryHasInfo = true;
            context.countryInfo = textRes.data.nodes;
            res.render("guess", context);
        }).catch(function(err) {
            context.countryHasInfo = false;
            res.render("guess", context);
        });

    }).catch(function(err){
        console.log("ERROR", err);
    });
});

// Main Page
app.get('/', function(req, res){
    const country = countries[Math.floor(Math.random() * countries.length)];

    let alt_search_term = "Flag";
    if (country == 'Nepal' || country == 'Canada') {
        alt_search_term = '';
    }

    axios.get(`http://localhost:9092/image?alt_search_term=${alt_search_term}&keyword=${country}`).then(function (response) {
        const context = {
            country,
            imageData: response.data.image,
            imageAlt: response.data.alt,
        };

        res.render('index', context);
    }).catch(function(err){
        console.log("ERROR", err);
        res.render('error');
    });
});

// 404
app.use(function(req, res){
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
