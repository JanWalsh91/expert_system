const Fact = require('./Fact') 
const facts = require('../facts') 
const rules = require('../rules')

class Rule {
	constructor(params) {
		params = params || {}
		let defaultParams = {
			satisfied: false,
			expression: null,
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

		if (string.includes('<=>')) {
			let s1 = string.split('<=>')[0]
			let s2 = string.split('<=>')[1]
			this.createFromSubString(s1, s2)
			this.createFromSubString(s2, s1)
		} else {
			let condition = string.split('=>')[0]
			let conclusion = string.split('=>')[1]
			console.log(condition)
			console.log(conclusion)
			this.createFromSubString(condition, conclusion)
		}

	}

	static createFromSubString(condition, conclusion) {
		console.log('createFromSubString')
		let factKey = Fact.toRPN(conclusion)
		if (facts.hasOwnProperty(factKey)) {
			// add rule to fact.rules.conclusion
		} else {
			let fact = new Fact({expression: conclusion})
			console.log(fact)
			facts[factKey] = fact
		}

		// if conclusion is complex
		if (conclusion.length > 1) {

		}
			// break up conclusion
			// for each conclusion
				// create new rule
				// recursive (createFromString)


		// condition

		// create fact from expression
		// break up fact
		// for each subfact
			// recursive
	}
}

module.exports = Rule