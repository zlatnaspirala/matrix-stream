//----------------------
// CATCH HACKER
//----------------------

export var isSafari = function() {return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)},
	isMozilla = navigator.userAgent.toLowerCase().indexOf('mozilla') > -1,
	isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
	isUbuntu = navigator.userAgent.toLowerCase().indexOf('ubuntu') > -1,
	isLinux = navigator.userAgent.toLowerCase().indexOf('linux') > -1,
	isGecko = navigator.userAgent.toLowerCase().indexOf('gecko') > -1,
	isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1,
	isMacintosh = navigator.userAgent.toLowerCase().indexOf('macintosh') > -1,
	isAppleWebKit = navigator.userAgent.toLowerCase().indexOf('applewebkit') > -1,
	isAndroid = navigator.userAgent.toLowerCase().indexOf('android') > -1,
	isMobile = navigator.userAgent.toLowerCase().indexOf('mobile') > -1,
	getChromeVersion = function() {
		var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
		return raw ? parseInt(raw[2], 10) : false;
	};

export var isTouchableDevice = function() {
	if(('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints > 0)) {
		return true;
	} else {
		return false;
	}
}

const byId = id => document.getElementById(id)

let catchHacker = {
	testBT: async function() {
		navigator.permissions.query({name: "bluetooth"}).then((e) => {
			// alert('ok , ', e)
			console.log('WHAT ', e)
		}).catch((err) => {
			// alert('err , ', err)
			console.log('WHAT ', err)
		});

		if('bluetooth' in navigator) {
			// Web Bluetooth API is supported
			alert('Web Bluetooth is supported!');
			this.scanBT()

		} else {
			// Web Bluetooth API is not supported
			alert('Web Bluetooth is not supported!');
		}
	},

	initial: function() {
		console.log(`iW: ${window.innerWidth}  oW: ${window.outerWidth}`)
		if(window.outerWidth != window.innerWidth) {
			var delta = window.outerWidth - window.innerWidth
			if(delta > 18) {
				console.log('RISK LEVEL')
			}
		} else {
			console.log('NORMAL SCREEN')
		}

		this.attach()
	},

	scanBT: () => {
		navigator.bluetooth.requestDevice({filters: [{services: ['battery_service']}]})
			.then(device => {
				console.log('Device Name:', device.name);
				console.log('Device ID:', device.id);
			})
			.catch(err => {
				console.error('Error:', err);
			});
	},

	attach: () => {
		window.addEventListener("keydown", (event) => {
			console.log('TEST KEY: ', event)
			if(event.code == 'F12' || event.key == 'F12') {
				console.log('RISK +', event)
			}
		});
		byId('test').addEventListener('click', () => {
			catchHacker.testBT()
		})
	},

	detectKEY: (e) => {
		console.log('detectKEY KEY: ', e)
	}
}

// RUN
catchHacker.initial()
