console.log(process.argv);
const fs = require('fs')

const fileName = process.argv[2]

if (fileName) {
	let contents = fs.readFileSync(fileName, 'utf8');
	console.log(contents);
}
