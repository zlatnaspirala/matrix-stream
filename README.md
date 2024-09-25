# matrix-stream

## Version [2.20]

- Minimalistic webRTC client implementation based on openVidu/Kurento project.
  2.20 refer to the OV library actual version used in this project.
  No server code you need to have VPS(2core/4gb) and run openvidu middleware for kurento.

## Reasons

- Kurento is very stable media server.In old RTCMulti first lander on page take role of host
  and others aer guests. Kurento handle session indipendent this is usefull for
  disconnecting/reconnecting problematic situation.

## How to use it

  Under ./web folder
  I use module type of script without building.

  The smart way to use this lib is to use CustomEvents.
	Already integrated (buildin):

	`onConnectionCreated`

  - How to use it
	```js
	addEventListener('onConnectionCreated', (event) => {
		console.log(event)
	})
	```


## Next features
 - add compile to text/plane js
 - add to npm register add package and index.js

## Credits & Licence

- https://openvidu.io/
  https://openvidu.discourse.group/
  https://doc-kurento.readthedocs.io/en/latest/user/openvidu.html
  https://github.com/OpenVidu
