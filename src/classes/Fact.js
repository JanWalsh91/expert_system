class Fact {
	constructor(params) {
		params = params || {}
		let defaultParams = {
			expression: '',
			rpn: '',
			state: undefined, // true, false, undefined
			rules: {
				conditions: [],		// rule including this as part of condition
				conclusions: [],	// rule having this as conclusion
			},
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

	static toRPN(infix) {
		
	}

}

module.exports = Fact
