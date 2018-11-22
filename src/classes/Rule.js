// classes
const Fact = require('./Fact')

// data
const facts = require('../facts')
const rules = require('../rules')

// services
const syntaxTree = require('../services/syntaxTree')


class Rule {
	constructor(params) {
		params = params || {}
		let defaultParams = {
			satisfied: false,
			conditionsTree: null,
			conclusionTree: null,
			expressionString: '',
			result: undefined,
			error: false
		}
		params = {
			...defaultParams,
			...params
		}
		Object.assign(this, params)
	}

	static createFromString(string) {
		console.log('createRuleFromString: ' + string)

		let ifAndOnlyIf = false;
		let parts = []
		if (!( ((parts = string.split('<=>')).length == 2 && (ifAndOnlyIf = true)) || (parts = string.split('=>')).length == 2) ) {
			console.log('Error: ' + parts)
			console.log(parts.length)
			return
		}

		let leftTree, rightTree
		try {
			leftTree = syntaxTree.createTree(parts[0])
			rightTree = syntaxTree.createTree(parts[1])
		} catch (e) {
			console.log(e)
			return
		}

		if (!ifAndOnlyIf) {
		 	return new Rule({conditionsTree: leftTree, conclusionTree: rightTree})
		} else {
			return [
				new Rule({conditionsTree: leftTree, conclusionTree: rightTree}),
				new Rule({conditionsTree: rightTree, conclusionTree: leftTree})
			]
		}

	}
}

module.exports = Rule
