// classes
const Fact = require('./Fact')
const Logger = require('./Logger')

// data
const facts = require('../facts')
const rules = require('../rules')

// services
const syntaxTree = require('../services/syntaxTree')

class Rule {
	constructor(params) {
		params = params || {}
		let defaultParams = {
			conditionsTree: null,
			conclusionTree: null,
			state: undefined
		}
		params = {
			...defaultParams,
			...params
		}
		Object.assign(this, params)
	}

	static createFromString(string) {

		let ifAndOnlyIf = false;
		let parts = []
		if (!( ((parts = string.split('<=>')).length == 2 && (ifAndOnlyIf = true)) || (parts = string.split('=>')).length == 2) ) {
			throw 'Invalid rule "' + string + '"'
		}

		let leftTree, rightTree
		leftTree = syntaxTree.createTree(parts[0])
		rightTree = syntaxTree.createTree(parts[1])

		if (!ifAndOnlyIf) {
			let rule = new Rule({conditionsTree: leftTree, conclusionTree: rightTree})
		 	return rule
		} else {
			let rules = []
			rules.push(new Rule({conditionsTree: leftTree, conclusionTree: rightTree}))
			rules.push(new Rule({conditionsTree: rightTree, conclusionTree: leftTree}))
			return rules
		}
	}

	display() {
		Logger.log(`Rule: ${this.conditionsTree.key} => ${this.conclusionTree.key}`, true);
	}

	evaluate() {
		Logger.log('Evaluate rule ' + this.conditionsTree.key + ' => ' + this.conclusionTree.key + ' - START');
		this.state = this.conditionsTree.evaluate()
		Logger.log('Evaluate rule ' + this.conditionsTree.key + ' => ' + this.conclusionTree.key + ' is ' + this.state + ' - END');
		return this.state
	}
}

module.exports = Rule
