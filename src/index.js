const fs = require('fs')
const Rule = require('./classes/Rule')
const Fact = require('./classes/Fact')
const Node = require('./classes/Node')

// data
const rules = require('./rules')
const facts = require('./facts')

// services
const syntaxTree = require('./services/syntaxTree')

const fileName = process.argv[2]
if (fileName) {
	let contents;
	try {
		contents = fs.readFileSync(fileName, 'utf8');
	} catch(e) {
		console.error("Error: " + e.message)
		return
	}

	contents = contents.replace(/[ \t\v]+/ig, '');

	let lines = contents.split(/\r?\n/)

	let factSymbols = []
	let conclusionFactSymbols = []
	let trueFactSymbols = []
	let queryFactSymbols = []

	let hasRules, hasInitialFacts, hasQueries = false

	try {
		lines.forEach(line => {
			line = line.split('#')[0]
			if (line.length == 0) return

			if (line[0] == '=') {
				for (let i = 1; i < line.length; i++) {
					let key = line.charAt(i)
					if (!key.match(/^[A-Z]+$/)) {
						throw 'Invalid initial fact'
					}
					trueFactSymbols.push(key)
					if (facts[key] == undefined) {
						facts[key] = new Fact({key: key, state: true})
					}
				}
				if (hasInitialFacts) {
					throw 'Can only have one set of initial facts'
				}
				if (line[1] != undefined)
					hasInitialFacts = true
			} else if (line[0] == '?') {
				for (let i = 1; i < line.length; i++) {
					let key = line.charAt(i)
					if (!key.match(/^[A-Z]+$/)) {
						throw 'Invalid query'
					}
					queryFactSymbols.push(key)
					if (facts[key] == undefined) {
						facts[key] = new Fact({key: key, query: true})
					} else {
						facts[key].query = true
					}
				}
				if (hasQueries) {
					throw 'Can only have one set of queries'
				}
				if (line[1] != undefined)
					hasQueries = true
			} else if (line.includes('=>')) {
				let isConclusion = false
				if (line.includes('<=>')) {
					isConclusion = true
				}
				for (let i = 0; i < line.length; i++) {
					let key = line.charAt(i)
					if (key.match(/^[A-Z]+$/)) {
						factSymbols.push(key)
						if (isConclusion) {
							conclusionFactSymbols.push(key)
						}
					}
					if (key == '=') isConclusion = true
				}
				let ret
				try {
					ret = Rule.createFromString(line)
				} catch (e) {
					throw 'Rule creation failed: ' + e + ' "' + line + '"'
				}
				if (ret instanceof Array) {
					rules.push(...ret)
				} else {
					rules.push(ret)
				}
				hasRules = true
			}
		})
	} catch(e) {
		console.error('Error: ' + e);
		// console.log(e);
		return
	}

	if (!hasRules) {
		console.error('Error: Needs at least one rule')
		return
	} else if (!hasInitialFacts) {
		console.error('Error: Needs at least one initial fact')
		return
	} else	if (!hasQueries) {
		console.error('Error: Needs at least one query')
		return
	}

	// create subrules
	rules.forEach(rule => createSubrules(rule.conditionsTree, rule.conclusionTree))

	// assign keys and create facts from rules' conclusions
	rules.forEach(rule => createFactFromRule(rule))

	// create keys
	rules.forEach(rule => {
		syntaxTree.assignKeysToNodes(rule.conditionsTree)
		syntaxTree.assignKeysToNodes(rule.conclusionTree)
	})

	createFalseFacts(factSymbols, conclusionFactSymbols, trueFactSymbols, queryFactSymbols)

	// displayFacts()
	displayRules()
	console.log('  ');

	evaluate()

	for (let fact in facts) {
		if (facts[fact].state == undefined) {
			facts[fact].state = false
		}
	}

	displayFacts()

}

