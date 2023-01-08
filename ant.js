class Ant {
    constructor(pheromone_importance, heuristic_importance, added_pheromone) {
        this.pheromone_importance = pheromone_importance;
        this.heuristic_importance = heuristic_importance;
        this.added_pheromone = added_pheromone;
        this.start = 0;
        this.walk_length = 0;
        this.path = [];
        this.seen = [];
        this.max_iterations = 100;
    }

    visited_everything(graph) {
        for (let i = 0; i < graph.length; i++) {
            for (let j = 0; j < graph.length; j++) {
                if (graph[i][j] > 0 && this.seen[i][j] + this.seen[j][i] == 0) {
                    return false;
                }
            }
        }

        return true;
    }

    walk(graph, pheromones) {
        for (let x = 0; x < graph.length; x++) {
            this.seen[x] = [];
            for (let y = 0; y < graph.length; y++) {
                this.seen[x][y] = 0;
            }
        }

        this.start = random.rand_in_array(Array.apply(null, Array(graph.length)).map(function (x, i) {
            return i;
        }));
        this.path = [this.start];

        let i = 1;

        while (!(i > this.max_iterations || (this.visited_everything(graph) && this.path[i-1] == this.start))) {
            this.path.push(this.choose_next(this.path[i - 1], graph, pheromones));
            this.seen[this.path[i - 1]][this.path[i]]++;
            i++;
        }

        if(i == this.max_iterations){
            console.log("dnf");
        }

        //console.log(this.path.length);
        this.walk_length = this.calculate_walk_length(graph);
    }

    list_neighbourgs(graph, current) {
        let neighbourgs = [];

        for (let i = 0; i < graph.length; i++) {
            if (graph[current][i] > 0) {
                neighbourgs.push(i);
            }
        }
        return neighbourgs;
    }

    calculate_probability(graph, pheromones, start, end) {
        let new_bonus = 1;
        if (this.seen[start][end] + this.seen[end][start] == 1) {
            new_bonus = .4;
        } else if (this.seen[start][end] + this.seen[end][start] > 1) {
            new_bonus = 0.1;
        }

        let heuristic = 60 - graph[start][end] + new_bonus;
        
        let ph = pheromones[start][end] * this.pheromone_importance;
        let he = heuristic * this.heuristic_importance;

        return ph + he;
    }

    choose_next(current, graph, pheromones) {
        let neighbourgs = this.list_neighbourgs(graph, current);

        let probabilities = [];
        for (const neighbourg of neighbourgs) {
            probabilities.push(this.calculate_probability(graph, pheromones, current, neighbourg));
        }

        console.log(probabilities);
        return random.rand_in_array(neighbourgs, probabilities);;
    }

    lay_pheromones(pheromones, best_length, worst_length) {
        if(this.walk_length > (best_length+worst_length)/3){
            return;
        }

        let a = .1/(best_length-worst_length);
        let b = .1*worst_length/(worst_length-best_length);
        let value = (a*this.walk_length+b) * this.added_pheromone;

        for(let i=0; i<this.seen.length; i++){
            for(let j=0; j<this.seen.length; j++){
                if(this.seen[i][j] != 0){
                    pheromones[i][j] += value;
                }
            }
        }
    }

    calculate_walk_length(graph) {
        let len = 0;
        for (let i = 1; i < this.path.length; i++) {
            len += graph[this.path[i - 1]][this.path[i]];
        }

        return len;
    }
}