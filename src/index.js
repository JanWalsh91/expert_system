const fs = require('fs')
const Rule = require('./class/Rule')

// const fileName = process.argv[2]

// if (fileName) {
// 	let contents = fs.readFileSync(fileName, 'utf8');

// 	// parsing

// 	// trim
// 	// console.log(contents)
// 	contents = contents.replace(/[ \t\v]+/ig, '');
// 	// console.log('===========================')
// 	// console.log(contents)

// 	let lines = contents.split(/\r?\n/)
// 	// console.log(lines)

// 	// console.log('===========================')

// 	lines.forEach(line => {
// 		// console.log(line)
// 		line = line.split('#')[0]
// 		if (line.length == 0) return
// 		// console.log(line)

// 		if (line[0] == '=') {
// 			// create fact
// 		} else if (line[0] == '?') {
// 			// set queries
// 		} else {
// 			// create rule
// 			Rule.createFromString(line)
// 		}
// 	})
// }

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

class Node {
	constructor(token) {
		this.children = []
		this.value = null
		this.type = null
		this.parent = null
		if (token) {
			this.value = token.value
			this.type = token.type
		}
	}
}


/////////// START ////////////


// recieve RULE in string form

let exp = 'A => B'
// let exp = 'A + E | G => Z'

// remove whitespaces
exp = exp.replace(/[ \t\v]+/ig, '')

let ifAndOnlyIf = false;
// split expression
let parts = []
if (!( ((parts = exp.split('<=>')).length == 2 && (ifAndOnlyIf = true)) || (parts = exp.split('=>')).length == 2) ) {
	console.log('Error: ' + parts)
	console.log(parts.length)
	return
}
// console.log('parts: ' + parts)
// console.log('ifAndOnlyIf: ' + ifAndOnlyIf)

let leftTokens = tokenize(parts[0])
let rightTokens = tokenize(parts[1])

// console.log( 'leftTokens: ')
// console.log(leftTokens)
// console.log( 'rightTokens: ' )
// console.log(rightTokens)

console.log('=== create tree ===');
let leftTree

try {
	leftTree = createTree(leftTokens)
} catch (e) {
	console.log(e)
	return
}

console.log('=== Fuck Tree, the ===');

displayTree(leftTree)

function tokenize(exp) {

	// check parentheses
	if (!checkParentheses(exp)) {
		console.log('parenthese error')
		return
	}
	// console.log('parentheses OK')

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
	//
}

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
	console.log(node.value);
	node.children.forEach(child => {
		displayTree(child, depth + 1)
	})
}

function isTreeValid(node) {
	if (node.type == 'OPERATOR') {
		if (node.children.length != 2) {
			return false
		}
	} else if (node.type == 'NOT') {
		if (node.children.length != 1) {
			return false
		}
	} else if (node.type == 'OPERAND') {
		if (node.children.length > 0) {
			return false
		}
	}

	node.children.forEach(child => {
		if (!isTreeValid(child)) {
			return false
		}
	})

	return true
}

function removeEmptyNodes(node) {
	if (node.value == null) {
		console.log('remove node ' + node.value);
		if (node.children.length > 0) {
			node.children.forEach(child => {
				node.parent.children.push(child)
				child.parent = node.parent
			})
		}
		node.parent.children = node.parent.children.splice(node.parent.children.indexOf(node), 1)
	}

	node.children.forEach(child => {
		if (!removeEmptyNodes(child)) {
			return false
		}
	})

	return true
}


/*
 * Returns true if a <= b, if a and b is the right order
 * Order: [A-Z][!A-!Z]+|^!
 */
function compareNodes(a, b) {
		if (a == null || b == null) throw 'need two nodes to compare'

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
				return 'A'.charCodeAt(0) + op.indexOf(node.value) + 26 * 2
			}
		}

		console.log(`a: ${getNodeValue(a)}, b: ${getNodeValue(b)}`);

		return getNodeValue(a) <= getNodeValue(b)
}

function orderNodes(node) {
	if (node.right == null && node.left == null) {
		return
	}
	if (node.right != null && node.left == null) {
		node.left = node.right
		node.right = null
		orderNodes(node.left)
		return
	}
	if (node.right != null && node.left != null) {
		if (!compareNodes(node.left, node.right)) {
			node.left = node.right
			node.right = tmp
		} else {

		}
	}

}

// let a = compareNodes({type: 'OPERAND', value: 'A'}, {type: 'OPERAND', value: 'A'})
// console.log(a);
// let b = compareNodes({type: 'OPERAND', value: 'D'}, {type: 'OPERAND', value: '!D'})
// console.log(b);

