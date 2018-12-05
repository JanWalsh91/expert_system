document.addEventListener("DOMContentLoaded", function() {

	var esTextArea = document.getElementById('es_text');
	var logsDiv = document.getElementById('logs');
	var factsDiv = document.getElementById('facts');
	var queriesDiv = document.getElementById('queries');
	var fileNameInput = document.getElementById('file_name_input');
	var fakeFileNameInput = document.getElementById('file_name_input_fake');
	var spanFileName = document.getElementById('file_name');
	var verboseInput = document.getElementById('verbose');
	var tooltip = document.getElementById('tooltip');
	var tooltip0 = document.getElementById('tooltip0');
	var tooltip1 = document.getElementById('tooltip1');
	var tooltip2 = document.getElementById('tooltip2');

	tooltip0.indeterminate = false;
	tooltip0.checked = false;
	tooltip1.indeterminate = true;
	tooltip1.checked = false;
	tooltip2.indeterminate = false;
	tooltip2.checked = true;

	document.addEventListener('keydown', function (e) {
		var key = e.keyCode ? e.keyCode : e.which;
		if (key == 13 && e.shiftKey) {
  		expertSystem();
			e.preventDefault();
   	}
	});

	var factSet = new Set();

	updateCheckboxes();

	document.getElementById('send').addEventListener("click", expertSystem);

	fakeFileNameInput.addEventListener('click', function(event) {
		fileNameInput.click();
	})
	fileNameInput.addEventListener('change', readFile);

	esTextArea.addEventListener('keyup', function(event) {
		updateCheckboxes();
	});

	function expertSystem() {
		var esText = esTextArea.value;
		logsDiv.innerHTML = "";
		queriesDiv.innerHTML = ""
		var xhr = new XMLHttpRequest();
		xhr.onload = function () {

			if (xhr.status >= 200 && xhr.status < 300) {
				var obj = JSON.parse(xhr.response);

				if (obj.error) {
					obj.logs.forEach(function (line) {
						if (line.type == 'error') {
							logsDiv.classList.add('error')
							logsDiv.innerHTML += '<p>' + line.msg + '</p>';
						}
					})
				} else if (obj.srvError) {
					logsDiv.classList.add('error')
					logsDiv.innerHTML += '<p>Internal server error: ' + obj.srvError + '</p>';
				}	else {
					logsDiv.classList.remove('error')
					obj.logs.forEach(function (line) {
						var classes = ''
						if (line.indent) classes += 'indent'
						if (line.msg.startsWith('===')) classes += ' bold'
						logsDiv.innerHTML += '<p class="' + classes + '">' + line.msg + '</p>';
					})
					updateQueries(obj.facts);
				}
			} else {
				console.error('The request failed!');
			}
		};

		xhr.open('POST', 'http://localhost:8080/');
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.send(JSON.stringify({esText, verbose: verbose.checked}));
	}

	function readFile (evt) {
		var files = evt.target.files;
		var file = files[0];
		if (file === undefined) return;
		var reader = new FileReader();
		esTextArea.value = ""
		reader.onload = function(event) {
			if (event.target.result.length > 1000000) {
				console.error('file too big');
				return ;
			}
			esTextArea.value += event.target.result;
			updateCheckboxes();
			expertSystem();
		}
		reader.readAsText(file)
		spanFileName.innerHTML = file.name
	}

	function updateTextArea() {
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
	}

	function updateCheckboxes() {
		factsDiv.innerHTML = ""
		queriesDiv.innerHTML = ""
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
				updateTextArea();
				expertSystem();
			})

			var span = document.createElement('span')
			span.htmlFor = "fact_checkbox_" + fact.key;

			var label = document.createElement('label');
			label.className = 'checkbox-wrapper';
			label.addEventListener('mouseover', showTooltip);
			label.addEventListener('mouseleave', hideTooltip);
			// label.htmlFor = checkbox.id;
			label.appendChild(document.createTextNode(fact.key));

			label.appendChild(checkbox);
			label.appendChild(span);

			factsDiv.appendChild(label);

			var interval = null;

			function showTooltip (e) {
				if (interval === null) {
					interval = setInterval(function () {
						tooltip.classList.remove('hide');
						var left = e.target.getBoundingClientRect().left + e.target.offsetWidth;
						var top = e.target.getBoundingClientRect().top + e.target.offsetHeight/2;
						tooltip.style.left = (left + 10) + 'px';
						tooltip.style.top = (top - tooltip.offsetHeight/2 - 5) + 'px';
						clearInterval(interval);
						interval = null;
					}, 500);
				}

			}
			function hideTooltip() {
				clearInterval(interval);
				interval = null;
				tooltip.classList.add('hide');
			}
		})
	}

	function updateQueries(facts) {
		facts.forEach(function(fact) {
			if (fact.query == true) {
				var span = document.createElement('span');
				span.innerHTML = fact.key + ' is ' + fact.state;
				if (!!fact.error) {
					span.innerHTML += ' (' + fact.error + ')';
					span.classList = 'error'
				}
				queriesDiv.appendChild(span);
			}
		})
	}
});
