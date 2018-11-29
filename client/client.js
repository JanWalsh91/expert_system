document.addEventListener("DOMContentLoaded", function() {

	var esTextArea = document.getElementById('es_text');
	var logsDiv = document.getElementById('logs');
	var factsDiv = document.getElementById('facts');
	var queriesDiv = document.getElementById('queries');
	var fileNameInput = document.getElementById('file_name_input');
	var fakeFileNameInput = document.getElementById('file_name_input_fake');

	var factSet = new Set()

	document.getElementById('send').addEventListener("click", expertSystem);

	fakeFileNameInput.addEventListener('click', function(event) {
		fileNameInput.click();
	})
	fileNameInput.addEventListener('change', readFile);

	esTextArea.addEventListener('keyup', function(event) {
		console.log('tadaaa');
		updateCheckboxes();
	});

	function expertSystem() {
		var esText = esTextArea.value;
		console.log('ExertSystem:')
		console.log(esText)
		logsDiv.innerHTML = "";
		// factsDiv.innerHTML = ""
		queriesDiv.innerHTML = ""
		var xhr = new XMLHttpRequest();
		xhr.onload = function () {

			if (xhr.status >= 200 && xhr.status < 300) {
				var obj = JSON.parse(xhr.response);

				if (obj.error) {
					console.log('Ooooh')
				} else {
					obj.logs.forEach(function (line) {
						logsDiv.innerHTML += line.msg + '<br/>';
					})
					// factList = obj.facts;
					// updateCheckboxes()
					// return queries and
					// TODO updateQueries
				}
			} else {
				console.log('The request failed!');
			}
		};

		xhr.open('POST', 'http://localhost:8080/');
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.send(JSON.stringify({esText}));
	}

	function readFile (evt) {
		var files = evt.target.files;
		var file = files[0];           
		var reader = new FileReader();
		esTextArea.value = ""
		reader.onload = function(event) {
			esTextArea.value += event.target.result;
			updateCheckboxes();
		}
		reader.readAsText(file)
	}

	function updateTextArea() {
		console.log('updateTextArea')
		console.log(esTextArea.value)
		var lines = esTextArea.value.split('\n')
		var newTextArea = '';
		var foundInitialFactLine = false;
		lines.forEach(function(line, idx) {
			var copy = line.replace(/[ \t\v]+/ig, '');
			if (copy.startsWith('=')) {
				foundInitialFactLine = true
				writeInitialFacts()
			} else {
				newTextArea += line;
			}
			if (lines.length - 1 != idx) {
				newTextArea += '\n';
			}
		})
		if (foundInitialFactLine == false) {
			newTextArea += '\n\n';
			writeInitialFacts()
		}

		function writeInitialFacts() {
			newTextArea += '='
			factSet.forEach(function(fact) {
				if (fact.state == true) {
					newTextArea += fact.key;
				} else if (fact.state == false) {
					newTextArea += '!' + fact.key;
				}
			});
		}

		esTextArea.value = newTextArea;
		console.log('updateTextArea === END')
		console.log(esTextArea.value)
	}

	function updateCheckboxes() {
		console.log('updateCheckboxes')

		factsDiv.innerHTML = ""
		queriesDiv.innerHTML = ""

		console.log(esTextArea.value)
		factSet.clear()

		var lines = esTextArea.value.split('\n');
		var initialFacts = lines.find(function(line, idx) {
			var copy = line.replace(/[ \t\v]+/ig, '');
			if (copy.startsWith('=')) {
				return copy;
			}
		}) || '';

		// find all facts in text area
		var factList = esTextArea.value.match(/[A-Z]/g) || [];
		var basicSet = new Set()
		factList.forEach(letter => {
			basicSet.add(letter)
		})

		console.log('basic set: ')
		basicSet.forEach(a => console.log(a))

		// set Set with fact {key, state}
		basicSet.forEach(function(fact) {
			var index = initialFacts.indexOf(fact)
			var obj = {
				key: fact,
				state: undefined
			}
			if (index < 0) {
				obj.state = undefined
			} else if (index > 0 && initialFacts.charAt(index - 1) == '!') {
				obj.state = false
			} else {
				obj.state = true
			}
			factSet.add(obj)
		});

		console.log('fact set: ')
		factSet.forEach(a => console.log(a))


		// create checkboxes based on set

		factSet.forEach(function(fact) {
			var checkbox = document.createElement('input');
			checkbox.type = "checkbox";
			checkbox.name = "name";
			checkbox.value = "value";
			checkbox.id = "fact_checkbox_" + fact.key;

			if (fact.state == undefined) {
				checkbox.dataset.state = '0'
			} else if (fact.state == true) {
				checkbox.indeterminate = false;
				checkbox.checked = true;
				checkbox.dataset.state = '1'
			} else {
				checkbox.dataset.state = '2'
				checkbox.indeterminate = true;
				checkbox.checked = false;
			}

			// Add event listener
			checkbox.addEventListener('click', function(event) {
				// console.log('Checked: ' + this.checked);
				// console.log('Indeterminate: ' + this.indeterminate);
				if (this.dataset.state == 0) {
					this.indeterminate = false;
					this.checked = true;
					this.dataset.state = 1;
					fact.state = true;
				} else if (this.dataset.state == 1) {
					this.checked = false;
					this.indeterminate = true;
					this.dataset.state = 2;
					fact.state = false;
				} else {
					this.checked = false;
					this.indeterminate = false;
					this.dataset.state = 0;
					fact.state = undefined;
				}
				// console.log('Af Checked: ' + this.checked);
				// console.log('Af Indeterminate: ' + this.indeterminate + '\n');

				console.log(this)

				updateTextArea();
				expertSystem();
			})

			var span = document.createElement('span')
			span.htmlFor = "fact_checkbox_" + fact.key;
			
			var label = document.createElement('label');
			label.className = 'checkbox-wrapper';
			// label.htmlFor = checkbox.id;
			label.appendChild(document.createTextNode(fact.key));

			label.appendChild(checkbox)
			label.appendChild(span)

			factsDiv.appendChild(label)

			if (fact.query == true) {
				var span = document.createElement('span');
				span.innerHTML = fact.key + ' is ' + fact.state 
				queriesDiv.appendChild(span)
			}
		})

		console.log('updateCheckboxes ==== END')
		console.log(esTextArea.value)
	}
});
