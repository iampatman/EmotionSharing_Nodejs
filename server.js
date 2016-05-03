//Import required package
var express = require('express');
var bodyParser = require('body-parser')
var fs = require("fs");

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
	console.log(JSON.stringify(activities))
	res.end( JSON.stringify(result));
})

app.post('/listActivities', function(req,res){
	console.log("List activity request data: " + JSON.stringify(req.body))
	var jsonData = JSON.parse(JSON.stringify(req.body))
	console.log("List activity return data size: " + activities.length)
	res.end(JSON.stringify(activities))
})

app.get('/', function(request, response) {
	console.log('ok')
	response.send('Hello World!');
});

/*

app.get('/cleardata', function(request, response) {
	console.log('Clear data files content')
	writeToFile(__dirname + "/" + "activities.json","[]")
	writeToFile(__dirname + "/" + "users.json","[]")
	response.end("1")

});

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

*/


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
	

	console.log('Node app is running on port: ', app.get('port'));

	
/*

fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
		console.log('Start reading user data file')
		console.log( JSON.parse(data) );
		var objs = JSON.parse(data)
		listUsers = objs
	});
	fs.readFile( __dirname + "/" + "activities.json", 'utf8', function (err, data) {
		console.log( data );
		var objs = JSON.parse(data)
		activities = objs
		console.log(activities)
		console.log('Init activities list: ' + objs.length)
	}); */
});