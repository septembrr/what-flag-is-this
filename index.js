// Express Routes
var express = require('express');
var app = express();

// Body parser for POST endpoint routes
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Handlebars Template Engine
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 8080);

app.use(express.static('public'));

// Image Service
app.post('/image',function(req,res,next){
    return res.send("Image Result");
});

// Guess Results
app.post('/guess', function(req,res,next){
    return res.render("Guess Result");
});

// Main Page
app.get('/',function(req,res){
    context = {
        jsscripts: ['guess.js'],
    };
    res.render('index', context);
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