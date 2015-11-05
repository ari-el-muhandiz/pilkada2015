"use strict";

global.rootApp = __dirname;

var express 	= require('express'),
	bodyParser	= require('body-parser'),
	path 		= require('path'),
	morgan		= require('morgan'),
	logger		= require('./middleware/logger'),
	request		= require('axios'),
	_			= require('underscore'),
	fs			= require('fs'),
	qs			= require('querystring'),
	router 		= express.Router(),
	app 		= express();
	
var apiKey = '0b773f8faf08b71472844c31cdafc63a';


app.use(express.static(path.join(__dirname, 'public')));

// Use the body-parser package in our application
app.use(bodyParser.urlencoded({ extended: true }));
//parse application/json
app.use(bodyParser.json());
//logger middleware
app.use(require('morgan')('combined', { "stream": logger.stream } ));

//calon pilkada api
router.route('/calonpilkada').get(function(req, res, next) {
	var apiEndPoint = 'http://api.pemiluapi.org/calonpilkada/api/candidates?';
	
	var url = apiEndPoint + 'apiKey=' + apiKey + '&' + qs.stringify(req.query);
	
	logger.info("Request to " + url);
	
	var imgUrl = req.protocol + '://' + req.get('host') + '/images/';
	
	
	function fileExists(filePath) {
    	try
    	{
        	return fs.statSync(filePath).isFile();
    	}
    	catch (err)
    	{
        	return false;
    	}
	}

	
	request.get(url)
	.then(function(resp){	
		var raw = JSON.parse(JSON.stringify(resp.data)),
			results = raw.data.results;
			
		
		res.status(resp.status).json(
			{
				success: true, 
				data: results.candidates.map(function(candidate){
					var clone = _.clone(candidate);
					var img = clone.id_peserta + '.jpg';
					
					fs.readdir(path.join(__dirname, '/public'), function(err, res){
						console.log(err)
						console.log(res);
					})
					
					if( !fileExists(path.join(__dirname, '/public', 'images', img)) ) 
						img = 'person.jpg';
										
					clone.picture_url = imgUrl + img;
					
					return clone;
				})
			}
		);
	}).catch(function(resp){
		if(resp instanceof Error) {
			logger.error(resp);
		}
		next(resp);
	})
});

//root app
app.get('/', function(req, res, next) {
	res.send('Welcome to Pilkada API 2015');
});
app.use('/api', router);

//not found handler
app.all('*', function(req, res, next){
	var err = new Error('Unrecognized Url');
	err.code = 404;
	
	next(err);
});
//error handler
app.use(function(err, req, res, next){
    res.status(err.code || 500).json({ 
		status: false,
		data: err.message
	});
	
    next();
});

var port = process.env.PORT || 3000;

app.listen(port, function(){
	console.log('Server running on port ' + port);
});