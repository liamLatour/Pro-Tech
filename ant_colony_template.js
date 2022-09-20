/**
 * Graph is given with the adjency representation, for node 2 graph[2] is an array
 * of the arcs from node 2, if value is -1 it's not a connection if it's 0 it is to himself
 * 
 * the pheromones are linked to the arcs and are used to show which arcs are good
 * (they can also be used internally for the ant simulation)
 */

class AntColony {
    constructor(nb_ants = 40) {
        this.nb_ants = nb_ants;
        this.graph = [];
        this.pheromone = [];
    }

    set _graph(_graph) {
        this.graph = _graph;
        this.nb_edges = this.calculate_edges();
        
        for (let _ of _graph) {
            this.pheromone.push(Array.apply(null, Array(_graph.length)).map(function (x, i) {
                return .2;
            }));
        }
    }

    nex_iteration(){
        // define iteration here
    }

    get_pheromone(source, target){
        return 1; // return pheromone of arc from source to target
    }
}