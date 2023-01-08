const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let graph = null;

function generate_graph(){
    let nb = $('#nb_node').val();
    let nb_ants = $('#nb_ants').val();
    let importance = $('#importance').val();
    let evaporation = $('#evaporation').val();
    let added_pheromone = $('#adding').val();

    if(graph!=null){
        graph.stop = true;
    }

    graph = new Graph(nb, nb_ants, importance, evaporation, added_pheromone);
    graph.generate();
    graph.run();
}

generate_graph();

$('#form').submit(function () {
    generate_graph();
    return false;
});