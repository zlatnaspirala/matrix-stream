/* OV */
const Config = require("./config");
const config = new Config()

var OpenVidu = require("openvidu-node-client").OpenVidu;
var OpenViduRole = require("openvidu-node-client").OpenViduRole;
var compression = require("compression");

// Check launch arguments: must receive openvidu-server URL and the secret
if(process.argv.length != 4) {
	console.log("Usage: node " + __filename + " OPENVIDU_URL OPENVIDU_SECRET");
	process.exit(-1);
}

// For demo purposes we ignore self-signed certificate
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// http2
const spdy = require("spdy");
// const path = require("path");
const port = config.middlewarePort;

var express = require("express");
var fs = require("fs");
var bodyParser = require("body-parser");
var app = express();

app.use(compression({filter: function() {return true;}}));

// Server configuration
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: "true"}));
app.use(bodyParser.json());
app.use(bodyParser.json({type: "application/vnd.api+json"}));
// app.use(cors());

// NOT SECURED `*`
app.use(function(req, res, next) {
	// res.setHeader("Content-Type", "text/html")
	// res.setHeader('Content-Encoding', 'gzip');
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', '*');
	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', false);
	// Pass to next layer of middleware
	next();
});

// app.use(compression({ filter: shouldCompress }));
function shouldCompress(req, res) {
	if(req.headers["x-no-compression"]) {
		return false;
	}
	return compression.filter(req, res);
}

var OPENVIDU_URL = process.argv[2];
var OPENVIDU_SECRET = process.argv[3];
var options = null;

if(OPENVIDU_URL.indexOf("localhost") !== -1) {
	options = {
		key: fs.readFileSync(__dirname + "/openvidukey.pem"),
		cert: fs.readFileSync(__dirname + "/openviducert.pem")
	};
} else {
	console.log("SSL path:", config.certPathProd.pKeyPath)
	// options = {
	// 	key: fs.readFileSync(config.certPathProd.pKeyPath),
	// 	cert: fs.readFileSync(config.certPathProd.pCertPath)
	// };

	// HARDCODE
	options = {
		key: fs.readFileSync(__dirname + "/openvidukey.pem"),
		cert: fs.readFileSync(__dirname + "/openviducert.pem")
	};
}

spdy.createServer(options, app).listen(port, error => {
	if(error) {
		console.error(error);
		return process.exit(1);
	} else {
		console.log("Matrix-Stream - Listening on port: " + port + ".");
	}
});

var OV = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);
var mapSessions = {};
var mapSessionNamesTokens = {};

/* Session API */
app.post('/api/get-token', function(req, res) {
	var sessionName = req.body.sessionName;
	var role = OpenViduRole.PUBLISHER;
	console.log("Getting a token | {sessionName}={" + sessionName + "}");
	var connectionProperties = {
		role: role
	}
	if(mapSessions[sessionName]) {
		console.log('Existing session ' + sessionName);
		var mySession = mapSessions[sessionName];
		mySession.createConnection(connectionProperties)
			.then(connection => {
				mapSessionNamesTokens[sessionName].push(connection.token);
				res.status(200).send({
					0: connection.token
				});
			})
			.catch(error => {
				console.error(error);
				if(error.message === "404") {
					delete mapSessions[sessionName];
					delete mapSessionNamesTokens[sessionName];
					newSession(sessionName, connectionProperties, res);
				}
			});
	} else {
		newSession(sessionName, connectionProperties, res);
	}
});

function newSession(sessionName, connectionProperties, res) {
	console.log('New session ' + sessionName);
	OV.createSession()
		.then(session => {
			mapSessions[sessionName] = session;
			mapSessionNamesTokens[sessionName] = [];
			session.createConnection(connectionProperties)
				.then(connection => {
					mapSessionNamesTokens[sessionName].push(connection.token);
					res.status(200).send({0: connection.token});
				})
				.catch(error => {console.error(error)});
		})
		.catch(error => {console.error(error)});
}

app.post('/api/remove-user', function(req, res) {
	var sessionName = req.body.sessionName;
	var token = req.body.token;
	if(mapSessions[sessionName] && mapSessionNamesTokens[sessionName]) {
		var tokens = mapSessionNamesTokens[sessionName];
		var index = tokens.indexOf(token);
		if(index !== -1) {
			tokens.splice(index, 1);
			console.log(sessionName + ': ' + tokens.toString());
		} else {
			var msg = 'Problems in the app server: the TOKEN wasn\'t valid';
			console.log(msg);
			res.status(500).send(msg);
		}
		if(tokens.length == 0) {
			console.log(sessionName + ' empty!');
			delete mapSessions[sessionName];
		}
		res.status(200).send();
	} else {
		var msg = 'Problems in the app server: the SESSION does not exist';
		console.log(msg);
		res.status(500).send(msg);
	}
});

// Close session
app.delete('/api/close-session', function(req, res) {
	var sessionName = req.body.sessionName;
	// console.log("Closing session | {sessionName}=" + sessionName);
	if(mapSessions[sessionName]) {
		var session = mapSessions[sessionName];
		session.close();
		delete mapSessions[sessionName];
		delete mapSessionNamesTokens[sessionName];
		res.status(200).send();
	} else {
		var msg = 'Problems in the app server: the SESSION does not exist';
		console.log(msg);
		res.status(500).send(msg);
	}
});

