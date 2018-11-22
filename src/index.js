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
				if (facts[key] == undefined) {
					facts[key] = new Fact({key: key, state: true})
				}
			}
		} else if (line[0] == '?') {
			for (let i = 1; i < line.length; i++) {
				let key = line.charAt(i)
				if (!key.match(/^[A-Z]+$/)) {
					throw 'Invalid query'
				}
				if (facts[key] == undefined) {
					facts[key] = new Fact({key: key, query: true})
				} else {
					facts[key].query = true
				}
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
		console.log('== RULE ==');
		console.log('\t condition');
		syntaxTree.displayTree(rule.conditionsTree)
		console.log('\t conclusion');
		syntaxTree.displayTree(rule.conclusionTree)

		let key = syntaxTree.createKeyFromNode(rule.conclusionTree)

		if (facts[key] == undefined) {
			facts[key] = new Fact({key: key, rules: [rule]})
		} else {
			facts[key].rules.push(rule)
		}
	})

	// TODO: create subrules (A => B + C ===> A => B & A => C)

	// TODO: add false facts to facts
	// facts which are not in the dictionary

	console.log(facts);

}
