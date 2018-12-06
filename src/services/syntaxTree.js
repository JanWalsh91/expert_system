// classes
const Token = require('../classes/Token')
const Node = require('../classes/Node')

function checkParentheses(exp) {
	let depth = 0

	for (let i = 0; i < exp.length; i++) {
		if (exp.charAt(i) == '(') {
			depth++
		} else if (exp.charAt(i) == ')') {
			depth--
		}
		if (depth < 0) {
			return false
		}
	}
	return depth == 0
}

function displayTree(node, depth) {
	if (depth === undefined) depth = 0

	for (let i = 0; i < depth; i++) {
		process.stdout.write("  ");
	}
	Logger.log(node.value + ' : '+ node.key);
	node.children.forEach(child => {
		displayTree(child, depth + 1)
	})
}

function isTreeValid(node) {
	if (node.type == 'OPERATOR') {
		if (node.children.length < 2) {
			throw `Node "${node.value}" requires at least two children`
		}
	} else if (node.type == 'NOT') {
		if (node.children.length != 1) {
			throw `Node "${node.value}" requires exactly one child`
		}
	} else if (node.type == 'OPERAND') {
		if (node.children.length > 0) {
			throw `Node "${node.value}" cannot have children`
		}
	}
	node.children.forEach(child => isTreeValid(child))
}

function removeEmptyNodes(node) {
	if (node.value == null) {
		if (node.children.length > 0) {
			node.children.forEach(child => {
				node.parent.children.unshift(child)
				child.parent = node.parent
			})
		}
		node.parent.children.splice(node.parent.children.indexOf(node), 1)
	}
	for (let i = 0; i < node.children.length; i++) {
		removeEmptyNodes(node.children[i])
	}
	return true
}

function simplifyOperators(node) {
	if (node.type == 'OPERATOR' && node.value != '^') {
		let childrenToMove = []
		let childrenToRemove = []
		node.children.forEach(child => {
			if (child.value == node.value) {
				child.children.forEach(subchild => {
					subchild.parent = node
					childrenToMove.push(subchild)
				})
				childrenToRemove.push(child)
			}
		})
		childrenToRemove.forEach(child => {
			node.children.splice(node.children.indexOf(child), 1)
		})
		node.children.push(...childrenToMove)
		if (childrenToMove.length > 0) {
			simplifyOperators(node)
		}
	}
	node.children.forEach(child => {
		simplifyOperators(child)
	})
}

/*
 * Order: [A-Z][!A-!Z]+|^!
 */
function nodesOrdered(a, b) {
		function getNodeValue(node) {
			const op = ['+', '|', '^', '!']

			if (node.type == 'OPERAND') {
				if (node.value[0] == '!') {
					return node.value.charCodeAt(node.value.length - 1) + 26
				} else {
					return node.value.charCodeAt(node.value.length - 1)
				}
			}
			if (node.type == 'OPERATOR' || node.type == 'NOT') {
				return 'A'.charCodeAt(0) + op.indexOf(node.value) + 1 + 26 * 2
			}
		}
		return getNodeValue(a) - getNodeValue(b)
}

function orderNode(node) {
	node.children.sort(nodesOrdered)
	node.children.forEach(child => orderNode(child))
}

function tokenize(exp) {
	if (!checkParentheses(exp)) {
		throw 'Invalid parentheses'
	}

	let tokens = []
	for (let i = 0; i < exp.length; i++) {
		tokens.push(new Token(exp.charAt(i)))
	}
	return tokens
}

