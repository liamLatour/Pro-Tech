(function () {

	jQuery.fn.springy = function (params) {
		let graph = this.graph = params.graph || new Springy.Graph();
		let nodeFont = "16px Verdana, sans-serif";
		let edgeFont = "8px Verdana, sans-serif";
		let stiffness = params.stiffness || 400.0;
		let repulsion = params.repulsion || 400.0;
		let damping = params.damping || 0.5;
		let minEnergyThreshold = params.minEnergyThreshold || 0.00001;
		let nodeSelected = params.nodeSelected || null;
		let nodeImages = {};
		let edgeLabelsUpright = true;

		let update = params.update;

		let canvas = this[0];
		let ctx = canvas.getContext("2d");

		let layout = this.layout = new Springy.Layout.ForceDirected(graph, stiffness, repulsion, damping, minEnergyThreshold);

		// calculate bounding box of graph layout.. with ease-in
		let currentBB = layout.getBoundingBox();
		let targetBB = {
			bottomleft: new Springy.Vector(-2, -2),
			topright: new Springy.Vector(2, 2)
		};

		// auto adjusting bounding box
		Springy.requestAnimationFrame(function adjust() {
			targetBB = layout.getBoundingBox();
			// current gets 20% closer to target every iteration
			currentBB = {
				bottomleft: currentBB.bottomleft.add(targetBB.bottomleft.subtract(currentBB.bottomleft)
					.divide(10)),
				topright: currentBB.topright.add(targetBB.topright.subtract(currentBB.topright)
					.divide(10))
			};

			Springy.requestAnimationFrame(adjust);
		});

		// convert to/from screen coordinates
		let toScreen = function (p) {
			let size = currentBB.topright.subtract(currentBB.bottomleft);
			let sx = p.subtract(currentBB.bottomleft).divide(size.x).x * canvas.width;
			let sy = p.subtract(currentBB.bottomleft).divide(size.y).y * canvas.height;
			return new Springy.Vector(sx, sy);
		};

		let fromScreen = function (s) {
			let size = currentBB.topright.subtract(currentBB.bottomleft);
			let px = (s.x / canvas.width) * size.x + currentBB.bottomleft.x;
			let py = (s.y / canvas.height) * size.y + currentBB.bottomleft.y;
			return new Springy.Vector(px, py);
		};

		// half-assed drag and drop
		// let selected = null;
		// let nearest = null;
		// let dragged = null;

		// jQuery(canvas).mousedown(function(e) {
		// 	let pos = jQuery(this).offset();
		// 	let p = fromScreen({x: e.pageX - pos.left, y: e.pageY - pos.top});
		// 	selected = nearest = dragged = layout.nearest(p);

		// 	if (selected.node !== null) {
		// 		dragged.point.m = 10000.0;

		// 		if (nodeSelected) {
		// 			nodeSelected(selected.node);
		// 		}
		// 	}

		// 	renderer.start();
		// });

		// // Basic double click handler
		// jQuery(canvas).dblclick(function(e) {
		// 	let pos = jQuery(this).offset();
		// 	let p = fromScreen({x: e.pageX - pos.left, y: e.pageY - pos.top});
		// 	selected = layout.nearest(p);
		// 	node = selected.node;
		// 	if (node && node.data && node.data.ondoubleclick) {
		// 		node.data.ondoubleclick();
		// 	}
		// });

		// jQuery(canvas).mousemove(function(e) {
		// 	let pos = jQuery(this).offset();
		// 	let p = fromScreen({x: e.pageX - pos.left, y: e.pageY - pos.top});
		// 	nearest = layout.nearest(p);

		// 	if (dragged !== null && dragged.node !== null) {
		// 		dragged.point.p.x = p.x;
		// 		dragged.point.p.y = p.y;
		// 	}

		// 	renderer.start();
		// });

		// jQuery(window).bind('mouseup',function(e) {
		// 	dragged = null;
		// });

		let getTextWidth = function (node) {
			let text = (node.data.label !== undefined) ? node.data.label : node.id;
			if (node._width && node._width[text])
				return node._width[text];

			ctx.save();
			ctx.font = (node.data.font !== undefined) ? node.data.font : nodeFont;
			let width = ctx.measureText(text).width;
			ctx.restore();

			node._width || (node._width = {});
			node._width[text] = width;

			return width;
		};

		let getTextHeight = function (node) {
			return 30;
			// In a more modular world, this would actually read the font size, but I think leaving it a constant is sufficient for now.
			// If you change the font size, I'd adjust this too.
		};

		let getImageWidth = function (node) {
			let width = (node.data.image.width !== undefined) ? node.data.image.width : nodeImages[node.data.image.src].object.width;
			return width;
		}

		let getImageHeight = function (node) {
			let height = (node.data.image.height !== undefined) ? node.data.image.height : nodeImages[node.data.image.src].object.height;
			return height;
		}

		Springy.Node.prototype.getHeight = function () {
			let height;
			if (this.data.image == undefined) {
				height = getTextHeight(this);
			} else {
				if (this.data.image.src in nodeImages && nodeImages[this.data.image.src].loaded) {
					height = getImageHeight(this);
				} else {
					height = 10;
				}
			}
			return height;
		}

		Springy.Node.prototype.getWidth = function () {
			let width;
			if (this.data.image == undefined) {
				width = getTextWidth(this);
			} else {
				if (this.data.image.src in nodeImages && nodeImages[this.data.image.src].loaded) {
					width = getImageWidth(this);
				} else {
					width = 10;
				}
			}
			return width;
		}

		let renderer = this.renderer = new Springy.Renderer(layout,
			function clear() {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			},
			function drawEdge(edge, p1, p2) {
				let x1 = toScreen(p1).x;
				let y1 = toScreen(p1).y;
				let x2 = toScreen(p2).x;
				let y2 = toScreen(p2).y;

				let direction = new Springy.Vector(x2 - x1, y2 - y1);
				let normal = direction.normal().normalise();

				let from = graph.getEdges(edge.source, edge.target);
				let to = graph.getEdges(edge.target, edge.source);

				let total = from.length + to.length;

				// Figure out edge's position in relation to other edges between the same nodes
				let n = 0;
				for (let i = 0; i < from.length; i++) {
					if (from[i].id === edge.id) {
						n = i;
					}
				}

				//change default to  10.0 to allow text fit between edges
				let spacing = 7.0;

				// Figure out how far off center the line should be drawn
				let offset = normal.multiply(-((total - 1) * spacing) / 2.0 + (n * spacing));

				let paddingX = 6;
				let paddingY = 6;

				let s1 = toScreen(p1).add(offset);
				let s2 = toScreen(p2).add(offset);

				let boxWidth = edge.target.getWidth() + paddingX;
				let boxHeight = edge.target.getHeight() + paddingY;

				let intersection = intersect_line_box(s1, s2, {
					x: x2 - 16 / 2.0,
					y: y2 - 16 / 2.0
				}, 16, 16);

				if (!intersection) {
					intersection = s2;
				}

				//let stroke = (edge.data.color !== undefined) ? edge.data.color : '#000000';
				let stroke = update(edge);

				let arrowWidth;
				let arrowLength;

				let weight = (edge.data.weight !== undefined) ? edge.data.weight : 1.0;

				ctx.lineWidth = Math.max(weight * 2, 0.1);
				arrowWidth = 4 + ctx.lineWidth;
				arrowLength = 12;

				let directional = (edge.data.directional !== undefined) ? edge.data.directional : true;

				//line
				let lineEnd;
				if (directional) {
					lineEnd = intersection.subtract(direction.normalise().multiply(arrowLength * 0.5));
				} else {
					lineEnd = s2;
				}

				ctx.strokeStyle = stroke;
				ctx.beginPath();
				ctx.moveTo(s1.x, s1.y);
				ctx.lineTo(lineEnd.x, lineEnd.y);
				ctx.stroke();

				//arrow
				if (directional) {
					ctx.save();
					ctx.fillStyle = stroke;
					ctx.translate(intersection.x, intersection.y);
					ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
					ctx.beginPath();
					ctx.moveTo(-arrowLength, arrowWidth);
					ctx.lineTo(0, 0);
					ctx.lineTo(-arrowLength, -arrowWidth);
					ctx.lineTo(-arrowLength * 0.8, -0);
					ctx.closePath();
					ctx.fill();
					ctx.restore();
				}

				// label
				if (edge.data.label !== undefined) {
					text = edge.data.label
					ctx.save();
					ctx.textAlign = "center";
					ctx.textBaseline = "top";
					ctx.font = (edge.data.font !== undefined) ? edge.data.font : edgeFont;
					ctx.fillStyle = stroke;
					let angle = Math.atan2(s2.y - s1.y, s2.x - s1.x);
					let displacement = -20;
					if (edgeLabelsUpright && (angle > Math.PI / 2 || angle < -Math.PI / 2)) {
						displacement = -8;
						angle += Math.PI;
					}
					let textPos = s1.add(s2).divide(2).add(normal.multiply(displacement));
					ctx.translate(textPos.x, textPos.y);
					ctx.rotate(angle);
					ctx.fillText(text, 0, -2);
					ctx.restore();
				}
			},
			function drawNode(node, p) {
				let s = toScreen(p);

				ctx.save();

				ctx.beginPath();
				ctx.arc(s.x, s.y, 10, 0, 2 * Math.PI, false);
				ctx.fillStyle = "black";
				ctx.fill();

				// Pulled out the padding aspect sso that the size functions could be used in multiple places
				// These should probably be settable by the user (and scoped higher) but this suffices for now
				//let paddingX = 6;
				//let paddingY = 6;

				//let contentWidth = node.getWidth();
				//let contentHeight = node.getHeight();
				//let boxWidth = contentWidth + paddingX;
				//let boxHeight = contentHeight + paddingY;

				// clear background
				//ctx.clearRect(s.x - boxWidth/2, s.y - boxHeight/2, boxWidth, boxHeight);

				// fill background
				//if (selected !== null && selected.node !== null && selected.node.id === node.id) {
				//	ctx.fillStyle = "#FFFFE0";
				//} else if (nearest !== null && nearest.node !== null && nearest.node.id === node.id) {
				//	ctx.fillStyle = "#EEEEEE";
				//} else {
				//	ctx.fillStyle = "#FFFFFF";
				//}
				//ctx.fillRect(s.x - boxWidth/2, s.y - boxHeight/2, boxWidth, boxHeight);

				//if (node.data.image == undefined) {
				//	ctx.textAlign = "left";
				//	ctx.textBaseline = "top";
				//	ctx.font = (node.data.font !== undefined) ? node.data.font : nodeFont;
				//	ctx.fillStyle = (node.data.color !== undefined) ? node.data.color : "#000000";
				//	let text = (node.data.label !== undefined) ? node.data.label : node.id;
				//	ctx.fillText(text, s.x - contentWidth/2, s.y - contentHeight/2);
				//} else {
				//	// Currently we just ignore any labels if the image object is set. One might want to extend this logic to allow for both, or other composite nodes.
				//	let src = node.data.image.src;  // There should probably be a sanity check here too, but un-src-ed images aren't exaclty a disaster.
				//	if (src in nodeImages) {
				//		if (nodeImages[src].loaded) {
				//			// Our image is loaded, so it's safe to draw
				//			ctx.drawImage(nodeImages[src].object, s.x - contentWidth/2, s.y - contentHeight/2, contentWidth, contentHeight);
				//		}
				//	}else{
				//		// First time seeing an image with this src address, so add it to our set of image objects
				//		// Note: we index images by their src to avoid making too many duplicates
				//		nodeImages[src] = {};
				//		let img = new Image();
				//		nodeImages[src].object = img;
				//		img.addEventListener("load", function () {
				//			// HTMLImageElement objects are very finicky about being used before they are loaded, so we set a flag when it is done
				//			nodeImages[src].loaded = true;
				//		});
				//		img.src = src;
				//	}
				//}
				ctx.restore();
			}
		);

		renderer.start();

		// helpers for figuring out where to draw arrows
		function intersect_line_line(p1, p2, p3, p4) {
			let denom = ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));

			// lines are parallel
			if (denom === 0) {
				return false;
			}

			let ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
			let ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

			if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
				return false;
			}

			return new Springy.Vector(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
		}

		function intersect_line_box(p1, p2, p3, w, h) {
			let tl = {
				x: p3.x,
				y: p3.y
			};
			let tr = {
				x: p3.x + w,
				y: p3.y
			};
			let bl = {
				x: p3.x,
				y: p3.y + h
			};
			let br = {
				x: p3.x + w,
				y: p3.y + h
			};

			let result;
			if (result = intersect_line_line(p1, p2, tl, tr)) {
				return result;
			} // top
			if (result = intersect_line_line(p1, p2, tr, br)) {
				return result;
			} // right
			if (result = intersect_line_line(p1, p2, br, bl)) {
				return result;
			} // bottom
			if (result = intersect_line_line(p1, p2, bl, tl)) {
				return result;
			} // left

			return false;
		}

		return this;
	}

})();