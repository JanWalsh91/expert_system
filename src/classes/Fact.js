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
		Logger.log('Evaluate fact ' + this.key + ' - START');
		// if fact is currently being evaluated, return to avoid infinite loop
		if (this.evaluating) {
			Logger.log('Evaluate fact ' + this.key + ': ' + this.state + ' - END');
			return undefined
		}
		// if a fact has a contradiction, treat is as undefined
		if (this.error == 'contradiction') {
			Logger.log('Evaluate fact ' + this.key + ': ' + this.state + ' - END');
			return undefined
		}
		// if state has value and all rules are solved, return value
		if (this.state != undefined && this.rules.every(rule => rule.state != undefined)) {
			Logger.log('Evaluate fact ' + this.key + ': ' + this.state + ' - END');
			return this.state
		}
		// calculate result of all rules of fact
		let results = this.rules.map(rule => {
			this.evaluating = true
			let ret = rule.evaluate()
			this.evaluating = false
			// set facts of child nodes to ambiguous in some cases (T => A|B or T => A^B)
			if (ret == true && (rule.conclusionTree.key[0] == '|' || rule.conclusionTree.key[0] == '^')) {
				if (rule.conclusionTree.value == '^') {
					let children = rule.conclusionTree.children
					if (children.every(child => {
						return children.every(child2 => {
							return child.key === child2.key
						})
					})) {
						if (children.length % 2 == 0) {
							if (Fact.keyExists(children[0].key)) {
								facts[Fact.getRootKey(children[0].key)].error = 'contradition'
								facts[Fact.getRootKey(children[0].key)].state = undefined
							}
						} else {
							facts[children[0].key].state = true
						}
					}
				}

				rule.conclusionTree.children.forEach(child => {
					if (facts[Fact.getRootKey(child.key)].state == undefined) {
						facts[Fact.getRootKey(child.key)].state = 'ambiguous'
					}
				})
			}
			return ret
		})
		// change results. F => undefined, undefined => undefined, fact is false: T => F, F => T
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
		// evaluate results of rules. Compare to current state. Update state.
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
				Logger.log('SET ' + this.key + ' to: ' + this.state + ': contradition');
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
				Logger.log('SET ' + this.key + ' to: ' + this.state);
			} else if (hasFalse) {
				this.state = false
				Logger.log('SET ' + this.key + ' to: ' + this.state);
			}
		}
		Logger.log('Evaluate fact ' + this.key + ': ' + this.state + ' - END');
		return this.state
	}
}

module.exports = Fact
