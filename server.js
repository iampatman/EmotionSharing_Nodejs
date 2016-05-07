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
		if (array[i].username == item.username){
			if (array[i].mobilePhone == item.mobilePhone) {
				return 1 // Login OK
			} else {
				return 0 //Wrong mobileNumber
			}
		}
	} 

	return 2 // allow to create a new user
}

app.post('/addUser', function (req, res) {
   // First read existing users.
   console.log("AddUser request data: " + JSON.stringify(req.body))
   var jsonData = JSON.parse(JSON.stringify(req.body))
   var newUser = {
   	username: jsonData.username,
   	mobilePhone: jsonData.mobilePhone
   }

   var result = arrayContains(listUsers,newUser) 
   console.log("Member result: " + result)

   if (result == 2) {
   	console.log("Push new member into list: " + newUser.username)
   	listUsers.push(newUser)
   		//writeToFile(__dirname + "/" + "users.json",JSON.stringify(listUsers))
		db_addUser(newUser) //save to db
	} 
	console.log('New user list size: ' + listUsers.length)
	console.log(JSON.stringify(listUsers))
	res.end(JSON.stringify({"result": result}));
})

app.post('/listUsers', function (req, res) {
	console.log("listUsers request data: " + JSON.stringify(req.body))
	var jsonData = JSON.parse(JSON.stringify(req.body))
	console.log("listUsers return data size: " + listUsers.length)
	var resultJSON = {"list": listUsers}
	res.end( JSON.stringify(resultJSON));

})

app.post('/postActivity',function (req,res){
	console.log("postActivity request data: " + JSON.stringify(req.body))
	var result = 0
	var jsonData = JSON.parse(JSON.stringify(req.body))
	var joint_mobilephone = 0
	//Haijun:
	//Join the mobilephone from user table in memory
	listUsers.forEach(function(value, index) {
		if(value.username == jsonData.username) {
			joint_mobilephone = value.mobilePhone
		}
	});

	//res.end( JSON.stringify(listUsers));
	var activity = {
		longitude: jsonData.longitude,
		latitude: jsonData.latitude,
		time: new Date(),
		username: jsonData.username,
		emotionId: jsonData.emotionId,
		thought: jsonData.thought,
		mobilephone: joint_mobilephone//activity input already referrered to another table of t_user, so put it as null
	}
	console.log(JSON.stringify(activity))
	activities.push(activity)
	db_addActivity(activity) //save to db
	result = 1
	console.log(JSON.stringify(activities))
	res.end(JSON.stringify({"result": result}));
})

app.post('/listActivities', function(req,res){
	console.log("List activity requested")
	console.log("list Activities: " + JSON.stringify(activities))
	var jsonData = JSON.parse(JSON.stringify(req.body))
	console.log("List activity return data size: " + activities.length)
	//warping json code
	res.end(JSON.stringify({"list": activities}))
})

app.get('/', function(request, response) {
	console.log('ok')
	response.send('Hello World!');
});

//Haijun:Create DB table executions. for internel usage only!!!
app.get('/setupDB', function(request, response) {
	//make sure connection could be touched
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if(err) {
			console.log('Connection Error: ' + err.message);
			response.end("0");
			return;
		}
		console.log('Connected to postgres! Getting schemas...');
		//Create user table
		client.query('CREATE TABLE t_user (username text, mobilephone text)', function(err1, result) {
			if (err1)
				{ console.error(err1); response.send("Error " + err1); 	response.end(JSON.stringify({result: 0})); done(); return}
			else
				{ console.log('User table created!!!') }
		});
		
		//Create activities table
		client.query('CREATE TABLE t_activity (longitude numeric, latitude numeric, time text, username text, emotionid int, thought text)', 
			function(err2, result) {
				if (err2)
					{ console.error(err2); response.send("Error " + err2); done(); }
				else
					{ console.log('activities table created!!!') }
			}); 
		done()
	});
	response.end(JSON.stringify({"result": 1}));
}) 

