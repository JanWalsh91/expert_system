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
		console.log(e)
		return
	}

	contents = contents.replace(/[ \t\v]+/ig, '');

	let lines = contents.split(/\r?\n/)

	let factSymbols = []
	let conclusionFactSymbols = []
	let trueFactSymbols = []
	let queryFactSymbols = []

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
				let ret = Rule.createFromString(line)
				if (ret instanceof Array) {
					rules.push(...ret)
				} else {
					rules.push(ret)
				}
			}
		})
	} catch(e) {
		console.log('AAAAAAAAAA' + e);
		console.log(e);
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

	displayFacts()
	displayRules()
	console.log('  ');

	// evaluate()
	//
	// displayFacts()

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

function createSubrules(conditionsTree, conclusionTree) {

	function simplifyTrees(rule) {
		syntaxTree.simplifyOperators(rule.conditionsTree)
		syntaxTree.simplifyOperators(rule.conclusionTree)
	}



// truc de jan
	// function buildIndexTables(total, min = 2) {
	// 	let combinations = []
	// 	for (let size = 0; size < total - 1; size++) {
	// 		let list = []
	// 		for (let i = 0; i < size; i++) {
	//
	// 		}
	// 	}
	// }

	function faitDesTrucs (conditionsTree, conclusionTree) {
		if (conditionsTree.type == 'OPERATOR') {
			if (conditionsTree.value == '|' && conditionsTree.children.length > 2) {
				let truc = []
				for (let y = 2; y < conditionsTree.children.length; y++) {
					console.log('Building length: ' + y);
					console.log('White ' + (conditionsTree.children.length - y + 1));
					for (let z = 0; z < conditionsTree.children.length - y + 1; z++) {
						console.log('==> z: ' + z);
						// for (let o = conditionsTree.children.length - y + 1; o > 0; o--) {
						// 	for (let w = 0; w < y; w++) {
						// 		process.stdout.write(conditionsTree.children[].value + ' ')
						// 	}
						// }
						console.log(" ");
					}
				}
			}
		}
	}


	faitDesTrucs(conditionsTree, conclusionTree)
	throw 'Done'

	if (conclusionTree.type == 'OPERATOR') {
		if (conclusionTree.value == '+') {
			conclusionTree.children.forEach(child => {
				let rule = new Rule({
					conditionsTree: syntaxTree.duplicateNode(conditionsTree),
					conclusionTree: syntaxTree.duplicateNode(child)
				})
				simplifyTrees(rule)
				rules.push(rule)
				createSubrules(rule.conditionsTree, rule.conclusionTree)
			})
		} else if (conclusionTree.value == '|') {
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
		} else if (conclusionTree.value == '^') {
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
	}	else if (conclusionTree.type == 'NOT') {
		let node = syntaxTree.duplicateNode(conclusionTree.children[0])
		if (node.value == '+') {
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
		} else if (node.value == '|') {
			node.children.forEach(child => {
				let rule = new Rule({
					conditionsTree: syntaxTree.duplicateNode(conditionsTree),
					conclusionTree: syntaxTree.duplicateNode(child)
				})
				rule.conclusionTree = syntaxTree.negateNode(rule.conclusionTree)
				rules.push(rule)
				createSubrules(rule.conditionsTree, rule.conclusionTree)
			})
		}	else if (node.value == '^') {
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
	// else if (conclusionTree.type == 'OPERAND') {
		// if (conclusionTree.value.charAt(0) == '!') {
			// let rule = new Rule({
			// 	conditionsTree: syntaxTree.duplicateNode(conclusionTree),
			// 	conclusionTree: syntaxTree.negateNode(conclusionTree)
			// })
			// simplifyTrees(rule)
			// rules.push(rule)
		// } else {
		// 	let rule = new Rule({
		// 		conditionsTree: syntaxTree.negateNode(conclusionTree),
		// 		conclusionTree: syntaxTree.duplicateNode(conclusionTree)
		// 	})
		// 	simplifyTrees(rule)
		// 	rules.push(rule)
		// }
	// }
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
