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

        this.pheromone_default = 1;
    }

    set _graph(_graph) {
        this.graph = _graph;
        
        for (let _ of _graph) {
            this.pheromone.push(Array.apply(null, Array(_graph.length)).map(function (x, i) {
                return this.pheromone_default;
            }));
        }
    }

    nex_iteration(){
        // define iteration here
    }

    get_pheromone(source, target){
        return this.pheromone[source][target];
    }
}