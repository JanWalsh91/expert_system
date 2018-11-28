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

	static getRootKey (key) {
		while (key[0] == '!') {
			key = key.substring(1)
		}
		return key
	}

	static keyExists (key) {
		return (facts[Fact.getRootKey(key)] != undefined)
	}

	static evaluate (key) {
		let switchValue = false
		while (key[0] == '!') {
			key = key.substring(1)
			switchValue = !switchValue
		}
		let ret = facts[key].evaluate()
		if (ret == undefined) {
			return undefined
		} else {
			return switchValue ? !ret : ret
		}
	}

	evaluate() {
		console.log('Evalutate fact ' + this.key);
		if (this.evaluating) {
			console.log('is currently evaluating ' + this.key + ': return undefined');
			return undefined
		}

		// TODO: consider removing.
		// TODO: only do if all rules haev been satisfiyed (confirmed)
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
					if (facts[Fact.getRootKey(child.key)].state == undefined) {
						facts[Fact.getRootKey(child.key)].state = 'ambiguous'
					}
				})
			}
			return ret
		})

		console.log('rule results 1: ');
		console.log(results);

		results = results.map((result, i) => {
			if (result != true) return undefined
			else {
				let switchValue = false
				let key = this.rules[i].conclusionTree.key
				console.log('key: ' + key);
				while (key[0] == '!') {
					key = key.substring(1)
					switchValue = !switchValue
				}
				console.log('i: ' + i + ' switch valeu: ' + switchValue);
				return switchValue ? !result : result
			}
		})

		console.log('rule results 2: ');
		console.log(results);

		this.error = false
		if (results.length == 0) {
			// this.state == undefined
			this.state == false
		} else {
			let hasUndefined = results.some(result => result === undefined)
			let hasTrue = results.some(result => result === true)
			let hasFalse = results.some(result => result === false)

			if (hasTrue && !hasFalse) {
				this.state = true
			} else if (!hasTrue && hasFalse) {
				this.state = false
			} else if (hasTrue && hasFalse) {
				this.state = undefined
				this.error = true
				// let indices = results.map((res, i) => {
				// 	if (res == true || res == false) {
				// 		return i
				// 	}
				// })
				console.log('CONTRADICK');
				// console.log('contraditcting rules: ' + indices);
			} else if (!hasTrue && !hasFalse) {
				this.state = undefined
			}
			console.log('SET ' + this.key + ' to ' + this.state);
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