function createFalseFacts(factSymbols, conclusionFactSymbols, trueFactSymbols, queryFactSymbols) {
	let falseFactSymbols = factSymbols.filter(el => {
		return !conclusionFactSymbols.includes(el) && !trueFactSymbols.includes(el) && !queryFactSymbols.includes(el)
	})

	console.log(falseFactSymbols);

	falseFactSymbols.forEach(key => {
		facts[key] = (new Fact({key, state: false}))
	})
}

/*
 * Create rules based on nodes in conditionsTree and conclusionTree
 * == expanding conclusionTree ==
 * A => B + C + D
 * 		A => B
 * 		A => C
 * 		A => D
 * A => B | C \ D
 * 		A + !C + !D => B
 * 		A + !B + !D => C
 * 		A + !B + !C => D
 * A => B ^ C								#more than 2 ^s in conclusionTree is ERROR
 *		A + !C => B
 *		A + C => !B
 *		A + !B => C
 *		A + B => !C
 * A => !(B + C + D)
 * 		A + C + D => !B
 * 		A + B + D => !C
 * 		A + B + D => !D
 * A => !(B | C | D)
 * 		A => !B
 * 		A => !C
 * 		A => !D
 * A => !(B ^ C)					#more than 2 ^s in conclusionTree is ERROR
 * 		A + C => B
 * 		A + !C => !B
 * 		A + B => C
 * 		A + !B => !C
 * == expanding conditionsTree ==
 * A + B + C => D					#no expansion
 * A | B | C => D
 * 		A => D
 * 		B => D
 * 		C => D
 * 		A | B => D
 * 		A | C => D
 * 		B | C => D
 * A ^ B => C							#no expansion
 * !(A + B + C) => D			#similar to A | B | C => D
 * 		!A => D
 * 		!B => D
 * 		!C => D
 * 		!(A | B) => D
 * 		!(A | C) => D
 * 		!(B | C) => D
 * !(A | B | C) => D			#no expansion
 * !(A ^ B) => C					#no expansion
 */
