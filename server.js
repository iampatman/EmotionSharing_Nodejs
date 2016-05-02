//Import required package
var express = require('express');
var bodyParser = require('body-parser')
var fs = require("fs");
var pg = require('pg');

//define web server
var app = express();
app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(bodyParser.json());



var listUsers = []

var activities = []

function arrayContains(array, item){
	//console.log(array.length)

	for (var i = 0; i < array.length; i++) {
		//console.log(array[i])
		if (array[i].username == item) {
			return true
		}
	} 
	return false
}

app.post('/addUser', function (req, res) {
   // First read existing users.
   console.log("AddUser request data: " + JSON.stringify(req.body))
   var jsonData = JSON.parse(JSON.stringify(req.body))
   var newUser = {
   	username: jsonData.username,
   	mobilePhone: jsonData.mobilePhone
   }

   var result = 1
   if (arrayContains(listUsers,newUser.username) == false) {
   	console.log("Push new member into list: " + newUser.username)
   	listUsers.push(newUser)
   	writeToFile(__dirname + "/" + "users.json",JSON.stringify(listUsers))
   } else {
   	console.log("Member exists: " + newUser.username)
   	result = 0
   }
   console.log('New user list size: ' + listUsers.length)
   res.end( JSON.stringify(result));
})

app.post('/listUsers', function (req, res) {
	console.log("listUsers request data: " + JSON.stringify(req.body))
	var jsonData = JSON.parse(JSON.stringify(req.body))
	console.log("listUsers return data size: " + listUsers.length)
	res.end( JSON.stringify(listUsers));
})

app.post('/postActivity',function (req,res){
	console.log("postActivity request data: " + JSON.stringify(req.body))
	var result = 0
	var jsonData = JSON.parse(JSON.stringify(req.body))
	res.end( JSON.stringify(listUsers));
	var activity = {
		location: {longitude: jsonData['longitude'], latitude: jsonData['latitude']},
		time: new Date(),
		username: jsonData.username,
		emotionId: jsonData.emotionId,
		thought: jsonData.thought
	}
	console.log(JSON.stringify(activity))
	activities.push(activity)
	result = 1
	writeToFile(__dirname + "/" + "activities.json",JSON.stringify(listUsers))
	res.end(JSON.stringify(activities.length))
})

app.post('/listActivities', function(req,res){
	console.log("List activity request data: " + JSON.stringify(req.body))
	var jsonData = JSON.parse(JSON.stringify(req.body))
	console.log("List activity return data size: " + listActivities.length)
	res.end(JSON.stringify(activities))
})

app.get('/', function(request, response) {
	console.log('ok')
	response.send('Hello World!');
});

app.get('/cleardata', function(request, response) {
	console.log('Clear data files content')
	writeToFile(__dirname + "/" + "activities.json","[]")
	writeToFile(__dirname + "/" + "users.json","[]")
	response.end("1")

});

//Haijun: Create DB table executions. for internel usage only!!!
app.get('/setupDB', function(request, response) {
	//make sure connection could be touched
	pg.connect(process.env.DATABASE_URL, function(err0, client, done) {
		if(err0) {
			console.log('Connection Error: ' + err0.message);
			response.end("0");
			return;
		}
		console.log('Connected to postgres! Getting schemas...');
		//Create user table
		client.query('CREATE TABLE users (username integer, mobilePhone text)', function(err1, result) {
		  done();
		  if (err1)
		   { console.error(err1); response.send("Error " + err1); }
		  else
		   { console.log('User table created!!!') }
		});
		//Create activities table
		client.query('CREATE TABLE activities (longitude number, latitude number, time text, username text, emotionid number, thought text)', 
		function(err2, result) {
		  done();
		  if (err2)
		   { console.error(err2); response.send("Error " + err2); }
		  else
		   { console.log('activities table created!!!') }
		});
	});
	response.end("1");
}) 
  
//Haijun: Create DB 
function db_addUser() {
	
}

//Haijun: get a list of all users
function db_getAllUsers() {
	
}

app.post('/checkFiles',function(req,res){
	fs.stat(__dirname + "/" + "users.json", function(err, stat) {
		if(err == null) {
			console.log('File exists');
		} else if(err.code == 'ENOENT') {
			fs.writeFile('log.txt', 'Some log\n');
		} else {
			console.log('Some other error: ', err.code);
		}
	});
	fs.stat(__dirname + "/" + "activities.json", function(err, stat) {
		if(err == null) {
			console.log('File exists');
		} else if(err.code == 'ENOENT') {
			fs.writeFile('log.txt', 'Some log\n');
		} else {
			console.log('Some other error: ', err.code);
		}
	});
	res.end("1")
})


function writeToFile(filename, data){
	fs.writeFile(filename, data,  function(err) {
		if (err) {
			return console.error(err);
		}
		console.log("Data written successfully!");
		console.log("Let's read newly written data");
		fs.readFile( filename, 'utf8', function (err, data) {
			console.log( JSON.parse(data) );
		});


	});
}



//Run web server

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
	console.log('Start reading user data file')
	fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
		console.log( JSON.parse(data) );
		var objs = JSON.parse(data)
		listUsers = objs
		console.log('Initialized users list: ' + listUsers.length)
	});
	console.log('Start reading activities data file')


	activities = []
/*
	fs.readFile( __dirname + "/" + "activities.json", 'utf8', function (err, data) {
		console.log( data );
		var objs = JSON.parse(data)
		activities = objs
		console.log(activities)
		console.log('Init activities list: ' + objs.length)
	}); */
});