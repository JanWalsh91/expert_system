const express = require('express')
const bodyParser = require('body-parser')
const expertSystem = require('./src/index.js')
const app = express()

app.use(express.static(__dirname + '/client'))

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/client/index.html')
})

app.post('/', (req, res) => {
	console.log(req.body)
	let lines = req.body.esText.replace(/[ \t\v]+/ig, '');
	lines = lines.split(/\r?\n/)
	var ret = expertSystem.expertSystem(lines)
	res.send(ret)
})

app.listen(8080, () => {
	console.log("Hello WEB");
})
