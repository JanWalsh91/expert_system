document.addEventListener("DOMContentLoaded", function() {

	var esTextArea = document.getElementById('es_text');
	var responseField = document.getElementById('response');
	var factsDiv = document.getElementById('facts');
	var fileNameInput = document.getElementById('file_name_input');

	var factList = []

	document.getElementById('send').addEventListener("click", function () {
		var esText = esTextArea.value;
		responseField.innerHTML = "";
		factsDiv.innerHTML = ""
		var xhr = new XMLHttpRequest();
		xhr.onload = function () {

			if (xhr.status >= 200 && xhr.status < 300) {
				var obj = JSON.parse(xhr.response);

				if (obj.error) {
					console.log('Ooooh')
				} else {
					obj.logs.forEach(function (line) {
						responseField.innerHTML += line.msg + '<br/>';
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
	})

	fileNameInput.addEventListener('change', readFile);

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
			newTextArea += '\n';
		})
		esTextArea.value = newTextArea;
	}

	function populateFacts() {
		factList.forEach(function(fact, key) {
			var checkbox = document.createElement('input');
			checkbox.type = "checkbox";
			checkbox.name = "name";
			checkbox.value = "value";
			checkbox.id = "fact_checkbox_" + key;
			if (fact.state == true) {
				checkbox.dataset.state = '1'
				checkbox.checked = true
			} else if (fact.state == false) {
				checkbox.indeterminate = true;
				checkbox.dataset.state = '2'
			} else if (fact.state == undefined) {
				checkbox.dataset.state = '0'
			}

			// Add event listener
			checkbox.addEventListener('change', function(event) {
				event.stopImmediatePropagation()
				event.stopPropagation()
				console.log('Checked: ' + this.checked);
				console.log('Indeterminate: ' + this.indeterminate);
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
				console.log('Af Checked: ' + this.checked);
				console.log('Af Indeterminate: ' + this.indeterminate + '\n');


				// TODO: indeterminate
				writeInitialFacts()
			})

			var label = document.createElement('label')
			label.htmlFor = "fact_checkbox_" + key;
			label.appendChild(document.createTextNode(fact.key));

			factsDiv.appendChild(label)
			factsDiv.appendChild(checkbox)
		})
	}
});
