const fs = require('fs')
const expertSystem = require('./expert_system.js').expertSystem
const displayLogs = require('./expert_system.js').displayLogs

// services
const Logger = require('./classes/Logger')

let fileName = ''

console.log(process.argv[0]);
console.log(process.argv[1]);

let verbose = false;
for (let i = 2; i < process.argv.length; i++) {
	switch (process.argv[i]) {
		case '-v':
			verbose = true;
			break;
		default:
			fileName = process.argv[i]
	}
}

let error = false
if (fileName) {
	let lines = readFile(fileName)
	if (lines) {
		expertSystem(lines, verbose)
	} else {
		error = true
	}
} else {
	error = true;
	Logger.error('Error: Please provide input file');
}

if (error) {
	displayLogs()
}

function readFile(fileName) {
		let contents;
		try {
			contents = fs.readFileSync(fileName, 'utf8');
			contents = contents.replace(/[ \t\v]+/ig, '');
			let lines = contents.split(/\r?\n/)
			return lines
		} catch(e) {
			Logger.error("Error: " + e.message)
			return
		}
}