function createTree(tokens) {

	const op = {
		'+': 1,
		'|': 1,
		'^': 2
	}

	// on start, new node
	let root = new Node()
	let currentNode = root

	for (let i = 0; i < tokens.length; i++) {
		console.log('parsing: ' + tokens[i].value + '  currentNode.value: ' + currentNode.value);
		switch (tokens[i].type) {
			case 'OPEN_PARENTHESES':
				let node = new Node()
				currentNode.children.push(node)
				node.parent = currentNode
				currentNode = node
				break
			case 'CLOSE_PARENTHESES':
				if (currentNode.parent == null) throw 'Close_Parenthesis ErR0r'
				currentNode = currentNode.parent
				break
			case 'OPERAND':
				console.log('found operand');
				if (i > 0 && !(tokens[i - 1].value.match(/^[A-Z]+$/) || tokens[i - 1].value == '!')) {
					throw 'operand error'
				}
				if (currentNode.type == null || currentNode.type == 'OPERATOR') {
					let node = new Node(tokens[i])
					currentNode.children.push(node)
					node.parent = currentNode
				}
				break
			case 'OPERATOR':
				console.log('found operator');
				if (currentNode.type == null) {
					currentNode.type = tokens[i].type
					currentNode.value = tokens[i].value
					break
				}
				if (currentNode.type == 'OPERATOR') {
					// if (op[tokens[i].value] == op[currentNode.value] && tokens[i].value != currentNode.value) {
					// 	throw 'Ambiguous Error'
					// }

					if (tokens[i].value == currentNode.value) {
						break
					}

					if (op[tokens[i].value] > op[currentNode.value]) {
						console.log(tokens[i].value + " > " + currentNode.value);
						if (currentNode.children.length < 2) {
							throw 'Operator Error'
						}
						let a = currentNode.children[currentNode.length - 1]
						let node = new Node(tokens[i])
						currentNode.childen.push(node)
						node.parent = currentNode
						node.children.push(a)
						currentNode.children.splice(currentNode.children.indexOf(a), 1)
						currentNode = node
					} else {
						console.log(tokens[i].value + " <= " + currentNode.value)
						// if (currentNode.)
						while (op[tokens[i].value] <= op[currentNode.value] && currentNode.parent != null) {
							// console.log('going up. currentNode.value: ' + currentNode.value);
							currentNode = currentNode.parent
							// console.log('going up. currentNode.value: ' + currentNode.value);
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
							// console.log('------ 1 ------');
							// console.log(currentNode);
							let node = new Node(tokens[i])
							node.children.push(currentNode)
							currentNode.parent = node
							root = node
							currentNode = node
							break
						}
						// console.log('------ 2 ------');

						let a = currentNode.children[currentNode.length - 1]
						let node = new Node(tokens[i])
						currentNode.childen.push(node)
						node.parent = currentNode
						node.children.push(a)
						currentNode.children.splice(currentNode.children.indexOf(a), 1)
						currentNode = node
						// currentNode.right.left = currentNode
					}
				} else if (currentNode.type == 'NOT') {
					if (currentNode.left == null) {
						throw 'Not (!) Error currentNode.left == null'
					}
					// currentNode.
				}
				break;
			case 'NOT':
				if (i + 1 >= tokens.length) throw 'Not Error'
				if (tokens[i + 1].type == 'OPERAND') {
					if (currentNode.type == null || currentNode.type == 'OPERATOR') {
						let node = new Node(tokens[i + 1])
						currentNode.children.push(node)
						node.parent = currentNode
					}
				}
				else if (tokens[i + 1].type == 'OPEN_PARENTHESES') {
					if (currentNode.children.length == 0) {
						let node = new Node(tokens[i + 1])
						currentNode.children.push(node)
						node.parent = currentNode
						currentNode = node
					}
				} else {
					throw 'error 109'
				}
				i++
				break;
		}
		displayTree(root)
	}

	{

		// LOOP OVER TOKENS
		// if OPEN P
		// create node left, move left
		// if CLOSE P
		// move to parent
		// if OPERAND
		// if node.type == null or node is OPERTAOR
		// if node.left null
		// node.left = new node(OPERAND)
		// else if operator is !NOT
		// node.right = new node(OPERAND)
		// else
		// error
		// else
		// error
		// if OPERATOR
		// if node.type == null
		// node.type == OPERATOR ...
		// if node.type == OPERATOR
		// if new token.priority >= currentnode.priority
		// if no node.right == null
		// error
		// save A = right node
		// set node.right to new node(operator)
		// set node.right.left to A
		// set current node to new node
		// if new token.priority < currentnode.priority
		// while token.priority > currentnode.priority // handle error
		// currentNode = currentNode.parent
		// A = currentNode
		// B = new node(OPERAND)
		// currentnode.right = B
		// B.parne...
		// currentnode.right.left = A
		// currentnode = currentNode.right
	}
		// if NOT
			// if next token.type == OPERAND
				// treat as operand, but add ! to operand
			// if next token.type == OPEN_PARENTHESES
				// treat as operator with right always null]
			// else
				// error

	// if currentNode.right == null
		// error


	// while root is empty, root = root.left
	while (root.value == null) {
		console.log('removing empty node')
		if (root.left == null || root.right != null) {
			throw 'Removing empty nodes error'
		}
		root = root.left
		root.parent = null
	}

	removeEmptyNodes(root)

	if (!isTreeValid(root)) {
		throw 'Invalid Tree'
	}

	// TODO: after all tokens added, check order of operands and operators for each node and series of nodes of same operator and switch

	// orderNodes(root)

	return root
}
