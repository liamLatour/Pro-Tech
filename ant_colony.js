class AntColony {
    constructor(nb_ants = 20,
                pheromone_importance = 1,
                heuristic_importance = 2,
                pheromone_evaporation_rate = .2,
                pheromone_default = 1,
                added_pheromone = 1
        ) {
        this.nb_ants = nb_ants;
        
        this.graph = []; // graph
        this.population = [];
        this.pheromones = [];
        this.best_path = [];

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
                if (x !== y) {
                    this.pheromones[x][y] = this.pheromone_default;
                }
            }
        }
    }

    get_pheromone(source, target) {
        return this.pheromones[source][target];
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

    send_ants() {
        this.best_length = 10000;
        this.worst_length = 0;
        for(let i = 0; i < this.nb_ants; i++) {
            this.population[i].walk(this.graph, this.pheromones);
            if(this.population[i].walk_length < this.best_length){
                this.best_length = this.population[i].walk_length;
                this.best_path = this.population[i].seen;
            }
            if(this.population[i].walk_length > this.worst_length){
                this.worst_length = this.population[i].walk_length;
            }
        }
        //console.log(this.best_length);
        //console.log(this.worst_length);
        //console.log(this.graph);
        //console.log(this.best_path);
    }

    update_pheromones() {
        //console.log(this.graph);
        //console.log(this.pheromones);
        this.evaporate_pheromones();
        for(let i = 0; i < this.nb_ants; i++) {
            this.population[i].lay_pheromones(this.pheromones, this.best_length, this.worst_length);
        }
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


    next_iteration() {
        let paths = [];

        for (let i = 0; i < this.nb_ants; i++) {
            let ant = new Ant(this.graph, this.pheromones, this.pheromone_importance, this.heuristic_importance, this.longest_edge);
            ant.run();
            paths.push([ant.seen, ant.path_length()]);
        }

        // sort for shortest path
        paths.sort((a, b) => {
            if (a[1] < b[1]) {
                return -1;
            } else if (a[1] == b[1]) {
                return 0;
            } else {
                return 1;
            }
        });

        // update pheromones
        // evaporate
        this.pheromones = this.pheromones.map(x => {
            return x.map(y => {
                return y * (1 - this.pheromone_evaporation_rate);
            });
        });

        // add pheromones
        for (let i = 0; i < this.nb_ants; i++) {
            let pheromone_value = this.added_pheromone/paths[i][1];
            let seen = paths[i][0];

            for (let i = 0; i < seen.length; i++) {
                for (let j = 0; j < seen.length; j++) {
                    if(seen[i][j]>0){
                        this.pheromones[i][j] += pheromone_value;
                    }
                }
            }
        }

        //this.best_path = Math.min(...paths.map(o => o[1]));
        this.best_path = paths[0][0];
        console.log(paths[0]);
        this.normalize();
    }
}