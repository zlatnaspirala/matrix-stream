import {BIGLOG, byId, closeSession, joinSession, leaveSession, netConfig, REDLOG, removeUser} from "./matrix-stream";

/**
 * Main instance for matrix-stream
 * version 1.0.0 beta
 */

export class MatrixStream {
	constructor(arg) {
		if (typeof arg === 'undefined') {
			throw console.error('MatrixStream constructor must have argument : { domain: <DOMAIN_NAME> , port: <NUMBER> }');
		}
		netConfig.NETWORKING_DOMAIN = arg.domain;
		netConfig.NETWORKING_PORT = arg.port;
		this.joinSessionUI = byId("join-btn");
		this.buttonCloseSession = byId('buttonCloseSession')
		this.buttonLeaveSession = byId('buttonLeaveSession')
		this.attachEvents();
		console.log(`%c MatrixStream constructed.`, BIGLOG)
	}

	attachEvents() {
		this.joinSessionUI.addEventListener('click', joinSession)
		this.buttonCloseSession.addEventListener('click', closeSession)
		this.buttonLeaveSession.addEventListener('click', () => {
			console.log(`%c LEAVE SESSION`, REDLOG)
			removeUser()
			leaveSession()
		})
	}
}

// -----------------------
// Make run
// -----------------------

window.matrixStream = new MatrixStream({
	domain: 'maximumroulette.com',
	port: 2020
})
