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
        this.wind_direction = 0;
        this.wind_power = 10;
        this.nb_edges = 0;
        this.longest_edge = 0;

        // position of nodes
        this.grid_size = 20;
        this.nodes_position = [];

        // used in bridge detection
        this.pre = [];
        this.low = [];
        this.cnt = 0;
        this.bridges = [];

        // display options
        this.node_size = 7;
        this.arrowLength = 15;
        this.arrowWidth = 6;
        this.line_offset = 3;
		this.edge_font = "14px Verdana, sans-serif";

        this.generate();
    }

    distance(u, v=[0, 0]) {
        return Math.sqrt(Math.pow(u[0] - v[0], 2) + Math.pow(u[1] - v[1], 2));
    }

    winded_distance(u, v){
        let wind_effect = this.dot(this.sub(v, u), this.wind_direction);
        let dist = this.distance(u, v);
        return Math.exp(-wind_effect/dist)*dist + .1;
    }

    nearest_node(u) {
        let near = Infinity;

        for (const element of this.nodes_position) {
            let dist = this.distance(u, element);
            if (dist < near) {
                near = dist;
            }
        }

        return near;
    }

    random_node() {
        return [random.rand_gen()*this.grid_size, random.rand_gen()*this.grid_size];
    }

    generate() {
        this.graph = [];
        this.nodes_position = [];
        this.wind_direction = [0, 1]; //random.rand_gen()*Math.PI*2;
        console.log(this.winded_distance([0, 0], [0, -10]));

        // position points
        for (let i = 0; i < this.nb_points; i++) {
            let position = this.random_node();

            // check it isn't near others
            while (this.nearest_node(position) < 5) {
                position = this.random_node();
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
                    arr.push(Math.round(this.winded_distance(this.nodes_position[i], this.nodes_position[j]) * 10) / 10);
                }
            }

            this.graph.push(arr);
        }

        // remove nb of arcs according to connectivity
        let max_arcs_to_remove = (this.nb_points * this.nb_points - 3 * this.nb_points) / 2;
        let nb_arcs_remove = Math.round((1 - this.connectivity) * max_arcs_to_remove);

        // first remove non planar arcs
        let non_planar_arcs = this.non_planar_arcs();
        
        while (non_planar_arcs.length > 0) {
            let to_remove = random.rand_in_array(non_planar_arcs);
            this.graph[to_remove[1]][to_remove[0]] = -1;
            this.graph[to_remove[0]][to_remove[1]] = -1;
            non_planar_arcs = this.non_planar_arcs();
            nb_arcs_remove--;
        }

        // for (let i = 0; i < nb_arcs_remove; i++) {
        //     let valid_arc = this.get_valid_arc();

        //     // have to find inner cycles
        //     if (valid_arc.length > 0) {
        //         this.graph[valid_arc[1]][valid_arc[0]] = -1;
        //         this.graph[valid_arc[0]][valid_arc[1]] = -1;
        //     }
        // }

        //this.nb_edges = (this.nb_points * (this.nb_points - 1)) / 2 - nb_arcs_remove;
        this.longest_edge = this.getMax(this.graph);

        this.ant_colony.graph = this;
    }

    // 01957740444835987
    // 10

    getMax(a) {
        return Math.max(...a.map(e => Array.isArray(e) ? this.getMax(e) : e));
    }

    non_planar_arcs() {
        let valid_arcs = this.get_valid_arcs();

        let non_planar_arcs = [];

        for(let arc in valid_arcs){
            let i = valid_arcs[arc][0];
            let j = valid_arcs[arc][1];
            if (this.graph[i][j] > 0 && this.non_planar_arc(this.nodes_position[i], this.nodes_position[j])) {
                non_planar_arcs.push([i, j]);
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

    sub(a, b) {
        return [a[0]-b[0], a[1]-b[1]];
    }

    add(a, b) {
        return [a[0]+b[0], a[1]+b[1]];
    }

    mul(a, x){
        return [a[0]*x, a[1]*x];
    }

    cross(a, b){
        return a[0]*b[1] - a[1]*b[0];
    }

    dot(a, b){
        return a[0]*b[0]+a[1]*b[1];
    }

    normalize(a){
        let length = this.distance(a);
        return [a[0]/length, a[1]/length];
    }

    back(a, b, d){
        let slope = this.normalize(this.sub(a, b));

        return this.sub(a, this.mul(slope, d));
    }

    offset_line(a, b, d){
        let slope = this.sub(a, b);
        let direction = this.normalize([-slope[1], slope[0]]);

        return [this.add(a, this.mul(direction, d)), this.add(b, this.mul(direction, d))];
    }

    offset(a, b, d){
        let slope = this.sub(a, b);
        let direction = this.normalize([-slope[1], slope[0]]);

        return this.add(a, this.mul(direction, d));
    }

    intersects(p, v1, q, v2) {
        if (p == q || p == v2 || v1 == q || v1 == v2) {
            return false;
        }

        let r = this.sub(v1, p);
        let s = this.sub(v2, q);

        let rs = this.cross(r, s);
        let qp = this.sub(q, p)

        let t = this.cross(qp, s) / rs;
        let u = this.cross(qp, r) / rs;

        return rs != 0 && t<=1 && t>=0 && u<=1 && u>=0;
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

    get_valid_arcs() {
        this.get_bridge_arcs();
        let valid_arcs = [];

        for (let i = 0; i < this.nb_points; i++) {
            for (let j = 0; j < this.nb_points; j++) {
                if (this.graph[i][j] > 0 && !this.bridges.includes(i + "/" + j) && this.adj_nodes(i).length > 2 && this.adj_nodes(j).length > 2) {
                    valid_arcs.push([i, j]);
                }
            }
        }

        return valid_arcs;
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

        for (let i = 0; i < this.nb_points; i++) {
            ctx.save();
            ctx.beginPath();
            ctx.arc((this.nodes_position[i][0] + 1) * w, (this.nodes_position[i][1] + 1) * w, this.node_size, 0, 2 * Math.PI, false);
            ctx.fillStyle = "black";
            ctx.fill();
            ctx.restore();

            for (let j = 0; j < this.nb_points; j++) {
                if (this.graph[i][j] > 0) {
                    let x1 = (this.nodes_position[i][0] + 1) * w;
                    let y1 = (this.nodes_position[i][1] + 1) * w;
                    let x2 = (this.nodes_position[j][0] + 1) * w;
                    let y2 = (this.nodes_position[j][1] + 1) * w;

                    let off = this.offset_line([x1, y1], [x2, y2], this.line_offset);

                    x1 = off[0][0];
                    y1 = off[0][1];
                    x2 = off[1][0];
                    y2 = off[1][1];

                    let arrow_end = this.back([x2, y2], [x1, y1], this.node_size);

                    // Line
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();

                    // Arrow
					ctx.save();
					ctx.translate(arrow_end[0], arrow_end[1]);
					ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
					ctx.beginPath();
					ctx.moveTo(-this.arrowLength, this.arrowWidth);
					ctx.lineTo(0, 0);
					ctx.lineTo(-this.arrowLength, -this.arrowWidth);
					ctx.lineTo(-this.arrowLength * 0.8, -0);
					ctx.closePath();
					ctx.fill();
					ctx.restore();

                    // Label
                    ctx.save();
					ctx.textAlign = "center";
					ctx.textBaseline = "top";
					ctx.font = this.edge_font;
					let angle = Math.atan2(y2 - y1, x2 - x1);
					let displacement = -14;
					if ((angle > Math.PI / 2 || angle < -Math.PI / 2)) {
					  	displacement = -20;
						angle += Math.PI;
					}
					let textPos = this.offset(this.mul(this.add(off[0], off[1]), .5), off[1], displacement);
                    
                    ctx.translate(textPos[0], textPos[1]);
					ctx.rotate(angle);
					ctx.fillText(this.graph[i][j], 0, -2);
					ctx.restore();
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