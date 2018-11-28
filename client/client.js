document.addEventListener("DOMContentLoaded", function(){
  console.log("A: true");

	document.getElementById('send').addEventListener("click", function () {
		console.log("LCiiiiiquek");

		var es_text = document.getElementById('es_text').value;
		document.getElementById('response').innerHTML = "";
		var xhr = new XMLHttpRequest();
		// Setup our listener to process completed requests
		xhr.onload = function () {

			// Process our return data
			if (xhr.status >= 200 && xhr.status < 300) {
				// What do when the request is successful
				console.log('success!', xhr.response);

				var lines = JSON.parse(xhr.response);
				lines.forEach(function (line) {
					document.getElementById('response').innerHTML += line.msg;
				})
			} else {
				// What do when the request fails
				console.log('The request failed!');
			}

			// Code that should run regardless of the request status
			console.log('This always runs...');
		};

		// Create and send a GET request
		// The first argument is the post type (GET, POST, PUT, DELETE, etc.)
		// The second argument is the endpoint URL
		xhr.open('POST', 'http://localhost:8080/');
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.send(JSON.stringify({es_text}));
	})
});
