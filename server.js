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
	var apiKandidat = 'http://api.pemiluapi.org/calonpilkada/api/candidates?apiKey='+apiKey,
		apiVisiMisi = 'http://api.pemiluapi.org/calonpilkada/api/vision_missions?apiKey='+apiKey;
	
	var urlKandidat = apiKandidat + '&' + qs.stringify(req.query);
	
	logger.info("Request to " + urlKandidat);
	
	var imgUrl = req.protocol + '://' + req.get('host') + '/images/';
	
	
	function fileExists(filePath) {
    	try {
        	return fs.statSync(filePath).isFile();
    	} catch (err) {
        	return false;
    	}
	}

	var jsonKandidat;
	
	request.get(urlKandidat)
	.then(function(resp){	
		jsonKandidat = JSON.parse(JSON.stringify(resp.data)).data.results;
		
		var requestPromise = jsonKandidat.candidates.map(function(k){
			return request.get(apiVisiMisi + '&peserta=' + k.id_peserta);
		});
		
		return request.all(requestPromise);
			
	}).then(function(responses){
		var visiMisi = responses.map(function(raw){
						return raw.data.data.results.vision_missions[0];
					});
							
		res.status(200).json(
			{
				success: true, 
				data: jsonKandidat.candidates.map(function(candidate){
					var clone = _.clone(candidate),
						img = clone.id_peserta + '.jpg',
						selectedVisiMisi = visiMisi.filter(function(raw){
							return typeof raw !== 'undefined' && Number(raw.candidate_id) === Number(clone.id_peserta);
						})[0] || {};
					
					if( !fileExists(path.join(__dirname, '/public', 'images', img)) ) 
						img = 'person.jpg';
										
					clone.picture_url = imgUrl + img;
					clone.visi = selectedVisiMisi.visi;
					clone.misi = selectedVisiMisi.misi;
					
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