function createSubrules(conditionsTree, conclusionTree) {

	function simplifyTrees(rule) {
		syntaxTree.simplifyOperators(rule.conditionsTree)
		syntaxTree.simplifyOperators(rule.conclusionTree)
	}
	createSubrulesFromConclusionTree()
	createSubrulesFromConditionsTree()



	function createSubrulesFromConclusionTree() {
		if (conclusionTree.type == 'OPERATOR')
			handleOperators()
		else if (conclusionTree.type == 'NOT')
			handleNot()

		function handleOperators() {
			if (conclusionTree.value == '+')
				handleAnd()
			else if (conclusionTree.value == '|')
				handleOr()
			else if (conclusionTree.value == '^')
				handleXor()

			function handleAnd() {
				conclusionTree.children.forEach(child => {
					let rule = new Rule({
						conditionsTree: syntaxTree.duplicateNode(conditionsTree),
						conclusionTree: syntaxTree.duplicateNode(child)
					})
					simplifyTrees(rule)
					rules.push(rule)
					createSubrules(rule.conditionsTree, rule.conclusionTree)
				})
			}
			function handleOr() {
				conclusionTree.children.forEach(child => {
					let rule = new Rule({
						conditionsTree: syntaxTree.duplicateNode(conditionsTree),
						conclusionTree: syntaxTree.duplicateNode(child)
					})

					let node = new Node({value: '+', type: 'OPERATOR'})
					node.children = [syntaxTree.duplicateNode(conditionsTree)]
					conclusionTree.children.forEach(subchild => {
						if (subchild != child) {
							subchild.parent = node
							node.children.push(syntaxTree.negateNode(subchild))
						}
					})
					rule.conditionsTree = node
					simplifyTrees(rule)
					rules.push(rule)
					createSubrules(rule.conditionsTree, rule.conclusionTree)
				})
			}
			function handleXor() {
				conclusionTree.children.forEach(child => {
					let rule1 = new Rule({
						conditionsTree: syntaxTree.duplicateNode(conditionsTree),
						conclusionTree: syntaxTree.negateNode(child)
					})
					let node1 = new Node({value: '+', type: 'OPERATOR'})
					node1.children = [rule1.conditionsTree, conclusionTree.children.find(el => el != child)]
					node1.children.forEach(el => el.parent = node1)
					rule1.conditionsTree = node1

					let rule2 = new Rule({
						conditionsTree: syntaxTree.duplicateNode(conditionsTree),
						conclusionTree: syntaxTree.duplicateNode(child)
					})
					let node2 = new Node({value: '+', type: 'OPERATOR'})
					node2.children = [rule2.conditionsTree, syntaxTree.negateNode(conclusionTree.children.find(el => el != child))]
					node2.children.forEach(el => el.parent = node2)
					rule2.conditionsTree = node2

					simplifyTrees(rule1)
					simplifyTrees(rule2)
					rules.push(rule1)
					rules.push(rule2)
					createSubrules(rule1.conditionsTree, rule1.conclusionTree)
					createSubrules(rule2.conditionsTree, rule2.conclusionTree)
				})
			}
		}

		function handleNot() {
			let node = syntaxTree.duplicateNode(conclusionTree.children[0])

			if (node.value == '+')
				handleAnd()
			else if (node.value == '|')
				handleOr()
			else if (node.value == '^')
				handleXor()

			function handleAnd() {
				node.children.forEach(child => {
					let rule = new Rule({
						conditionsTree: syntaxTree.duplicateNode(conditionsTree),
						conclusionTree: syntaxTree.negateNode(child)
					})
					let node1 = new Node({value: '+', type: 'OPERATOR'})
					node1.children = [rule.conditionsTree, ...node.children.filter(el => el != child)]
					node1.children.forEach(el => el.parent = node1)
					rule.conditionsTree = node1
					simplifyTrees(rule)
					rules.push(rule)
					createSubrules(rule.conditionsTree, rule.conclusionTree)
				})
			}
			function handleOr() {
				node.children.forEach(child => {
					let rule = new Rule({
						conditionsTree: syntaxTree.duplicateNode(conditionsTree),
						conclusionTree: syntaxTree.duplicateNode(child)
					})
					rule.conclusionTree = syntaxTree.negateNode(rule.conclusionTree)
					rules.push(rule)
					createSubrules(rule.conditionsTree, rule.conclusionTree)
				})
			}
			function handleXor() {
				node.children.forEach(child => {
					let rule1 = new Rule({
						conditionsTree: syntaxTree.duplicateNode(conditionsTree),
						conclusionTree: syntaxTree.duplicateNode(child)
					})
					let node1 = new Node({value: '+', type: 'OPERATOR'})
					node1.children = [rule1.conditionsTree, node.children.find(el => el != child)]
					node1.children.forEach(el => el.parent = node1)
					rule1.conditionsTree = node1

					let rule2 = new Rule({
						conditionsTree: syntaxTree.duplicateNode(conditionsTree),
						conclusionTree: syntaxTree.negateNode(child)
					})
					let node2 = new Node({value: '+', type: 'OPERATOR'})
					node2.children = [rule2.conditionsTree, syntaxTree.negateNode(node.children.find(el => el != child))]
					node2.children.forEach(el => el.parent = node2)
					rule2.conditionsTree = node2

					simplifyTrees(rule1)
					simplifyTrees(rule2)
					rules.push(rule1)
					rules.push(rule2)
					createSubrules(rule1.conditionsTree, rule1.conclusionTree)
					createSubrules(rule2.conditionsTree, rule2.conclusionTree)
				})
			}
		}
	}

	function createSubrulesFromConditionsTree() {
		if (conditionsTree.type == 'OPERATOR')
			handleOperators()
		else if (conditionsTree.type == 'NOT')
			handleNot()

		function handleOperators() {
			if (conditionsTree.value == '+')
				handleAnd()
			else if (conditionsTree.value == '|')
				handleOr()
			else if (conditionsTree.value == '^')
				handleXor()

			function handleAnd() {
				// console.log('dont expand');
			}
			function handleOr() {
				let nodes = createNodeTreeCombinations(conditionsTree, 1)

				nodes.forEach(node => {
					let rule = new Rule({
						conditionsTree: node,
						conclusionTree: syntaxTree.duplicateNode(conclusionTree)
					})
					simplifyTrees(rule)
					rules.push(rule)
					createSubrules(rule.conditionsTree, rule.conclusionTree)
				})
			}
			function handleXor() {
				// console.log('dont expand');
			}

		}

		function handleNot() {
			let node = syntaxTree.duplicateNode(conditionsTree.children[0])

			if (node.value == '+')
				handleAnd()
			else if (node.value == '|')
				handleOr()
			else if (node.value == '^')
				handleXor()

			function handleAnd() {
				let nodes = createNodeTreeCombinations(node, 1)
				nodes.forEach(node => {
					let rule = new Rule({
						conditionsTree: syntaxTree.negateNode(node),
						conclusionTree: syntaxTree.duplicateNode(conclusionTree)
					})
					simplifyTrees(rule)
					rules.push(rule)
					createSubrules(rule.conditionsTree, rule.conclusionTree)
				})
			}
			function handleOr() {
				// console.log('dont expand');
			}
			function handleXor() {
				// console.log('dont expand');
			}

		}

		function createNodeTreeCombinations(tree, min) {
			let indexLists = createIndexCombinations(tree.children.length, min)
			return indexLists.map(indexList => {
				if (indexList.length == 1) return tree.children[indexList[0]]
				let node = new Node({type: 'OPERATOR', value: '|'})
				let children = indexList.map(i => {
					let child = syntaxTree.duplicateNode(tree.children[i])
					child.parent = node
					return child
				})
				node.children = children
				return node
			})
		}

		/*
		 * return a table of tables of indices to find all combinations for case A | B | C => D
		 */
		function createIndexCombinations(total, min) {
			min = min || 2
			let combinations = []
			for (let size = min; size < total; size++) {
				let list = []
				for (let i = 0; i < size; i++) {
					list.push(i)
				}
				combinations.push(list.slice())
				while (increment(list, list.length - 1)) {
					combinations.push(list.slice())
				}
			}
			return combinations

			function increment(list, index) {
				let updated = false
				if (list[index] < total - 1) {
					list[index]++
					for (let i = 1; index + i < list.length; i++) {
						list[index + i] = list[index] + i
						if (list[index + i] >= total) {
							if (index > 0) {
								return increment(list, index - 1)
							} else {
								return false
							}
						}
					}
					return true
				} else if (index - 1 >= 0) {
					return increment(list, index - 1)
				}
			}

		}
	}

}

function createFactFromRule(rule) {
	// console.log('== RULE ==');
	// console.log('\t condition:');
	// syntaxTree.displayTree(rule.conditionsTree)
	// console.log('\t conclusion:');
	// syntaxTree.displayTree(rule.conclusionTree)

	let key = syntaxTree.createKeyFromNode(rule.conclusionTree)

	if (facts[key] == undefined) {
		facts[key] = new Fact({key: key, rules: [rule]})
	} else {
		facts[key].rules.push(rule)
	}
}

function evaluate() {
	console.log('=== EVALUATE ===');
	for (let fact in facts) {
		console.log('OUTER LOOP: evaluating fact ' + fact);
		facts[fact].evaluate()
		console.log('OUTER LOOP: evaluating fact ' + fact + '  END');
	}
}

function displayFacts() {
	console.log('=== FACTS ===');
	// console.log(facts);
	for (let fact in facts) {
		console.log(fact + ': ' + facts[fact].state)
		// console.log(facts[fact].rules)
	}
}

function displayRules() {
	console.log('=== RULES ===');
	rules.forEach(rule => rule.display())
}
