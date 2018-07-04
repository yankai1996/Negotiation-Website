
$("#description").load("/html/description.html");

const id = $(".title h1").text().slice(-4);

// default address: 'http://localhost'
var socket = io.connect();

socket.emit("login", {
	id: id
});

$("#warm-up").click(() => {
	socket.emit("warm up", {
		msg: "I am ready!"
	});
});