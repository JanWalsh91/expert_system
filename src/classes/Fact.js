// const Rules = require('./Rules')

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

	parseFact(line) {

	}



}

module.exports = Fact
