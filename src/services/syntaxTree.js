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
	console.log(node.value + ' : '+ node.key);
	node.children.forEach(child => {
		displayTree(child, depth + 1)
	})
}

function isTreeValid(node) {
	if (node.type == 'OPERATOR') {
		if (node.children.length < 2) {
			throw `node ${node.value} requries at least 2 children`
		}
		if (node.value == '^' && node.children.length != 2) {
			throw `node ${node.value} requries exactly 2 children`
		}
	} else if (node.type == 'NOT') {
		if (node.children.length != 1) {
			throw `node ${node.value} requries exactly 1 child`
		}
		if (node.children[0].type == 'NOT') {
			throw 'cannot have two NOTs in a row'
		}
	} else if (node.type == 'OPERAND') {
		if (node.children.length > 0) {
			throw `node ${node.value} cannot have children`
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
		throw 'parentheses error'
	}

	let tokens = []
	for (let i = 0; i < exp.length; i++) {
		try {
			tokens.push(new Token(exp.charAt(i)))
		} catch (e) {
			console.log(e)
			return
		}
	}
	return tokens
}

function createTree(tokens) {

	const op = {
		'+': 1,
		'|': 1,
		'^': 2
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
				while (currentNode.type != 'OPEN_PARENTHESES' && currentNode.parent != null) {
					currentNode = currentNode.parent
				}
				if (currentNode.parent == null) throw 'Close_Parenthesis ErR0r'
				currentNode = currentNode.parent
				let parentheses = currentNode.children[currentNode.children.length - 1]
				currentNode.children.push(parentheses.children[0])
				parentheses.children[0].parent = currentNode
				currentNode.children.splice(currentNode.children.indexOf(parentheses), 1)
				if (currentNode.type == 'NOT' && currentNode.parent != null) {
					currentNode = currentNode.parent
				} else if (currentNode.type == 'NOT' && currentNode.parent == null) {
					throw 'Not has no parent'
				}
				break
			case 'OPERAND':
				if (i > 0 && (tokens[i - 1].value.match(/^[A-Z]+$/) || tokens[i - 1].value == '!')) {
					throw 'operand error'
				}
				if (currentNode.type == null || currentNode.type == 'OPERATOR') {
					let node = new Node(tokens[i])
					currentNode.children.push(node)
					node.parent = currentNode
				}
				break
			case 'OPERATOR':
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
							throw 'Operator Error'
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
							if (op[tokens[i].value] == op[currentNode.value] && tokens[i].value != currentNode.value) {
								throw 'Ambiguous Error'
							}
							currentNode = currentNode.parent
						}
						if (currentNode.value == null) {
							currentNode.type = tokens[i].type
							currentNode.value = tokens[i].value
							break
						}
						if (op[tokens[i].value] == op[currentNode.value] && tokens[i].value != currentNode.value) {
							throw 'Ambiguous Error'
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
				} else if (currentNode.type == 'NOT') {
					// TODO: PANHANDLE
					if (currentNode.left == null) {
						throw 'Not (!) Error currentNode.left == null'
					}
				}
				break;
			case 'NOT':
				if (i + 1 >= tokens.length) throw 'Not Error'
				if (tokens[i + 1].type == 'OPERAND') {
					if (currentNode.type == null || currentNode.type == 'OPERATOR') {
						let node = new Node(tokens[i + 1])
						node.value = '!' + node.value
						currentNode.children.push(node)
						node.parent = currentNode
					}
					i++
				}
				else if (tokens[i + 1].type == 'OPEN_PARENTHESES') {
					let node = new Node(tokens[i])
					currentNode.children.push(node)
					node.parent = currentNode
					currentNode = node
				} else {
					throw 'error 109'
				}
				break;
		}
	}

	while (root.value == null) {
		if (root.children.length > 1) {
			throw 'Removing empty nodes error'
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
		let tokens = tokenize(string)
		let tree = createTree(tokens)
		orderNode(tree)
		syntaxTree.displayTree(tree)
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

	negateNode
}

module.exports = syntaxTree
