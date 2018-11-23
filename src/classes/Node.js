const facts = require('../facts')

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
		if (facts[this.key].state != undefined) {
			return facts[this.key].state
		}
		switch (this.type) {
			case 'OPERATOR':
				switch (this.value) {
					case '+':
						break
					case '|':
						break
					case '^':
						break
				}
				break
			case 'OPERAND':
				if (this.value[0] == '!') {

				} else {
					return facts[this.key].resolve
				}
				break
			case 'NOT':
				break
			default:
				throw 'damn hoe! guuuuurl wtf!?'
				break
		}
	}
}

module.exports = Node
