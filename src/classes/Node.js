const facts = require('../facts')
const Fact = require('./Fact')
const Logger = require('./Logger')

class Node {
	constructor(token) {
		this.children = []
		this.value = null
		this.type = null
		this.parent = null
		this.key = ''
		if (token) {
			this.value = token.value
			this.type = token.type
		}
	}

	static duplicate(node) {
		if (!(node instanceof Node)) throw 'no bitch! ya can\'t do dat shit'
		let newNode =  new Node({value: node.value, type: node.type})
		newNode.key = node.key
		return newNode
	}

	evaluate() {
		Logger.log('Evaluate node ' + this.key + ' - START');
		if (Fact.keyExists(this.key)) {
			return Fact.evaluate(this.key)
		}

		const logAndReturn = ret => {
			Logger.log('Evaluate node ' + this.key + ': ' + ret + ' - END');
			return ret
		}

		// Logger.log('node ' + this.key + ' not in facts');
		let results
		switch (this.type) {
			case 'OPERATOR':
				switch (this.value) {
					case '+':
						results = this.children.map(child => child.evaluate())
						var ret = (results.every(result => result === true))
						var hasUndefined = (results.some(result => result === undefined))
						if (hasUndefined) return logAndReturn(undefined)
						else return logAndReturn(ret)
						break
					case '|':
						results = this.children.map(child => child.evaluate())
						let hasTrue = (results.some(result => result === true))
						hasUndefined = (results.some(result => result === undefined))
						if (!hasTrue && hasUndefined) {
							return logAndReturn(undefined)
						}
						else return logAndReturn(hasTrue)
						break
					case '^':
						results = this.children.map(child => child.evaluate())
						if (results.some(result => result == undefined)) return logAndReturn(undefined)
						return logAndReturn(results[0] === !results[1])
						break
				}
				break
			case 'OPERAND':
				if (this.value.charAt(0) == '!') {
					if (facts[this.value.charAt(1)] != undefined) {
						ret = facts[this.value.charAt(1)].evaluate()
						if (ret === undefined) return logAndReturn(undefined)
						return logAndReturn(!ret)
					}
					return logAndReturn(undefined)
				} else {
					if (facts['!' + this.value.charAt(0)] != undefined) {
						ret = facts['!' + this.value.charAt(0)].evaluate()
						if (ret === undefined) return logAndReturn(undefined)
						return logAndReturn(!ret)
					}
				}
				break
			case 'NOT':
				ret = this.children[0].evaluate()
				if (ret === undefined) return logAndReturn(undefined)
				return logAndReturn(!ret)
				break
			default:
				throw 'Invalid type'
				break
		}
	}
}

module.exports = Node
