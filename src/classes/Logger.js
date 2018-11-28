const Logger = {
	logs: [],

	log: msg => {
		 Logger.logs.push({msg, type: 'log'})
	},

	error: msg => {
		 Logger.logs.push({msg, type: 'error'})
	},

	clear: () => {
		Logger.logs = []
	}

}

module.exports = Logger
