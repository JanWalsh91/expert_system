const facts = require('../facts')

class Fact {
	constructor(params) {
		params = params || {}
		let defaultParams = {
			expression: '',
			key: '',
			state: undefined, // true, false, undefined
			rules: [],
			error: false,
			query: false,
			evaluating: false
		}
		params = {
			...defaultParams,
			...params
		}
		Object.assign(this, params)
	}

	evaluate() {
		console.log('Evalutate fact ' + this.key);
		if (this.evaluating) {
			console.log('is currently evaluating ' + this.key + ': return undefined');
			return undefined
		}

		if (this.state != undefined) {
			console.log(this.key + ' state already set to ' + this.state + ': return ' + this.state);
			return this.state
		}

		let results = this.rules.map(rule => {
			console.log('Evaulating rule ' + rule.conditionsTree.key + ' => ' + rule.conclusionTree.key);
			this.evaluating = true
			let ret = rule.evaluate()
			this.evaluating = false
			console.log('Evaulating rule ' + rule.conditionsTree.key + ' => ' + rule.conclusionTree.key + ' END');
			console.log('ret : '  + ret);
			if (ret == true && rule.conclusionTree.key[0] == '|') {
				rule.conclusionTree.children.forEach(child => {
					if (facts[child.key].state != true) { //TODO: != true ? or == undefined
						facts[child.key].state = 'ambiguous'
					}
				})
			}
			return ret == true ? true : undefined
		})
		if (results.length == 0) {
			// this.state == undefined
			this.state == false
			this.error = false
			// console.log('SET ' + this.key + ' to ' + this.state);
		} else if (results.some(result => result === true)) {
			this.state = true
			this.error = false
			// console.log('SET ' + this.key + ' to ' + this.state);
		}
		// else {
		// 	this.state = undefined
		// 	this.error = 'conflicting rules'
		// }
		// console.log('SET ' + this.key + ' to ' + this.state);
		return this.state
	}
}

module.exports = Fact
