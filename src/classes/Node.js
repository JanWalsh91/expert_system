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
}

module.exports = Node
