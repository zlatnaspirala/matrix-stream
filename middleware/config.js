/**
 * @description
 * Main config for KureOrange minimalistic version.
 * Just stream and also your are free to add any code on top.
 */
class ServerConfig {

	constructor() {
		// enum : 'dev' or 'prod'
		this.serverMode = "dev";

		this.domain = {
			dev: "localhost",
			prod: "maximumroulette.com"
		};

		this.masterServerKey = "GLOBAL_ROOM";
		this.protocol = "https";
		this.isSecure = true;

		this.middlewarePort = 999;

		// localhost certs
		this.certPathSelf = {
			pKeyPath: "./self-cert/privatekey.pem",
			pCertPath: "./self-cert/certificate.pem",
			pCBPath: "./self-cert/certificate.pem"
		};

		// production certs
		this.certPathProd = {
			pKeyPath: "/etc/letsencrypt/live/ai.maximumroulette.com-0001/privkey.pem",
			pCertPath: "/etc/letsencrypt/live/ai.maximumroulette.com-0001/cert.pem",
			pCBPath: "/etc/letsencrypt/live/ai.maximumroulette.com-0001/fullchain.pem"
		};

		console.log("Server running under configuration => ", this.serverMode);
		console.log("-rtc masterServerKey", this.masterServerKey);
		console.log("-rtc middlewarePort", this.middlewarePort);
		console.log("-rtc protocol", this.protocol);
		console.log("-rtc isSecure", this.isSecure);
	}
}
module.exports = ServerConfig;