//Haijun: Cleanup DB table executions. for internel usage only!!!
app.get('/cleanupDB', function(request, response) {
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if(err) {
			console.log('Connection Error: ' + err.message);
			response.end(JSON.stringify({result: 0}));
			return;
		}
		console.log('Connected to postgres! Getting schemas...');
		//Create user table
		client.query('DROP TABLE t_user', function(err1, result) {
			if (err1)
				{ console.error(err1); response.send("Error " + err1); 	response.end(JSON.stringify({result: 0})); done(); return}
			else
				{ console.log('User table deleted!!!') }
		});
		//Create activities table
		client.query('DROP TABLE t_activity', function(err2, result) {
			if (err2)
				{ console.error(err2); response.send("Error " + err2); done()}
			else
				{ console.log('activities table deleted!!!') }
		});
		done()

	});
	response.end(JSON.stringify({"result": 1}));
})

//Haijun: Create DB table
function db_addUser(newUser) {
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if (err) throw err;
		console.log('Connected to postgres! Getting schemas...');
		var queryText = 'INSERT INTO t_user(username, mobilephone) VALUES($1, $2)'
		
		client.query(queryText, [newUser.username, newUser.mobilePhone], function(err, result) {
			if(err) {console.log("error!" + err.message);}//handle error
			else {
				console.log("DB - new record added " + JSON.stringify(result))
			}
		});
		done()
	})
}

function db_addActivity(newActivity) {
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if (err) throw err;
		console.log('Connected to postgres! Getting schemas...');
		var queryText = 'INSERT INTO t_activity(longitude,latitude,time,username,emotionid,thought) VALUES($1, $2, $3, $4, $5, $6)'
		
		client.query(queryText, [newActivity.longitude,newActivity.latitude,newActivity.time,newActivity.username,newActivity.emotionId,newActivity.thought], function(err, result) {
			if(err) {console.log("error!" + err.message);}//handle error
			else {
				console.log("DB - new record added " + JSON.stringify(result))
			}
		});
		done()
	})
}

//Haijun: get a list of all users
function db_getAllUsers() {
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if (err) throw err;
		console.log('Connected to postgres! Getting schemas...');
		
		client.query('SELECT * FROM t_user').on('row', function(row) {
			listUsers.push(JSON.stringify(row))
			console.log("User table is loading " + JSON.stringify(row));
		});
		done()
	})
}

function db_getAllActivities() {
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if (err) throw err;
		console.log('Connected to postgres! Getting schemas...');	
		client.query('SELECT DISTINCT ON (username) longitude,latitude,time,username,emotionid,thought,mobilephone FROM t_activity').on('row', function(row) {
			var activity = {
				location: {longitude: row.longitude, latitude: row.latitude},
				time: row.time,
				username: row.username,
				emotionId: row.emotionid,
				thought: row.thought,
				mobilephone: row.mobilephone
			}
			activities.push(activity)
			console.log("Activity table is loading " + JSON.stringify(row))
		});
		done()
	})
}






//Run web server

app.listen(app.get('port'), function() {
	

	console.log('Node app is running on port: ', app.get('port'));
	
	//haijun: --------------
	//load all data from DB
	
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if (err) throw err;
		console.log('Connected to postgres! Getting schemas...');
		
		client.query('SELECT * FROM t_user').on('row', function(row) {
			var user = {
				username: row.username,
				mobilePhone: row.mobilephone
			}
			listUsers.push(user)
			console.log("User table loading " + JSON.stringify(row));
		});
		
		client.query('SELECT DISTINCT ON (t_activity.username) longitude,latitude,time,t_activity.username,emotionid,thought,mobilephone FROM t_activity INNER JOIN t_user ON t_activity.username = t_user.username').on('row', function(row) {
			var activity = {
				longitude: Number(row.longitude), 
				latitude: Number(row.latitude),
				time: row.time,
				username: row.username,
				emotionId: row.emotionid,
				thought: row.thought,
				mobilephone: row.mobilephone
			}
			activities.push(activity)
			console.log("Activity table loading " + JSON.stringify(row))
		});
		//client.end()
		done();
	})

});