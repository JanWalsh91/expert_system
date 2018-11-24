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
			this.evaluating = true
			let ret = rule.evaluate()
			this.evaluating = false
			return ret
		})
		if (results.length == 0) {
			this.state == undefined
			this.error = false
		} else if (results.every(result => result == results[0])) {
			this.state = results[0]
			this.error = false
		} else {
			this.state = undefined
			this.error = 'conflicting rules'
		}
		console.log('SET ' + this.key + ' to ' + this.state);
		return this.state
	}
}

module.exports = Fact
