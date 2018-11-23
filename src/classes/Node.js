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
}

module.exports = Node
