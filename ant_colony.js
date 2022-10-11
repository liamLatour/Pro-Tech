//FIXME: still undefined on graph

class Ant {
    constructor(g, pheromone, pheromone_importance, heuristic_importance) {
        this.current = random.rand_in_array(Array.apply(null, Array(g.graph.length)).map(function (x, i) {
            return i;
        })); // random nb between 0 and graph length
        this.g = g;
        this.pheromone = pheromone;

        this.pheromone_importance = pheromone_importance;
        this.heuristic_importance = heuristic_importance;

        this.path = [this.current];
        this.seen_edges = [];
        this.dnf = false;
        this.max_iterations = 100;
    }

    get_heuristic(start, end) {
        if (this.seen_edges.includes(start + "/" + end)) {
            return 0.1;
        }

        return Math.max(1 - this.g.graph[start][end] / this.g.longest_edge, 0.1);
    }

    get_neighbors() {
        let neighbors = [];
        let neighbors_attractiveness = [];

        for (let i = 0; i < this.g.nb_edges; i++) {
            if (this.g.graph[this.current][i] > 0) {
                neighbors.push(i);
                let attractiveness = Math.pow(this.pheromone[this.current][i], this.pheromone_importance) *
                    Math.pow(this.get_heuristic(this.current, i), this.heuristic_importance);
                neighbors_attractiveness.push(attractiveness);
            }
        }

        return [neighbors, neighbors_attractiveness];
    }

    choose_next() {
        let filtered = this.get_neighbors();
        let neighbors = filtered[0];
        let neighbors_attractiveness = filtered[1];

        let next = random.rand_in_array(neighbors, neighbors_attractiveness);
        if (!this.seen_edges.includes(next + "/" + this.current)) { // there is always both so no need to check for the other one
            this.seen_edges.push(next + "/" + this.current);
            this.seen_edges.push(this.current + "/" + next);
        }

        this.current = next;
        this.path.push(this.current);
    }

    run() {
        let i = 0;

        //TODO: it has to close too

        while (i < this.max_iterations && this.seen_edges.length < this.g.nb_edges) {
            this.choose_next();
            i++;
        }

        // Check if it finished or not and punish it if not
        if (i == this.max_iterations) {
            console.log(this.seen_edges.length);
            this.dnf = true;
        }
    }

    path_length() {
        if (this.dnf) {
            return Infinity;
        }
        let sum = 0;

        for (let i = 1; i < this.path.length; i++) {
            sum += this.g.graph[this.path[i - 1]][this.path[i]];
        }

        return sum;
    }
}

class AntColony {
    constructor(nb_ants = 40) {
        this.nb_ants = nb_ants;
        this.graph = []; // graph
        this.pheromone = [];

        // pheromone parameters
        this.pheromone_importance = 1; // >0
        this.heuristic_importance = 1; // >0
        this.pheromone_evaporation_rate = .2; // 0< <=1
        this.pheromone_default = 1; // 0< <=1
        this.elitism = 1; // odd, min is 1
    }

    set _graph(_graph) {
        this.graph = _graph;
        
        for (let _ of _graph) {
            this.pheromone.push(Array.apply(null, Array(_graph.length)).map(function (x, i) {
                return this.pheromone_default;
            }));
        }
    }

    get_pheromone(source, target) {
        return this.pheromone[source][target];
    }

    fitness(n) {
        let elite = Math.pow(n - this.nb_ants, this.elitism) / Math.pow(this.nb_ants, this.elitism);
        return -elite;
    }

    next_iteration() {
        let paths = [];

        for (let i = 0; i < this.nb_ants; i++) {
            let ant = new Ant(this.g, this.pheromone, this.pheromone_importance, this.heuristic_importance);
            ant.run();
            paths.push([ant.path, ant.path_length()]);
        }

        //console.log(paths[0]);

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
        this.pheromone = this.pheromone.map(x => {
            return x.map(y => {
                return y * (1 - this.pheromone_evaporation_rate);
            });
        });

        for (let i = 0; i < this.nb_ants; i++) {
            let pheromone_value = this.fitness(i);

            for (let j = 1; j < paths[i].length; j++) {
                this.pheromone[paths[i][0][j - 1]][paths[i][0][j]] += this.pheromone_evaporation_rate * pheromone_value;
            }
        }
    }
}