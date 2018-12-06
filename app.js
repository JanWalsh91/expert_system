const express = require('express')
const bodyParser = require('body-parser')
const expertSystem = require('./src/expert_system.js').expertSystem
const app = express()

app.use(express.static(__dirname + '/client'))

app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/client/index.html')
})

app.post('/', (req, res) => {
	let lines = req.body.esText.replace(/[ \t\v]+/ig, '');
	lines = lines.split(/\r?\n/)
	var ret = expertSystem(lines, req.body.verbose)
	res.send(ret)
})

let port = 8080;

app.listen(port, () => {
	console.log('Listening at ' + port + '...');
})

app.use((err, req, res, next) => {
	console.log(err);
  if (err) {
		console.error('Invalid Request data')
		if (err.type === 'entity.too.large') {
			res.status(413)
		}
    res.send({srvError: 'Invalid Request data'})
  } else {
    next()
  }
})