// Fetch session info
app.post('/api/fetch-info', function(req, res) {
	// Retrieve params from POST body
	var sessionName = req.body.sessionName;
	// console.log("Fetching session info | {sessionName}=" + sessionName);
	if(mapSessions[sessionName]) {
		mapSessions[sessionName].fetch()
			.then(changed => {
				console.log("Any change: " + changed);
				res.status(200).send(sessionToJson(mapSessions[sessionName]));
			})
			.catch(error => res.status(400).send(error.message));
	} else {
		var msg = 'Problems in the app server: the SESSION does not exist';
		console.log(msg);
		res.status(500).send(msg);
	}
});

// Fetch all session info
app.get('/api/fetch-all', function(req, res) {
	// console.log("Fetching all session info");
	OV.fetch()
		.then(changed => {
			var sessions = [];
			OV.activeSessions.forEach(s => {
				sessions.push(sessionToJson(s));
			});
			console.log("Any change: " + changed);
			res.status(200).send(sessions);
		})
		.catch(error => res.status(400).send(error.message));
});

// Force disconnect
app.delete('/api/force-disconnect', function(req, res) {
	var sessionName = req.body.sessionName;
	var connectionId = req.body.connectionId;
	if(mapSessions[sessionName]) {
		mapSessions[sessionName].forceDisconnect(connectionId)
			.then(() => res.status(200).send())
			.catch(error => res.status(400).send(error.message));
	} else {
		var msg = 'Problems in the app server: the SESSION does not exist';
		console.log(msg);
		res.status(500).send(msg);
	}
});

// Force unpublish
app.delete('/api/force-unpublish', function(req, res) {
	var sessionName = req.body.sessionName;
	var streamId = req.body.streamId;
	if(mapSessions[sessionName]) {
		mapSessions[sessionName].forceUnpublish(streamId)
			.then(() => res.status(200).send())
			.catch(error => res.status(400).send(error.message));
	} else {
		var msg = 'Problems in the app server: the SESSION does not exist';
		console.log(msg);
		res.status(500).send(msg);
	}
});

/* Recording API */
// Start recording
app.post('/api/recording/start', function(req, res) {
	// Retrieve params from POST body
	var recordingProperties = {
		outputMode: req.body.outputMode,
		hasAudio: req.body.hasAudio,
		hasVideo: req.body.hasVideo,
	}
	var sessionId = req.body.session;
	console.log("Starting recording | {sessionId}=" + sessionId);

	OV.startRecording(sessionId, recordingProperties)
		.then(recording => res.status(200).send(recording))
		.catch(error => res.status(400).send(error.message));
});

// Stop recording
app.post('/api/recording/stop', function(req, res) {
	var recordingId = req.body.recording;
	// console.log("Stopping recording | {recordingId}=" + recordingId);
	OV.stopRecording(recordingId)
		.then(recording => res.status(200).send(recording))
		.catch(error => res.status(400).send(error.message));
});

// Delete recording
app.delete('/api/recording/delete', function(req, res) {
	var recordingId = req.body.recording;
	// console.log("Deleting recording | {recordingId}=" + recordingId);
	OV.deleteRecording(recordingId)
		.then(() => res.status(200).send())
		.catch(error => res.status(400).send(error.message));
});

// Get recording
app.get('/api/recording/get/:recordingId', function(req, res) {
	var recordingId = req.params.recordingId;
	// console.log("Getting recording | {recordingId}=" + recordingId);
	OV.getRecording(recordingId)
		.then(recording => res.status(200).send(recording))
		.catch(error => res.status(400).send(error.message));
});

// List all recordings
app.get('/api/recording/list', function(req, res) {
	console.log("Listing recordings");
	OV.listRecordings()
		.then(recordings => res.status(200).send(recordings))
		.catch(error => res.status(400).send(error.message));
});

function sessionToJson(session) {
	var json = {};
	json.sessionId = session.sessionId;
	json.createdAt = session.createdAt;
	json.customSessionId = !!session.properties.customSessionId ? session.properties.customSessionId : "";
	json.recording = session.recording;
	json.mediaMode = session.properties.mediaMode;
	json.recordingMode = session.properties.recordingMode;
	json.defaultRecordingProperties = session.properties.defaultRecordingProperties;
	var connections = {};
	connections.numberOfElements = session.activeConnections.length;
	var jsonArrayConnections = [];
	session.activeConnections.forEach(con => {
		var c = {};
		c.connectionId = con.connectionId;
		c.createdAt = con.createdAt;
		c.role = con.role;
		c.serverData = con.serverData;
		c.record = con.record;
		c.token = con.token;
		c.clientData = con.clientData;
		var pubs = [];
		con.publishers.forEach(p => {
			jsonP = {};
			jsonP.streamId = p.streamId;
			jsonP.createdAt = p.createdAt
			jsonP.hasAudio = p.hasAudio;
			jsonP.hasVideo = p.hasVideo;
			jsonP.audioActive = p.audioActive;
			jsonP.videoActive = p.videoActive;
			jsonP.frameRate = p.frameRate;
			jsonP.typeOfVideo = p.typeOfVideo;
			jsonP.videoDimensions = p.videoDimensions;
			pubs.push(jsonP);
		});
		var subs = [];
		con.subscribers.forEach(s => {
			subs.push(s);
		});
		c.publishers = pubs;
		c.subscribers = subs;
		jsonArrayConnections.push(c);
	});
	connections.content = jsonArrayConnections;
	json.connections = connections;
	return json;
}