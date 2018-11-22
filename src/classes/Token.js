class Token {
	constructor(value) {
		const types = ['(', ')', '+', '|', '^']
		function isValidToken(t) {
			return types.includes(t) || t.match(/^[A-Z]+$/) || t == '!'
		}

		if (!isValidToken(value)) {
			throw 'Invalid token' + value
		}

		function getType(t) {
			if (t == '(') return 'OPEN_PARENTHESES'
			if (t == ')') return 'CLOSE_PARENTHESES'
			if (types.includes(t)) return 'OPERATOR'
			if (t.match(/^[A-Z]+$/)) return 'OPERAND'
			if (t == '!') return 'NOT'
		}

		this.value = value
		this.type = getType(this.value)
	}
}

module.exports = Token
