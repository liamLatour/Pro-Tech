const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

ctx.beginPath();
//ctx.arc(200, 200, 10, 0, 2 * Math.PI, false);
ctx.fillStyle = "black";
ctx.fill();

let graph = new Graph();
graph.draw();

$('#form').submit(function () {
    let nb = $('#nb_node').val();
    let conn = $('#connectivity').val();

    graph = new Graph(nb, conn);
    graph.draw();

    return false;
});