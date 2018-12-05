const Logger = {
	logs: [],
	verbose: false,

	log: (msg, indent, override) => {
		if (Logger.verbose || override) {
			Logger.logs.push({msg, type: 'log', indent})
		}
	},

	error: msg => {
		 Logger.logs.push({msg, type: 'error'})
	},

	clear: () => {
		Logger.logs = []
	}

}

module.exports = Logger
