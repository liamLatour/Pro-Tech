const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Convention is:
//   array 1 contains neighbours of node 1
//   negative weight is not a connection
class Graph {
    constructor(nb_points = 5, connectivity = 1) {
        this.nb_points = nb_points;
        this.connectivity = connectivity;
        this.graph = [];
        this.ant_colony = new AntColony();

        this.generate();
    }

    //TODO: place the nodes in logical order rather than random at start https://crinkles.io/writing/auto-graph-layout-algorithm
    //TODO: avoid radix (no loops in things)
    generate() {
        for (let i = 0; i < this.nb_points; i++) {
            let arr = [];

            for (let j = 0; j < this.nb_points; j++) {
                arr.push(-1);
            }

            this.graph.push(arr);
        }

        for (let i = 0; i < this.nb_points; i++) {
            for (let j = i; j < this.nb_points; j++) {
                if (j == i) {
                    this.graph[i][j] = 0;
                } else {
                    let rand_weight = random.rand_weight(this.connectivity, false);
                    this.graph[i][j] = rand_weight[0];
                    this.graph[j][i] = rand_weight[1];
                }
            }
        }

        // check for connectivity
        let connected = this.check_connected(0);

        for (let i = 0; i < this.nb_points; i++) {
            if (!connected.includes(i)) {
                let other = random.rand_in_array(connected);
                let rand_weight = random.rand_weight(this.connectivity, true);
                this.graph[i][other] = rand_weight[0];
                this.graph[other][i] = rand_weight[1];
            }
        }

        this.ant_colony.graph = this.graph;
    }

    check_connected(current, marked = []) {
        marked.push(current)

        for (let i = 0; i < this.nb_points; i++) {
            if (this.graph[current][i] > 0 && !marked.includes(i)) {
                this.check_connected(i, marked);
            }
        }

        return marked;
    }

    update() {
        this.ant_colony.next_iteration();
    }

    update_color(edge) {
        let source = edge.source.id;
        let target = edge.target.id; 
        
        let value = Math.floor(this.ant_colony.pheromone[source][target] * 255).toString(16);

        return "#"+value+"0000";
    }

    draw() {
        var graphJSON = {
            "nodes": [],
            "edges": []
        };

        for (let i = 0; i < this.nb_points; i++) {
            graphJSON["nodes"].push(i.toString());

            for (let j = 0; j < this.nb_points; j++) {
                if (this.graph[i][j] > 0) {
                    graphJSON["edges"].push([
                        i.toString(),
                        j.toString(),
                        {
                            label: this.graph[i][j].toString(),
                            font: "20px Arial"
                        }
                    ]);
                }
            }
        }
        var graph = new Springy.Graph(()=>{this.update();});
        graph.loadJSON(graphJSON);

        //TODO: try to know when it's done
        var springy = jQuery('#canvas').springy({
            graph: graph,
            'update': (edge)=>{return this.update_color(edge);},
        });
    }
}

graph = new Graph();
graph.draw();

$('#form').submit(function () {
    let nb = $('#nb_node').val();
    let conn = $('#connectivity').val();

    graph = new Graph(nb, conn);
    graph.draw();

    return false;
});