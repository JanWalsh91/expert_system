class Fact {
	constructor(params) {
		params = params || {}
		let defaultParams = {
			expression: '',
			key: '',
			state: undefined, // true, false, undefined
			rules: [],
			error: false,
			query: false
		}
		params = {
			...defaultParams,
			...params
		}
		Object.assign(this, params)
	}

	resolve() {
		let results = rules.map(rule => rule.resolve())
		if (results.length == 0) {
			this.state == undefined
			this.error = false
		} else if (results.every(result => result == results[0])) {
			this.state = result[0]
			this.error = false
		} else {
			this.state = undefined
			this.error = 'conflicting rules'
		}
		return this.state
	}
}

module.exports = Fact
