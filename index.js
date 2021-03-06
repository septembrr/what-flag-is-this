var express = require('express');
var app = express();

const axios = require('axios');
const cheerio = require('cheerio');

var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', 9092);

app.use(express.static('public'));

var countries = require('./countries.js');

function getImagesFromPage(pageHtml) {
    const $ = cheerio.load(pageHtml);
    return $('a.image > img');
}
  
function getImgSrcAlt(imgs, altSearchTerm) {
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

    return { src, alt }
}

function getAltSearchTerm(country) {
    if (country == 'Nepal' || country == 'Canada') {
        return '';
    }
    return "Flag";
}

// Image Service
app.get('/image', function(req, res, next) {
    const country = req.query.keyword;
    const size = req.query.size ? req.query.size : "500px";
    const altSearchTerm = req.query.alt_search_term;

    if (country) {
        const countryUrl = country.replace(" ", "_");
        axios.get(`https://en.wikipedia.org/wiki/${countryUrl}`).then(function(pageResponse) {
            const imgs = getImagesFromPage(pageResponse.data);
            if (!imgs.length) {
                return res.send({
                    image: "",
                    alt: "",
                });
            }
    
            const imgData = getImgSrcAlt(imgs, altSearchTerm);
            const imgUrl = "https:" + imgData.src.replace(/\/\d+px/i, `/${size}`);
        
            axios.get(imgUrl, {responseType: 'arraybuffer'}).then(function(imgResponse) {
                let base64Image = Buffer.from(imgResponse.data, 'binary').toString('base64');
                return res.send({
                    image: base64Image,
                    alt: imgData.alt,
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

    const altSearchTerm = getAltSearchTerm(solution);
    const imgServiceUrl = `http://localhost:9092/image?alt_search_term=${altSearchTerm}&keyword=${solution}`;

    axios.get(imgServiceUrl).then(function (response) {
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

        const textServiceUrl = `https://portfive.net/api/text-scraper?page=${solution}&introOnly=true`;

        axios.get(textServiceUrl).then(function(textRes) {
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

    let altSearchTerm = getAltSearchTerm(country);
    const imgServiceUrl = `http://localhost:9092/image?alt_search_term=${altSearchTerm}&keyword=${country}`;

    axios.get(imgServiceUrl).then(function (response) {
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
