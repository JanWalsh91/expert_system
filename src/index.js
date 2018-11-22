const fs = require('fs')
const Rule = require('./classes/Rule')

// data
const rules = require('./rules')

// services
const syntaxTree = require('./services/syntaxTree')



const fileName = process.argv[2]
if (fileName) {
	let contents = fs.readFileSync(fileName, 'utf8');

	contents = contents.replace(/[ \t\v]+/ig, '');

	let lines = contents.split(/\r?\n/)

	lines.forEach(line => {
		line = line.split('#')[0]
		if (line.length == 0) return

		if (line[0] == '=') {
			// create fact
		} else if (line[0] == '?') {
			// set queries
		} else if (line.includes('=>')){

			let ret = Rule.createFromString(line)
			if (ret instanceof Array) {
				rules.push(...ret)
			} else {
				rules.push(ret)
			}
		}
	})

	rules.forEach(rule => {
		syntaxTree.displayTree(rule.conditionsTree)
		syntaxTree.displayTree(rule.conclusionTree)
	})
}
