const express = require('express')
const bodyParser = require('body-parser')
const expertSystem = require('./src/index.js')
const app = express()

app.use(express.static(__dirname + '/client'))

app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({limit: '1mb', extended: true}));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/client/index.html')
})

app.post('/', (req, res) => {
	let lines = req.body.esText.replace(/[ \t\v]+/ig, '');
	lines = lines.split(/\r?\n/)
	var ret = expertSystem.expertSystem(lines, req.body.verbose)
	res.send(ret)
})

let port = 8080;

app.listen(port, () => {
	console.log('Listening at ' + port + '...');
})

app.use((err, req, res, next) => {
  if (err) {
		console.error('Invalid Request data')
		if (err.type === 'entity.too.large') {
			res.status(413)
		}
    res.send('Invalid Request data')
  } else {
    next()
  }
})
