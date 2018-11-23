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
	let contents = fs.readFileSync(fileName, 'utf8');

	contents = contents.replace(/[ \t\v]+/ig, '');

	let lines = contents.split(/\r?\n/)

	lines.forEach(line => {
		line = line.split('#')[0]
		if (line.length == 0) return

		if (line[0] == '=') {
			for (let i = 1; i < line.length; i++) {
				let key = line.charAt(i)
				if (!key.match(/^[A-Z]+$/)) {
					throw 'Invalid initial fact'
				}
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
				if (facts[key] == undefined) {
					facts[key] = new Fact({key: key, query: true})
				} else {
					facts[key].query = true
				}
			}
		} else if (line.includes('=>')){

			let ret = Rule.createFromString(line)
			if (ret instanceof Array) {
				rules.push(...ret)
			} else {
				rules.push(ret)
			}
		}
	})

	// create subrules
	rules.forEach(rule => createSubrules(rule.conditionsTree, rule.conclusionTree))

	// assign keys and create facts from rules' conclusions
	rules.forEach(rule => createFactFromRule(rule))

	// create keys
	rules.forEach(rule => {
		syntaxTree.assignKeysToNodes(rule.conditionsTree)
		syntaxTree.assignKeysToNodes(rule.conclusionTree)
	})

	// TODO: add false facts to facts
	// facts which are not in the dictionary

	console.log('=== FACTS ===');
	console.log(facts);
	// console.log(rules);

}

function createSubrules(conditionsTree, conclusionTree) {
	if (conclusionTree.type == 'OPERATOR') {
		if (conclusionTree.value == '+') {
			conclusionTree.children.forEach(child => {
				let rule = new Rule({
					conditionsTree: syntaxTree.duplicateNode(conditionsTree),
					conclusionTree: syntaxTree.duplicateNode(child)
				})
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
				syntaxTree.displayTree(node)
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

				rules.push(rule1)
				rules.push(rule2)
				createSubrules(rule1.conditionsTree, rule1.conclusionTree)
				createSubrules(rule2.conditionsTree, rule2.conclusionTree)
			})
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
