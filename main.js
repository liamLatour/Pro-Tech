const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Convention is:
//   array 1 contains neighbours of node 1
//   negative weight is not a connection
class Graph {
    constructor(nbPoints = 10, connectivity = .2) {
        this.nbPoints = nbPoints;
        this.connectivity = connectivity;
        this.graph = [];

        this.generate();
    }

    generate() {
        for (let i = 0; i < this.nbPoints; i++) {
            let arr = [];

            for (let j = 0; j < this.nbPoints; j++) {
                arr.push(-1);
            }

            this.graph.push(arr);
        }


        for (let i = 0; i < this.nbPoints; i++) {
            for (let j = i; j < this.nbPoints; j++) {
                if (j == i) {
                    this.graph[i][j] = 0;
                } else {
                    let rand_weight = random.rand_weight(this.connectivity);
                    this.graph[i][j] = rand_weight[0];
                    this.graph[j][i] = rand_weight[1];
                }
            }
        }

        // check for connectivity
        let connected = this.check_connected(0);

        for (let i = 0; i < this.nbPoints; i++) {
            if (!connected.includes(i)) {
                let other = random.rand_in_array(connected);
                let rand_weight = random.rand_weight(this.connectivity, true);
                this.graph[i][other] = rand_weight[0];
                this.graph[other][i] = rand_weight[1];
            }
        }
    }

    check_connected(current, marked = []) {
        marked.push(current)

        for (let i = 0; i < this.nbPoints; i++) {
            if (this.graph[current][i] > 0 && !marked.includes(i)) {
                this.check_connected(i, marked);
            }
        }

        return marked;
    }

    draw() {
        var graphJSON = {
            "nodes": [],
            "edges": []
        };

        for (let i = 0; i < this.nbPoints; i++) {
            graphJSON["nodes"].push(i.toString());

            for (let j = 0; j < this.nbPoints; j++) {
                if (this.graph[i][j] > 0) {
                    graphJSON["edges"].push([
                        i.toString(),
                        j.toString(),
                        {
                            label: this.graph[i][j].toString(),
                            font: "20px Arial",
                        }
                    ]);
                }
            }
        }

        jQuery(function () {
            var graph = new Springy.Graph();
            graph.loadJSON(graphJSON);

            //TODO: try to know when it's done
            var springy = jQuery('#canvas').springy({
                graph: graph
            });
        });
    }
}

function ant(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI, false);
    ctx.fillStyle = "red";
    ctx.fill();
}

graph = new Graph();
graph.draw();

ant(50, 50);


$('#form').submit(function () {
    let nb = $('#nb_node').val();
    let conn = $('#connectivity').val();

    graph = new Graph(nb, conn);
    graph.draw();

    return false;
});