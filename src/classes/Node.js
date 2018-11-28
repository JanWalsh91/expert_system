const facts = require('../facts')
const Fact = require('./Fact')

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
		console.log('Evaluate node ' + this.key);
		if (Fact.keyExists(this.key)) {
			// console.log(this.key + ' : ' + facts[this.key].state);
			// if (facts[this.key].state != undefined) {
			// 	return facts[this.key].state
			// }
			return Fact.evaluate(this.key)
		}
		console.log('node ' + this.key + ' not in facts');
		let results
		switch (this.type) {
			case 'OPERATOR':
				switch (this.value) {
					case '+':
					console.log('+');
						results = this.children.map(child => child.evaluate())
						var ret = (results.every(result => result === true))
						var hasUndefined = (results.some(result => result === undefined))
						if (hasUndefined) return undefined
						else return ret
						break
					case '|':
					console.log('|');
						results = this.children.map(child => child.evaluate())
						console.log("results: ");
						console.log(results);
						let hasTrue = (results.some(result => result === true))
						hasUndefined = (results.some(result => result === undefined))
						console.log('hasTrue: ' + hasTrue);
						console.log('hasUndefined: ' + hasUndefined);
						if (!hasTrue && hasUndefined) {
							console.log(this.key + ' : undefined')
							return undefined
						}
						else return hasTrue
						break
					case '^':
						results = this.children.map(child => child.evaluate())
						if (results.some(result => result == undefined)) return undefined
						return results[0] === !results[1]
						break
				}
				break
			case 'OPERAND':
				console.log(this.key + ' is OPERAND');
				if (this.value.charAt(0) == '!') {
					if (facts[this.value.charAt(1)] != undefined) {
						ret = facts[this.value.charAt(1)].evaluate()
						if (ret === undefined) return undefined
						return !ret
					}
					return undefined
				} else {
					if (facts['!' + this.value.charAt(0)] != undefined) {
						ret = facts['!' + this.value.charAt(0)].evaluate()
						if (ret === undefined) return undefined
						return !ret
					}
				}
				break
			case 'NOT':
				ret = this.children[0].evaluate()
				if (ret === undefined) return undefined
				return !ret
				break
			default:
				throw 'damn hoe! guuuuurl wtf!?'
				break
		}
	}
}

module.exports = Node
