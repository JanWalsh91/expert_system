const facts = require('../facts')
const Logger = require('./Logger')

class Fact {
	constructor(params) {
		params = params || {}
		let defaultParams = {
			key: '',
			state: undefined, // true, false, undefined, ambiguous
			rules: [],
			error: false,
			query: false,
			evaluating: false,
			// initialFact: false
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
		Logger.log('Evalutate fact ' + this.key);
		if (this.evaluating) {
			Logger.log('is currently evaluating ' + this.key + ': return undefined');
			return undefined
		}

		if (this.error == 'contradition') {
			return undefined
		}

		if (this.state != undefined && this.rules.every(rule => rule.state != undefined)) {
			Logger.log(this.key + ' state already set to ' + this.state + ': return ' + this.state);
			return this.state
		}

		let results = this.rules.map(rule => {
			Logger.log('Evaulating rule ' + rule.conditionsTree.key + ' => ' + rule.conclusionTree.key);
			this.evaluating = true
			let ret = rule.evaluate()
			this.evaluating = false
			Logger.log('Evaulating rule ' + rule.conditionsTree.key + ' => ' + rule.conclusionTree.key + ' END');

			if (ret == true && (rule.conclusionTree.key[0] == '|' || rule.conclusionTree.key[0] == '^')) {
				rule.conclusionTree.children.forEach(child => {
					if (facts[Fact.getRootKey(child.key)].state == undefined) {
						facts[Fact.getRootKey(child.key)].state = 'ambiguous'
					}
				})
			}
			return ret
		})

		results = results.map((result, i) => {
			if (result != true) return undefined
			else {
				let switchValue = false
				let key = this.rules[i].conclusionTree.key
				while (key[0] == '!') {
					key = key.substring(1)
					switchValue = !switchValue
				}
				return switchValue ? !result : result
			}
		})

		this.error = false
		if (results.length == 0) {
			this.state == false
		} else {
			const foundContradition = () => {
				Logger.log('Contradition in fact ' + this.key)
				if (this.state == true || this.state == false) {
					Logger.log('- Initial fact: ' + this.state)
				}
				this.rules.forEach(rule => {
					Logger.log('- Rule ' + rule.conditionsTree.key + ' => ' + rule.conclusionTree.key + ' is true')
				})
				this.error = 'contradiction'
				this.state = undefined
			}
			
			let hasUndefined = results.some(result => result === undefined)
			let hasTrue = results.some(result => result === true)
			let hasFalse = results.some(result => result === false)

			if ((this.state == false && hasTrue) ||
				(this.state == true && hasFalse) ||
				(hasTrue && hasFalse)) {
				foundContradition()
			} else if (hasTrue) {
				this.state = true
				Logger.log('SET ' + this.key + ' to ' + this.state);
			} else if (hasFalse) {
				this.state = false
				Logger.log('SET ' + this.key + ' to ' + this.state);
			}
			Logger.log(this.key + ': ' + this.state);
			
		}
		return this.state
	}
}

module.exports = Fact
