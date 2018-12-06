const Logger = {
	logs: [],
	verbose: false,
	maxNumLine: 300,
	numLine: 0,

	log: (msg, indent, override) => {
		if (Logger.numLine >= Logger.maxNumLine) return
		if (Logger.verbose || override) {
			Logger.logs.push({msg, type: 'log', indent})
			Logger.numLine++
		}
		if (Logger.numLine == Logger.maxNumLine) {
			Logger.logs.push({msg: '...', type: 'log', indent: false})
		}
	},

	error: msg => {
		if (Logger.numLine >= Logger.maxNumLine) return
		Logger.logs.push({msg, type: 'error'})
		Logger.numLine++
		if (Logger.numLine == Logger.maxNumLine) {
			Logger.logs.push({msg: '...', type: 'log', indent: false})
		}
	},

	clear: () => {
		Logger.logs = []
		Logger.numLine = 0
	}

}

module.exports = Logger
