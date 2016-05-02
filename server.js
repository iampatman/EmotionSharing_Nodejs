//Import required package
var express = require('express');
var bodyParser = require('body-parser')
var fs = require("fs");
var pg = require('pg');
var connStr = process.env.DATABASE_URL;
//define web server
var app = express();
app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(bodyParser.json());

var listUsers = []

var activities = []

var dbClient = null

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
	pg.connect(process.env.DATABASE_URL, function(err, client) {
		if(err) {
			console.log('Connection Error: ' + err.message);
			response.end("0");
			return;
		}
		console.log('Connected to postgres! Getting schemas...');
		//Create user table
		client.query('CREATE TABLE t_user (username text, mobilePhone text)', function(err1, result) {
		  if (err1)
		   { console.error(err1); response.send("Error " + err1); response.end("0"); }
		  else
		   { console.log('User table created!!!') }
		});
		
		//Create activities table
		client.query('CREATE TABLE t_activity (longitude number, latitude number, time text, username text, emotionid number, thought text)', 
		function(err2, result) {
		  if (err2)
		   { console.error(err2); response.send("Error " + err2); }
		  else
		   { console.log('activities table created!!!') }
		}); 
		client.end()
	});
	response.end("1");
}) 
 
 //Haijun: Cleanup DB table executions. for internel usage only!!!
app.get('/cleanupDB', function(request, response) {
	pg.connect(process.env.DATABASE_URL, function(err, client) {
		if(err) {
			console.log('Connection Error: ' + err.message);
			response.end("0");
			return;
		}
		console.log('Connected to postgres! Getting schemas...');
		//Create user table
		client.query('DROP TABLE t_user', function(err1, result) {
		  if (err1)
		   { console.error(err1); response.send("Error " + err1); response.end("0"); }
		  else
		   { console.log('User table deleted!!!') }
		});
		//Create activities table
		client.query('DROP TABLE t_activity', function(err2, result) {
		  if (err2)
		   { console.error(err2); response.send("Error " + err2); }
		  else
		   { console.log('activities table deleted!!!') }
		});
		client.end()

	});
	response.end("1");
})

//Haijun: Create DB 
function db_addUser(newUser) {
	pg.connect(process.env.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Connected to postgres! Getting schemas...');

  client
    .query('SELECT table_schema,table_name FROM information_schema.tables;')
    .on('row', function(row) {
      console.log(JSON.stringify(row));
    });
});
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
	//haijun: ------------
	//build connection with DB
	dbClient = new pg.Client(connStr);
	dbClient.connect(function(err, client) {
		if (err) throw err;
		console.log('Connected to postgres! Getting schemas...');		
	});
	
	//load all users and activities
    var queryUser = dbClient.query("SELECT * FROM t_user");
    queryUser.on('row', function(row) {
		listUsers.push(JSON.stringify(row))
		console.log("User table is loading " + row.username)
    });

	var queryActi = dbClient.query("SELECT * FROM t_activity");
	queryActi.on('row', function(row) {
		var activity = {
			location: {longitude: row.longitude, latitude: row.latitude},
			time: row.time,
			username: row.username,
			emotionId: row.emotionId,
			thought: row.thought
		}
		activities.push(activity)
		console.log("Activity table is loading " + row.username)
    });
	
	dbClient.end();
	
	/*
	pg.connect(process.env.DATABASE_URL, function(err, client) {
		if (err) throw err;
		console.log('Connected to postgres! Getting schemas...');
		var queryText = 'INSERT INTO t_user(username, mobilePhone) VALUES($1, $2)'
		
		client.query(queryText, ['841l14yah', 'test@te.st'], function(err, result) {
			if(err) {console.log("error!");}//handle error
		  else {
			var newlyCreatedUserId = 0
		  }
		});
	})*/


/*
	fs.readFile( __dirname + "/" + "activities.json", 'utf8', function (err, data) {
		console.log( data );
		var objs = JSON.parse(data)
		activities = objs
		console.log(activities)
		console.log('Init activities list: ' + objs.length)
	}); */
});