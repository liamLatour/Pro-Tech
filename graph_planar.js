function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

function intersects(u1, v1, u2, v2) {
    if (u1 == u2 || u1 == v2 || v1 == u2 || v1 == v2) {
        console.log("b");
        return false;
    }
    if (Math.max(u1[0], v1[0]) < Math.max(u2[0], v2[0])) {
        console.log("a");
        return false;
    }

    let A1 = (u1[1] - v1[1]) / (u1[0] - v1[0]);
    let A2 = (u2[1] - v2[1]) / (u2[0] - v2[0]);

    if (A1 == A2) {
        console.log("c");
        return false;
    }

    let b1 = u1[1] - A1 * u1[0];
    let b2 = u2[1] - A2 * u2[0];

    let Xa = (b2 - b1) / (A1 - A2);

    return (Xa < Math.max(Math.min(u1[0], v1[0]), Math.min(u2[0], v2[0])) ||
        Xa < Math.min(Math.max(u1[0], v1[0]), Math.max(u2[0], v2[0])));
}

// Convention is:
//   array 1 contains neighbors of node 1
//   negative weight is not a connection
class Graph {
    constructor(nb_points = 5, connectivity = .5) {
        this.nb_points = nb_points;
        this.connectivity = connectivity;
        this.graph = [];
        this.ant_colony = new AntColony();

        // data on graph
        this.nb_edges = 0;
        this.longest_edge = 0;

        // position of nodes
        this.grid_size = 20;
        this.nodes_position = [];

        this.generate();
    }

    distance_nodes(u, v) {
        return Math.sqrt(Math.pow(u[0] - v[0], 2) + Math.pow(u[1] - v[1], 2));
    }

    nearest_node(u) {
        let near = Infinity;

        for (const element of this.nodes_position) {
            let dist = this.distance_nodes(u, element);
            if (dist < near) {
                near = dist;
            }
        }

        return near;
    }

    generate() {
        this.graph = [];
        this.nodes_position = [];

        // position points
        for (let i = 0; i < this.nb_points; i++) {
            let position = [random.rand_int(0, this.grid_size + 1), random.rand_int(0, this.grid_size + 1)];

            // check it isn't near others
            while (this.nearest_node(position) < 3) {
                position = [random.rand_int(0, this.grid_size + 1), random.rand_int(0, this.grid_size + 1)];
            }

            this.nodes_position.push(position);
        }

        // create arcs

        // initialize fully connected graph
        for (let i = 0; i < this.nb_points; i++) {
            let arr = [];

            for (let j = 0; j < this.nb_points; j++) {
                if (i == j) {
                    arr.push(0);
                } else {
                    arr.push(Math.round(this.distance_nodes(this.nodes_position[i], this.nodes_position[j]) * 10) / 10);
                }
            }

            this.graph.push(arr);
        }

        // remove nb of arcs according to connectivity
        let max_arcs_to_remove = (this.nb_points * this.nb_points - 3 * this.nb_points) / 2;
        let nb_arcs_remove = Math.round((1 - this.connectivity) * max_arcs_to_remove);

        // first remove non planar arcs
        let non_planar_arcs = this.non_planar_arcs();
        let i = 0;
        while (non_planar_arcs.length > 0 && i < 10) {
            console.log(non_planar_arcs);
            let to_remove = random.rand_in_array(non_planar_arcs);
            this.graph[to_remove[1]][to_remove[0]] = -1;
            this.graph[to_remove[0]][to_remove[1]] = -1;
            nb_arcs_remove--;
            i++;
        }

        for (let i = 0; i < nb_arcs_remove; i++) {
            let valid_arc = this.get_valid_arc();

            // have to find inner cycles
            if (valid_arc.length > 0) {
                this.graph[valid_arc[1]][valid_arc[0]] = -1;
                this.graph[valid_arc[0]][valid_arc[1]] = -1;
            }
        }

        //this.nb_edges = (this.nb_points * (this.nb_points - 1)) / 2 - nb_arcs_remove;
        this.longest_edge = this.getMax(this.graph);

        this.ant_colony.graph = this;
    }

    getMax(a) {
        return Math.max(...a.map(e => Array.isArray(e) ? this.getMax(e) : e));
    }

    non_planar_arcs() {
        let non_planar_arcs = [];
        for (let i = 0; i < this.nb_points; i++) {
            for (let j = 0; j < this.nb_points; j++) {
                if (this.graph[i][j] > 0 && this.non_planar_arc(this.nodes_position[i], this.nodes_position[j])) {
                    non_planar_arcs.push([i, j]);
                }
            }
        }

        return non_planar_arcs;
    }

