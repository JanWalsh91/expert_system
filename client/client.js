document.addEventListener("DOMContentLoaded", function() {

	var esTextArea = document.getElementById('es_text');
	var logsDiv = document.getElementById('logs');
	var factsDiv = document.getElementById('facts');
	var queriesDiv = document.getElementById('queries');
	var fileNameInput = document.getElementById('file_name_input');
	var fakeFileNameInput = document.getElementById('file_name_input_fake');

	var factList = []

	document.getElementById('send').addEventListener("click", expertSystem);

	fakeFileNameInput.addEventListener('click', function(event) {
		fileNameInput.click();
	})
	fileNameInput.addEventListener('change', readFile);

	function expertSystem() {
		var esText = esTextArea.value;
		console.log('ExertSystem:')
		console.log(esText)
		logsDiv.innerHTML = "";
		factsDiv.innerHTML = ""
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
					factList = obj.facts;
					populateFacts()
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
		}
		reader.readAsText(file)
	}

	function writeInitialFacts() {
		console.log('writeInitialFacts')
		console.log(esTextArea.value)
		var lines = esTextArea.value.split('\n')
		var newTextArea = '';
		lines.forEach(function(line, idx) {
			var copy = line.replace(/[ \t\v]+/ig, '');
			if (copy.startsWith('=')) {
				newTextArea += '='
				factList.forEach(function(fact) {
					if (fact.state == true) {
						newTextArea += fact.key;
					} else if (fact.state == false) {
						newTextArea += '!' + fact.key;
					}
				});
			} else {
				newTextArea += line;
			}
			if (lines.length - 1 != idx) {
				newTextArea += '\n';
			}
		})
		esTextArea.value = newTextArea;
		console.log('writeInitialFacts === END')
		console.log(esTextArea.value)
	}

	function populateFacts() {
		console.log('populateFacts')
		console.log(esTextArea.value)
		var lines = esTextArea.value.split('\n');
		var initialFacts = lines.find(function(line, idx) {
			var copy = line.replace(/[ \t\v]+/ig, '');
			if (copy.startsWith('=')) {
				return copy;
			}
		});

		factList.forEach(function(fact, key) {
			var checkbox = document.createElement('input');
			checkbox.type = "checkbox";
			checkbox.name = "name";
			checkbox.value = "value";
			checkbox.id = "fact_checkbox_" + key;

			var index = initialFacts.indexOf(factList[key].key)
			if (index < 0) {
				checkbox.dataset.state = '0'
			} else if (index > 0 && initialFacts.charAt(index - 1) == '!') {
				checkbox.indeterminate = true;
				checkbox.checked = false;
				checkbox.dataset.state = '2'
			} else {
				checkbox.dataset.state = '1'
				checkbox.indeterminate = false;
				checkbox.checked = true;
			}

			// Add event listener
			checkbox.addEventListener('change', function(event) {
				// console.log('Checked: ' + this.checked);
				// console.log('Indeterminate: ' + this.indeterminate);
				if (this.dataset.state == 0) {
					this.indeterminate = false;
					this.checked = true;
					this.dataset.state = 1;
					factList[key].state = true;
				} else if (this.dataset.state == 1) {
					this.checked = false;
					this.indeterminate = true;
					this.dataset.state = 2;
					factList[key].state = false;
				} else {
					this.checked = false;
					this.indeterminate = false;
					this.dataset.state = 0;
					factList[key].state = undefined;
				}
				// console.log('Af Checked: ' + this.checked);
				// console.log('Af Indeterminate: ' + this.indeterminate + '\n');

				console.log(this)

				writeInitialFacts();
				expertSystem();
			})

			var span = document.createElement('span')
			span.htmlFor = "fact_checkbox_" + key;
			
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

		console.log('populateFacts ==== END')
		console.log(esTextArea.value)
	}
});