function createTree(tokens) {
	const op = {
		'(': 5,
		')': 5,
		'!': 4,
		'+': 3,
		'|': 2,
		'^': 1
	}

	let root = new Node()
	let currentNode = root

	for (let i = 0; i < tokens.length; i++) {
		switch (tokens[i].type) {
			case 'OPEN_PARENTHESES':
				let node = new Node(tokens[i])
				currentNode.children.push(node)
				node.parent = currentNode
				let emptyNode = new Node()
				node.children.push(emptyNode)
				emptyNode.parent = node
				currentNode = emptyNode
				break
			case 'CLOSE_PARENTHESES':
				if (i > 0 && tokens[i - 1].type == 'OPERATOR') {
					throw 'Invalid parentheses'
				}
				while (currentNode.type != 'OPEN_PARENTHESES' && currentNode.parent != null) {
					currentNode = currentNode.parent
				}
				if (currentNode.parent == null) throw 'Invalid parentheses'
				currentNode = currentNode.parent
				let parentheses = currentNode.children[currentNode.children.length - 1]
				currentNode.children.push(parentheses.children[0])
				parentheses.children[0].parent = currentNode
				currentNode.children.splice(currentNode.children.indexOf(parentheses), 1)
				if (currentNode.type == 'NOT' && currentNode.parent != null) {
					currentNode = currentNode.parent
				} else if (currentNode.type == 'NOT' && currentNode.parent == null) {
					throw 'Internal error'
				}
				break
			case 'OPERAND':
				if (i > 0 && (tokens[i - 1].value.match(/^[A-Z]+$/))) {
					throw 'Cannot have two operands in a row'
				}
				if (currentNode.type == null || currentNode.type == 'OPERATOR' || currentNode.type == 'NOT') {
					let node = new Node(tokens[i])
					currentNode.children.push(node)
					node.parent = currentNode
				}
				break
			case 'OPERATOR':
				if (i > 0 && tokens[i - 1].type == 'OPERATOR') {
					throw 'Cannot have two operators in a row'
				}
				if (currentNode.type == 'NOT') {
					while (currentNode.type == 'NOT' && currentNode.parent != null) {
						currentNode = currentNode.parent
					}
				}
				if (currentNode.type == null) {
					currentNode.type = tokens[i].type
					currentNode.value = tokens[i].value
					break
				}
				if (currentNode.type == 'OPERATOR') {
					if (tokens[i].value == currentNode.value) {
						break
					}
					if (op[tokens[i].value] > op[currentNode.value]) {
						if (currentNode.children.length < 2) {
							throw 'Operator requires at least two children'
						}
						let a = currentNode.children[currentNode.children.length - 1]
						let node = new Node(tokens[i])
						currentNode.children.push(node)
						node.parent = currentNode
						node.children.push(a)
						currentNode.children.splice(currentNode.children.indexOf(a), 1)
						currentNode = node
					} else {
						while (op[tokens[i].value] <= op[currentNode.value] && currentNode.parent != null && currentNode.type != 'OPEN_PARENTHESES') {
							currentNode = currentNode.parent
						}
						if (currentNode.value == null) {
							currentNode.type = tokens[i].type
							currentNode.value = tokens[i].value
							break
						}
						if (currentNode.value == tokens[i].value) {
							break
						}
						if (currentNode.parent == null) {
							let node = new Node(tokens[i])
							node.children.push(currentNode)
							currentNode.parent = node
							root = node
							currentNode = node
							break
						}
						let a = currentNode.children[currentNode.children.length - 1]
						let node = new Node(tokens[i])
						currentNode.children.push(node)
						node.parent = currentNode
						node.children.push(a)
						currentNode.children.splice(currentNode.children.indexOf(a), 1)
						currentNode = node
					}
				}
				break;
			case 'NOT':
				if (i + 1 >= tokens.length) throw '"!" must be followed by something'
				if (tokens[i + 1].type == 'OPERATOR') throw '"!" cannot be followed by an operator'

				let newNode = new Node(tokens[i])
				currentNode.children.push(newNode)
				newNode.parent = currentNode
				currentNode = newNode

				break;
		}
	}

	while (root.value == null) {
		if (root.children.length > 1) {
			throw 'Multiple trees detected'
		}
		root = root.children[0]
		root.parent = null
	}

	removeEmptyNodes(root)

	simplifyOperators(root)

	isTreeValid(root)

	return root
}

function createKeyFromNode(node) {
	let key = ''
	key += node.value
	node.children.forEach(child => {
		key += createKeyFromNode(child)
	})
	return key
}

function duplicateNode(node) {
	let newNode = Node.duplicate(node)
	let newChildren = node.children.map(child => duplicateNode(child))
	newNode.children = newChildren
	newChildren.forEach(child => child.parent = newNode)
	return newNode
}

function negateNode(node) {
	node = duplicateNode(node)
	if (node.type == 'OPERAND' && node.value.charAt(0) == '!') {
		node.value = node.value.charAt(1)
	} else if (node.type == 'OPERAND') {
		node.value = '!' + node.value.charAt(0)
	} else if (node.type == 'OPERATOR') {
		let notNode = new Node({value: '!', type: 'NOT'})
		node.parent = notNode
		notNode.children.push(node)
		node = notNode
	}
	return node
}

const syntaxTree = {

	displayTree: root => {
		displayTree(root)
	},

	createTree: string => {
		if (string.length == 0) {
			throw 'Expression empty'
		}
		let tokens = tokenize(string)
		let tree = createTree(tokens)
		orderNode(tree)
		return tree
	},

	assignKeysToNodes: node => {
		node.key = createKeyFromNode(node)
		node.children.forEach(child => {
			syntaxTree.assignKeysToNodes(child)
		})
	},

	createKeyFromNode,

	duplicateNode,

	negateNode,

	simplifyOperators
}

module.exports = syntaxTree
