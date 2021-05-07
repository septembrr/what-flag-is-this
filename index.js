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
app.get('/image', async function(req, res, next){
    const country = req.query.keyword;
    const size = req.query.size ? req.query.size : "500px";
    const altSearchTerm = req.query.alt_search_term;

    if (country) {
        const countryUrl = country.replace(" ", "_");
        const pageResponse = await axios.get(`https://en.wikipedia.org/wiki/${countryUrl}`);
        
        const pageHtml = pageResponse.data;
        const $ = cheerio.load(pageHtml);

        const imgs = $('a.image > img');

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
    
        const imgResponse = await axios.get(imgUrl, {responseType: 'arraybuffer'});
        let base64Image = Buffer.from(imgResponse.data, 'binary').toString('base64');
        return res.send({
            image: base64Image,
            alt,
        });
    } else {
        return res.status('404').send(new Error('No keyword provided'));
    }
});

// Guess Results
app.get('/guess', function(req, res, next){
    const solution = req.query.solution;

    axios.get(`http://localhost:8080/image?alt_search_term=Flag&keyword=${solution}`).then(function (response) {
        const result = solution.toUpperCase() == req.query.guess.toUpperCase();
        const context = {
            solution,
            guess: req.query.guess,
            resultText: (result ? "CORRECT" : "INCORRECT"),
            resultClass: (result ? "correct" : "incorrect"),
            country: solution,
            imageData: response.data.image,
            imageAlt: response.data.alt,
        };

        res.render("guess", context);
    }).catch(function(err){
        console.log("ERROR", err);
    });
});

// Main Page
app.get('/', function(req, res){
    const country = countries[Math.floor(Math.random() * countries.length)];

    axios.get(`http://localhost:8080/image?alt_search_term=Flag&keyword=${country}`).then(function (response) {
        const context = {
            country,
            imageData: response.data.image,
            imageAlt: response.data.alt,
        };

        res.render('index', context);
    }).catch(function(err){
        console.log("ERROR", err);
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