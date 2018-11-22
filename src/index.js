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

let exp = '!A | !(!(B ^ B + !C + F + !(D | E | (H ^ L| X ^ Y)))) | !A | !(!(B ^ B + !C + F + !(D | E | (H ^ L| X ^ Y)))) => Z'
// let exp = '!(A + B) ^ C => Z'
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
		if (node.children.length < 2) {
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
	// console.log('removeEmptyNodes: ' + node.value);
	if (node.value == null) {
		// console.log('remove node ' + node.value);
		if (node.children.length > 0) {
			node.children.forEach(child => {
				node.parent.children.unshift(child)
				child.parent = node.parent
			})
		}
		node.parent.children.splice(node.parent.children.indexOf(node), 1)
	}
	// console.log(node.children);
	for (let i = 0; i < node.children.length; i++) {
		// console.log('removeEmptyNodes node.value: ' + node.value + ' child: ' + i + ' of value ' + node.children[i].value);
		// displayTree(node)
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

		console.log(`childrenToRemove:`);
		console.log(childrenToRemove);

		childrenToRemove.forEach(child => {
			displayTree(node)

			node.children.splice(node.children.indexOf(child), 1)

			displayTree(node)
		})

		// console.log('1111');
 		// displayTree(node)
		// console.log('2222');
		node.children.push(...childrenToMove)

		if (childrenToMove.length > 0) {
			simplifyOperators(node)
		}
	}

	// console.log("===========");
	// displayTree(node)

	node.children.forEach(child => {
		simplifyOperators(child)
	})

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
		console.log('\x1b[31m%s\x1b[0m', 'parsing: ' + tokens[i].value);
		console.log('currentNode.value: ' + currentNode.value);
		switch (tokens[i].type) {
			case 'OPEN_PARENTHESES':
				console.log('found open parentheses');
				let node = new Node(tokens[i])
				currentNode.children.push(node)
				node.parent = currentNode
				let emptyNode = new Node()
				node.children.push(emptyNode)
				emptyNode.parent = node
				currentNode = emptyNode
				break
			case 'CLOSE_PARENTHESES':
				console.log('found close parentheses');
				// console.log(currentNode);
				while (currentNode.type != 'OPEN_PARENTHESES' && currentNode.parent != null) {
					currentNode = currentNode.parent
				}

				if (currentNode.parent == null) throw 'Close_Parenthesis ErR0r'
				currentNode = currentNode.parent


				let parentheses = currentNode.children[currentNode.children.length - 1]
				currentNode.children.push(parentheses.children[0])
				parentheses.children[0].parent = currentNode
				currentNode.children.splice(currentNode.children.indexOf(parentheses), 1)
				// console.log('currentNode: ');
				// console.log(currentNode);

				if (currentNode.type == 'NOT' && currentNode.parent != null) {
					currentNode = currentNode.parent
				} else if (currentNode.type == 'NOT' && currentNode.parent == null) {
					throw 'Not has no parent'
				}

				break
			case 'OPERAND':
				console.log('found operand');
				// console.log('found operand: ' + tokens[i].value + '   tokens[i - 1].value: ' + (i > 0 ? tokens[i - 1].value : 0));
				// if (i > 0) {
				// 	console.log(!tokens[i - 1].value.match(/^[A-Z]+$/));
				// }

				// TODO: Attirer la colère de Zeus
				if (i > 0 && (tokens[i - 1].value.match(/^[A-Z]+$/) || tokens[i - 1].value == '!')) {
					throw 'operand error'
				}
				if (currentNode.type == null || currentNode.type == 'OPERATOR') {
					// console.log('test, currentnode: ');
					// console.log(currentNode);
					let node = new Node(tokens[i])
					// console.log('new node: ' + node.value);
					// console.log(currentNode.children);

					currentNode.children.push(node)
					// console.log(currentNode.children);
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
						let a = currentNode.children[currentNode.children.length - 1]
						let node = new Node(tokens[i])
						currentNode.children.push(node)
						node.parent = currentNode
						node.children.push(a)
						currentNode.children.splice(currentNode.children.indexOf(a), 1)
						currentNode = node
					} else {
						console.log(tokens[i].value + " <= " + currentNode.value)

						while (op[tokens[i].value] <= op[currentNode.value] && currentNode.parent != null && currentNode.type != 'OPEN_PARENTHESES') {

							if (op[tokens[i].value] == op[currentNode.value] && tokens[i].value != currentNode.value) {
								throw 'Ambiguous Error'
							}

							console.log('going up. currentNode.value: ' + currentNode.value);
							currentNode = currentNode.parent
							console.log('went up. currentNode.value: ' + currentNode.value);
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

						// console.log(currentNode);

						let a = currentNode.children[currentNode.children.length - 1]
						// console.log('a: ' + a.value);
						let node = new Node(tokens[i])
						currentNode.children.push(node)
						// console.log('currentNode.children: ' + currentNode.children);
						node.parent = currentNode
						node.children.push(a)
						currentNode.children.splice(currentNode.children.indexOf(a), 1)
						currentNode = node
						// currentNode.right.left = currentNode
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
					// if (currentNode.children.length == 0) {
						let node = new Node(tokens[i])
						currentNode.children.push(node)
						node.parent = currentNode
						currentNode = node
					// }
				} else {
					throw 'error 109'
				}
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
		if (root.children.length > 1) {
			throw 'Removing empty nodes error'
		}
		root = root.children[0]
		root.parent = null
	}

	removeEmptyNodes(root)

	simplifyOperators(root)

	if (!isTreeValid(root)) {
		throw 'Invalid Tree'
	}

	// TODO: after all tokens added, check order of operands and operators for each node and series of nodes of same operator and switch

	// orderNodes(root)

	return root
}
