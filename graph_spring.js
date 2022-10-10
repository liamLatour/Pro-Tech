
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

        // used in bridge detection
        this.pre = [];
        this.low = [];
        this.cnt = 0;
        this.bridges = [];

        this.generate();
    }

    //TODO: place the nodes in logical order rather than random at start https://crinkles.io/writing/auto-graph-layout-algorithm
    generate() {
        this.graph = [];

        // initialize fully connected graph
        for (let i = 0; i < this.nb_points; i++) {
            let arr = [];

            for (let j = 0; j < this.nb_points; j++) {
                if (i == j) {
                    arr.push(0);
                } else {
                    arr.push(random.rand_weight());
                }
            }

            this.graph.push(arr);
        }

        // remove nb of arcs according to connectivity
        let max_arcs_to_remove = (this.nb_points * this.nb_points - 3 * this.nb_points) / 2;
        let nb_arcs_remove = Math.round((1 - this.connectivity) * max_arcs_to_remove);
        this.nb_edges = (this.nb_points * (this.nb_points - 1)) / 2 - nb_arcs_remove;


        for (let i = 0; i < nb_arcs_remove; i++) {
            let valid_arc = this.get_valid_arc();

            // have to find inner cycles
            if (valid_arc.length == 0) {
                this.get_cycles();
            } else {
                this.graph[valid_arc[1]][valid_arc[0]] = -1;
                this.graph[valid_arc[0]][valid_arc[1]] = -1;
            }
        }

        this.longest_edge = this.getMax(this.graph);

        this.ant_colony.graph = this;
    }

    getMax(a) {
        return Math.max(...a.map(e => Array.isArray(e) ? this.getMax(e) : e));
    }

    get_cycles() {
        for (let i = 0; i < this.nb_points; i++) {
            let adj = this.adj_nodes(i);
            if (adj.length >= 3) { // cycles node
                this.graph[i][adj[0]] = -1;
                this.graph[adj[0]][i] = -1;

                let start = adj[0];
                let current = start;
                let cur_adj = this.adj_nodes(current);
                let marked = [current];
                // find witch thing to link too
                while (cur_adj.length < 3) {
                    if (marked.includes(cur_adj[0])) {
                        current = cur_adj[1];
                    } else {
                        current = cur_adj[0];
                    }
                    marked.push(current);
                    cur_adj = this.adj_nodes(current);
                }

                let other = cur_adj[0];
                if (marked.includes(cur_adj[0])) {
                    other = cur_adj[1];
                }

                this.graph[other][start] = this.graph[current][other];
                this.graph[start][other] = this.graph[other][current];

                this.graph[current][other] = -1;
                this.graph[other][current] = -1;

                break;
            }
        }
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
    }
}