    non_planar_arc(u, v) {
        for (let i = 0; i < this.nb_points; i++) {
            for (let j = 0; j < this.nb_points; j++) {
                if (this.graph[i][j] > 0 && this.intersects(u, v, this.nodes_position[i], this.nodes_position[j])) {
                    return true;
                }
            }
        }

        return false;
    }

    intersects(u1, v1, u2, v2) {
        if (u1 == u2 || u1 == v2 || v1 == u2 || v1 == v2) {
            return false;
        }
        if (Math.max(u1[0], v1[0]) < Math.max(u2[0], v2[0])) {
            return false;
        }

        let A1 = (u1[1] - v1[1]) / (u1[0] - v1[0]);
        let A2 = (u2[1] - v2[1]) / (u2[0] - v2[0]);

        if (A1 == A2) {
            return false;
        }

        let b1 = u1[1] - A1 * u1[0];
        let b2 = u2[1] - A2 * u2[0];

        let Xa = (b2 - b1) / (A1 - A2);

        return (Xa < Math.max(Math.min(u1[0], v1[0]), Math.min(u2[0], v2[0])) ||
            Xa < Math.min(Math.max(u1[0], v1[0]), Math.max(u2[0], v2[0])));
    }

    get_bridge_arcs() {
        this.bridges = [];

        for (let i = 0; i < this.nb_points; i++) {
            this.low[i] = -1;
            this.pre[i] = -1;
        }

        for (let i = 0; i < this.nb_points; i++) {
            if (this.pre[i] == -1) {
                this.dfs_bridge(i, i);
            }
        }
    }

    dfs_bridge(u, v) {
        this.pre[v] = this.cnt++;
        this.low[v] = this.pre[v];

        for (let i = 0; i < this.nb_points; i++) {
            if (this.graph[v][i] > 0 && this.pre[i] == -1) {
                this.dfs_bridge(v, i);
                this.low[v] = Math.min(this.low[v], this.low[i]);
                if (this.low[i] == this.pre[i]) {
                    // found a bridge, v-i
                    this.bridges.push(v + "/" + i);
                    this.bridges.push(i + "/" + v);
                }
            } else if (this.graph[v][i] > 0 && i != u) {
                this.low[v] = Math.min(this.low[v], this.pre[i]);
            }
        }
    }

    adj_nodes(u) {
        let nodes = [];
        for (let i = 0; i < this.nb_points; i++) {
            if (this.graph[u][i] > 0) {
                nodes.push(i);
            }
        }
        return nodes;
    }

    get_valid_arc() {
        this.get_bridge_arcs();
        let valid_arcs = [];

        for (let i = 0; i < this.nb_points; i++) {
            for (let j = 0; j < this.nb_points; j++) {
                if (this.graph[i][j] > 0 && !this.bridges.includes(i + "/" + j) && this.adj_nodes(i).length > 2 && this.adj_nodes(j).length > 2) {
                    valid_arcs.push([i, j]);
                }
            }
        }

        if (valid_arcs.length > 0) {
            return random.rand_in_array(valid_arcs);
        }

        return [];
    }

    update() {
        this.ant_colony.next_iteration();
    }

    update_color(edge) {
        let source = edge.source.id;
        let target = edge.target.id;

        let value = Math.floor(this.ant_colony.get_pheromone(source, target) * 255).toString(16);

        return "#" + value + "0000";
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let w = canvas.clientWidth / (this.grid_size + 2);
        console.log(w);

        for (let i = 0; i < this.nb_points; i++) {
            ctx.save();
            ctx.beginPath();
            ctx.arc((this.nodes_position[i][0] + 1) * w, (this.nodes_position[i][1] + 1) * w, 10, 0, 2 * Math.PI, false);
            ctx.fillStyle = "black";
            ctx.fill();
            ctx.restore();

            for (let j = 0; j < this.nb_points; j++) {
                if (this.graph[i][j] > 0) {
                    ctx.beginPath();
                    ctx.moveTo((this.nodes_position[i][0] + 1) * w, (this.nodes_position[i][1] + 1) * w);
                    ctx.lineTo((this.nodes_position[j][0] + 1) * w, (this.nodes_position[j][1] + 1) * w);
                    ctx.stroke();
                }
            }
        }


        /*
        let graphJSON = {
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
        let graph = new Springy.Graph(() => {
            this.update();
        });
        graph.loadJSON(graphJSON);

        //TODO: try to know when it's done
        jQuery('#canvas').springy({
            graph: graph,
            'update': (edge) => {
                return this.update_color(edge);
            },
        });
        */
    }
}