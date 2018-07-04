
$("#description").load("/html/description.html");

const ID = $(".title h1").text().slice(-4);

// default address: 'http://localhost'
var socket = io.connect();

socket.emit("login", {
	id: ID
});

socket.on("test", (data) => {
	console.log(data);
});

$("#warm-up").click(() => {
	socket.emit("warm up", {
		msg: "I am ready!"
	});
});