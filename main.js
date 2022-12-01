const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let graph = new Graph();
graph.generate();
graph.run();

$('#form').submit(function () {
    let nb = $('#nb_node').val();
    let conn = $('#connectivity').val();

    graph.stop = true;
    graph = new Graph(nb, conn);
    graph.generate();
    graph.stop = false;
    graph.run();

    return false;
});