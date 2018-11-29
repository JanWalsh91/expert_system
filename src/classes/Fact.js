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
		Logger.log('Evalutate fact ' + this.key);
		if (this.evaluating) {
			Logger.log('is currently evaluating ' + this.key + ': return undefined');
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
			let hasUndefined = results.some(result => result === undefined)
			let hasTrue = results.some(result => result === true)
			let hasFalse = results.some(result => result === false)

			if (hasTrue && !hasFalse) {
				if (this.state == false) {
					Logger.log('CONTRADICK');
					throw 'contradiction'
				}
				this.state = true
			} else if (!hasTrue && hasFalse) {
				if (this.state == true) {
					Logger.log('CONTRADICK');
					throw 'contradiction'
				}
				this.state = false
			} else if (hasTrue && hasFalse) {
				// TODO: set contradiction
				this.state = undefined
				this.error = true
				// let indices = results.map((res, i) => {
				// 	if (res == true || res == false) {
				// 		return i
				// 	}
				// })
				Logger.log('CONTRADICK');
			} else if (!hasTrue && !hasFalse) {
				this.state = undefined
			}
			Logger.log('SET ' + this.key + ' to ' + this.state);
		}
		return this.state
	}
}

module.exports = Fact
