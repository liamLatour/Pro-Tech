class AntColony {
    constructor(nb_ants = 10,
                pheromone_importance = 1,
                heuristic_importance = 2,
                pheromone_evaporation_rate = .2,
                added_pheromone = 1,
                pheromone_default = 1
        ) {
        this.nb_ants = nb_ants;
        
        this.graph = []; // graph
        this.population = [];
        this.pheromones = [];
        this.best_path = [];

        this.best_length = 10000;

        // pheromone parameters
        this.pheromone_importance = pheromone_importance; // >0
        this.heuristic_importance = heuristic_importance; // >0
        this.pheromone_evaporation_rate = pheromone_evaporation_rate; // 0< <=1
        this.pheromone_default = pheromone_default; // 0< <=1
        this.added_pheromone = added_pheromone; // >0
    }

    initialize(graph) {
        this.graph = graph;
        this.population = [];
        this.pheromones = [];
        this.best_path = null;
    
        for(let i = 0; i < this.nb_ants; i++) {
            this.population[i] = new Ant(
                this.pheromone_importance,
                this.heuristic_importance,
                this.added_pheromone
            );
        }
    
        for(let x = 0; x < this.graph.length; x++) {
            this.pheromones[x] = [];
            for(let y = 0; y < this.graph.length; y++) {
                if(x == y){
                    this.pheromones[x][y] = 0;
                }else{
                    this.pheromones[x][y] = this.pheromone_default;
                }
            }
        }
    }

    get_pheromone(source, target) {
        return this.pheromones[source][target];
    }

    get_normalized_pheromone(source, target) {
        return this.pheromones[source][target]/this.max_pheromone;
    }

    in_best_path(source, target){
        return this.best_path[source][target]>0;
    }

    get_max(a){
        return Math.max(...a.map(e => Array.isArray(e) ? this.get_max(e) : e));
    }

    get_min(a){
        return Math.min(...a.map(e => Array.isArray(e) ? this.get_min(e) : e));
    }

    run(){
        this.send_ants();
    }

    send_ants() {
        this.worst_length = 0;
        for(let i = 0; i < this.nb_ants; i++) {
            this.population[i].walk(this.graph, this.pheromones);
            if(this.population[i].walk_length < this.best_length){
                this.best_length = this.population[i].walk_length;
                this.best_path = [...this.population[i].seen];
            }
            if(this.population[i].walk_length > this.worst_length){
                this.worst_length = this.population[i].walk_length;
            }
        }
        this.update_pheromones()
        //console.log(this.best_length);
        //console.log(this.pheromones);
        //console.log(this.graph);
        //console.log(this.best_path);
    }

    update_pheromones() {
        //console.log(this.graph);
        this.evaporate_pheromones();
        for(let i = 0; i < this.nb_ants; i++) {
            this.population[i].lay_pheromones(this.pheromones, this.best_length, this.worst_length);
        }
        this.max_pheromone = Math.max(this.get_max(this.pheromones), 0.001);
        //console.log(this.pheromones.toString());
        this.normalize();
    }
    
    evaporate_pheromones() {
        for(let x = 0; x < this.graph.length; x++) {
            for(let y = 0; y < this.graph.length; y++) {
                if (x !== y) {
                    this.pheromones[x][y] = (1 - this.pheromone_evaporation_rate) * this.pheromones[x][y];
                } 
            }
        }
    }

    normalize(){
        for(let x = 0; x < this.graph.length; x++) {
            for(let y = 0; y < this.graph.length; y++) {
                if (x !== y) {
                    this.pheromones[x][y] /= this.max_pheromone;
                } 
            }
        }
    }
}