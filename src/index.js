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
		this.left = null
		this.right = null
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
let exp = '() +  =>   A'

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
console.log('parts: ' + parts)
console.log('ifAndOnlyIf: ' + ifAndOnlyIf)

let leftTokens = tokenize(parts[0])
let rightTokens = tokenize(parts[1])

console.log( 'leftTokens: ')
console.log(leftTokens)
console.log( 'rightTokens: ' )
console.log(rightTokens)

let leftTree = createTree(leftTokens)

console.log('leftTree: ')
console.log(leftTree)

function tokenize(exp) {

	// check parentheses
	if (!checkParentheses(exp)) {
		console.log('parenthese error')
		return
	}
	console.log('parentheses OK')
	
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


function createTree(tokens) {

	const op = ['+', '|', '^']

	// on start, new node
	let root = new Node()
	let currentNode = root

	for (let i = 0; i < tokens.length; i++) {
		switch (tokens.type) {
			case 'OPEN_PARENTHESES':
				// TODO: try to place left, then right
				currentNode.left = new Node()
				currentNode.left.parent = currentNode
				currentNode = currentNode.left
				break;
			case 'CLOSE_PARENTHESES':
				if (currentNode.parent == null) throw 'Close_Parenthesis ErROr'
				currentNode = currentNode.parent
				break;
			case 'OPERAND':
				if (currentNode.type == null || currentNode.type == 'OPERATOR') {
					if (currentNode.left == null) {
						currentNode.left = new Node(tokens[i])
						currentNode.left.parent = currentNode
					} else if (token[i].type != 'NOT') {
						currentNode.right = new Node(tokens[i])
						currentNode.right.parent = currentNode
					} else {
						throw "Operand Error"
					}
				}
				break;
			case 'OPERATOR':
				if (currentNode.type == null) {
					currentNode.type = tokens[i].type
					currentNode.value = tokens[i].value
				}
				if (currentNode.type == 'OPERATOR') {
					if (op.indexOf(tokens[i].value) >= op.indexOf(currentNode.value)) {
						if (currentNode.right == null) {
							throw 'Operator Error'
						}
						let a = currentNode.right
						currentNode.right = new Node(tokens[i])
						currentNode.right.parent = currentNode
						currentNode.right.left = a
						currentNode = currentNode.right
					} else {
						while (op.indexOf(tokens[i].value) < op.indexOf(currentNode.value)) {
							currentNode = currentNode.parent
						}
						let a = currentNode.right
						let b = new Node(tokens[i])
						currentNode.right = b
						b.parent = currentNode
						b.left = a
						a.parent = b
						currentNode = b
						// currentNode.right.left = currentNode
					}
				}
				break;
			case 'NOT':
				if (i + 1 >= tokens.length) throw 'Not Error'
				if (tokens[i + 1].type == 'OPERAND') {
					if (currentNode.type == null || currentNode.type == 'OPERATOR') {
						if (currentNode.left == null) {
							currentNode.left = new Node(tokens[i + 1])
							currentNode.left.parent = currentNode
						} else if (token[i].type != 'NOT') {
							currentNode.right = new Node(tokens[i + 1])
							currentNode.right.parent = currentNode
						} else {
							throw "Operand Error"
						}
					}
				}
				else if (tokens[i + 1].type == 'OPEN_PARENTHESES') {
					// TODO: try to place left, then right

					currentNode.left = new Node()
					currentNode.left.parent = currentNode
					currentNode = currentNode.left

					
				}
				break;
		}
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

	// after all tokens added, check order of operands and operators for each node and switch




	return root
}