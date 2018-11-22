const fs = require('fs')
const Rule = require('./classes/Rule')
const Fact = require('./classes/Fact')

// data
const rules = require('./rules')
const facts = require('./facts')

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
			for (let i = 1; i < line.length; i++) {
				let key = line.charAt(i)
				if (!key.match(/^[A-Z]+$/)) {
					throw 'Invalid initial fact'
				}
				facts[key] = new Fact({key: key, state: true})
			}
		} else if (line[0] == '?') {
			for (let i = 1; i < line.length; i++) {
				let key = line.charAt(i)
				if (!key.match(/^[A-Z]+$/)) {
					throw 'Invalid query'
				}
				facts[key] = new Fact({key: key, query: true})
			}
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
		// console.log('tree');
		syntaxTree.displayTree(rule.conditionsTree)
		// syntaxTree.displayTree(rule.conclusionTree)
		// Fact.createKeysFromNode(rule.conclusionTree)
	})

	console.log(facts);

}
