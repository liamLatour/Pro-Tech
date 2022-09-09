//FIXME: still undefined on graph

class Ant {
    constructor(graph, pheromone, nb_edges) {
        this.current = random.rand_in_array(Array.apply(null, Array(graph.length)).map(function (x, i) {
            return i;
        }));
        this.graph = graph;
        this.pheromone = pheromone;
        this.path = [this.current];
        this.seen_edges = [];
        this.nb_edges = nb_edges;
        this.dnf = false;
        this.max_iterations = 100;
    }

    get_neighbors(potential_neighbors, pheromones) {
        let neighbors = [];
        let neighbors_pheromones = [];

        for(let i=0; i<potential_neighbors.length; i++){
            if(potential_neighbors[i] > 0){
                neighbors.push(i);
                neighbors_pheromones.push(pheromones[i]);
            }
        }

        return [neighbors, neighbors_pheromones];
    }

    is_already_seen(x, y){
        return JSON.stringify(this.seen_edges).indexOf(JSON.stringify([x, y])) < 0;
    }

    choose_next() {
        let filtered = this.get_neighbors(this.graph[this.current], this.pheromone[this.current]);
        let neighbors = filtered[0];
        let neighbors_pheromones = filtered[1];

        let probability = neighbors_pheromones.map((x, i) => {
            if(this.is_already_seen(this.current, i)){
                return x/this.graph[this.current][i] * .2;
            }
            return x/this.graph[this.current][i];
        });

        let next = random.rand_in_array(neighbors, probability);
        if(this.is_already_seen(next, this.current)){
            this.seen_edges.push([next, this.current]);
            this.seen_edges.push([this.current, next]);
        }

        this.current = next;
        this.path.push(this.current);
    }

    run() {
        let i = 0;

        //TODO: it has to close too

        while (i < this.max_iterations && this.seen_edges.length < this.nb_edges) {
            this.choose_next();
            i++;
        }

        //console.log(this.seen_edges);

        // Check if it finished or not and punish it if not
        if(i == this.max_iterations){
            this.dnf = true;
        }
    }

    path_length() {
        if(this.dnf){
            //console.log("dnf");
            return Infinity;
        }
        let sum = 0;

        for (let i = 1; i < this.path.length; i++) {
            sum += this.graph[this.path[i - 1]][this.path[i]];
        }

        return sum;
    }
}

class AntColony {
    constructor(nb_ants = 400) {
        this.nb_ants = nb_ants;
        this._graph = [];
        this.pheromone = [];
        this.nb_edges = 0;

        this.pheromone_contributors = .1;
        this.pheromone_capacity = 2;
    }

    set graph(graph) {
        this._graph = graph;
        this.nb_edges = this.calculate_edges();
        
        for (let i = 0; i < graph.length; i++) {
            this.pheromone.push(Array.apply(null, Array(graph.length)).map(function (x, i) {
                return .2;
            }));
        }

        console.log(graph);
        console.log(this.pheromone);
    }

    calculate_edges() {
        let nb_edges = 0;

        for (let i = 0; i < this._graph.length; i++) {
            nb_edges += this._graph[i].reduce((partialSum, a) => {
                if(a > 0){
                    return partialSum + 1;
                }
                return partialSum;
            }, 0);
        }

        console.log(nb_edges);

        return nb_edges;
    }

    normalize_pheromones() {
        let max_pheromones_local = this.pheromone.map(function (row) {
            return Math.max.apply(Math, row);
        });
        let max_pheromones = Math.max.apply(null, max_pheromones_local);

        this.pheromone = this.pheromone.map(x => {
            return x.map(y => {
                return Math.max(y, 0.1) / max_pheromones;
            });
        });
    }

    next_iteration() {
        let paths = [];

        for (let i = 0; i < this.nb_ants; i++) {
            let ant = new Ant(this._graph, this.pheromone, this.nb_edges);
            ant.run();
            paths.push([ant.path, ant.path_length()]);
        }
        //console.log("next");

        paths.sort((a, b) => {
            if (a[1] < b[1]) {
                return -1;
            } else if (a[1] == b[1]) {
                return 0;
            } else {
                return 1;
            }
        });

        console.log(paths[0]);

        // update pheromones
        // evaporate
        this.pheromone = this.pheromone.map(x => {
            return x.map(y => {
                return y*0.8;
            });
        });

        for (let i = 0; i < this.nb_ants*this.pheromone_contributors; i++) {
            let pheromone_value = (2*this.pheromone_capacity)/this.nb_ants - (i*2*this.pheromone_capacity)/(this.nb_ants*this.nb_ants);

            for (let j = 1; j < paths[i].length; j++) {
                //console.log("###");
                //console.log(this.pheromone[paths[i][0][j - 1]][paths[i][0][j]]);
                this.pheromone[paths[i][0][j - 1]][paths[i][0][j]] += pheromone_value;
                //console.log(this.pheromone[paths[i][0][j - 1]][paths[i][0][j]]);
            }
        }

        this.normalize_pheromones();
    }
}

/**
 * a - x/b
 * 
 * nb_ants/b = a
 * 
 * nb_ants^2/2b + 1 = a*nb_ants
 * 
 * 
 * b = 1/2
 * 
 * s*n  = A*2
 * 
 */