export class MapColorFinder {

    constructor(layers) {
        var segments = this.simplifySegments(layers);
        this.reverseMap(segments);
        this.areaGraph = this.buildGraph(segments);
        this.areaGraph.colorAllVertices();
    }

    getColor(segmentIndex) {
        return this.areaGraph.getById(segmentIndex).color;
    }

    simplifySegments(layers) {
        var segmentCounter = 0;
        var internalSegments = [];
        var result = {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity
        };
        layers.forEach(layer => {
            if (layer.type != "segment") {
                return;
            }
            var segment = {
                segmentIndex: segmentCounter++,
                class: layer.__class,
                type: layer.type
            };
            var allPixels = [];
            for (let index = 0; index < layer.pixels.length / 2; index += 2) {
                var p = { x: layer.pixels[index], y: layer.pixels[index + 1] };
                this.setBoundaries(result, p);
                allPixels.push(p);
            }
            segment.pixels = allPixels;
            internalSegments.push(segment);
        });
        result.segments = internalSegments;
        return result;
    }

    setBoundaries(res, pixel) {
        if (pixel.x < res.minX) {
            res.minX = pixel.x;
        }
        if (pixel.y < res.minY) {
            res.minY = pixel.y;
        }
        if (pixel.x > res.maxX) {
            res.maxX = pixel.x;
        }
        if (pixel.y > res.maxY) {
            res.maxY = pixel.y;
        }
    }

    reverseMap(segmentCollection) {
        var completeMap = this.create2DArray(
            segmentCollection.maxX + 1,// - segmentCollection.minX,
            segmentCollection.maxY + 1// - segmentCollection.minY
        );
        segmentCollection.segments.forEach(seg => {
            seg.pixels.forEach(p => {
                completeMap[p.x][p.y] = seg.segmentIndex;
            });
        });
        segmentCollection.map = completeMap;
    }

    buildGraph(segmentCollection) {
        var vertices = segmentCollection.segments.map(s => new MapAreaVertex(s.segmentIndex));
        var graph = new MapAreaGraph(vertices);
        // row-first traversal
        for (let y = segmentCollection.minY; y <= segmentCollection.maxY; y++) {
            var currentSegmentId = undefined;
            for (let x = segmentCollection.minX; x <= segmentCollection.maxX; x++) {
                var newSegmentId = segmentCollection.map[x][y];
                if (currentSegmentId != undefined && newSegmentId != undefined && currentSegmentId != newSegmentId) {
                    graph.getById(currentSegmentId).appendVertex(graph.getById(newSegmentId));
                }
                if (newSegmentId != undefined) {
                    currentSegmentId = newSegmentId;
                }
            }
        }
        for (let x = segmentCollection.minX; x <= segmentCollection.maxX; x++) {
            var currentSegmentId = undefined;
            for (let y = segmentCollection.minY; y <= segmentCollection.maxY; y++) {
                var newSegmentId = segmentCollection.map[x][y];
                if (currentSegmentId != undefined && newSegmentId != undefined && currentSegmentId != newSegmentId) {
                    graph.getById(currentSegmentId).appendVertex(graph.getById(newSegmentId));
                }
                if (newSegmentId != undefined) {
                    currentSegmentId = newSegmentId;
                }
            }
        }
        return graph;
    }

    // https://stackoverflow.com/a/966938
    create2DArray(length) {
        var arr = new Array(length || 0),
            i = length;
        if (arguments.length > 1) {
            var args = Array.prototype.slice.call(arguments, 1);
            while (i--) arr[length - 1 - i] = this.create2DArray.apply(this, args);
        }
        return arr;
    }
}

class MapAreaVertex {
    constructor(id) {
        this.id = id;
        this.adjacentVertexIds = [];
        this.color = undefined;
    }

    appendVertex(vertex) {
        if (!this.adjacentVertexIds.includes(vertex.id)) {
            this.adjacentVertexIds.push(vertex.id);
        }
    }
}

class MapAreaGraph {
    constructor(vertices) {
        this.vertices = vertices;
    }

    colorAllVertices() {
        this.vertices.forEach(v => {
            if (v.adjacentVertexIds.length <= 0) {
                v.color = 0;
            }
            else {
                var existingColors = v.adjacentVertexIds.map(vid => this.getById(vid))
                    .filter(vert => vert.color != undefined)
                    .map(vert => vert.color);
                //console.log(existingColors);
                v.color = this.lowestColor(existingColors);
            }
        });
    }

    getById(id) {
        return this.vertices.find(v => v.id == id);
    }

    lowestColor(colors) {
        if (colors.length <= 0) {
            return 0;
        }
        for (let index = 0; index < colors.length + 1; index++) {
            if (!colors.includes(index)) {
                return index;
            }
        }
    }
}