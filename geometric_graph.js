function makeArc(lst, internal)
{
    return {
        vertices: lst,
        internal: internal || false
    };
}

function lerp(v1, v2, u)
{
    return vec.plus(vec.scaling(v1, 1-u), vec.scaling(v2, u));
}

function stepMeanCurvatureFlow(graph, amount)
{
    if (!amount)
        amount = 0.5;

    // compute displacement for edge boundary nodes.
    var newBoundaryPositions = _.object(_.map(graph.nodes, function(node) {
        var avg = vec2.create(), original;
        var count = 0;
        _.each(graph.edgeList[node], function(entry) {
            var vs = entry.arc.vertices;
            ++count;
            vec2.add(avg, vs[1]);
            original = vs[0];
        });
        _.each(graph.reverseEdgeList[node], function(entry) {
            var vs = entry.arc.vertices;
            ++count;
            vec2.add(avg, vs[vs.length-2]);
            original = vs[vs.length-1];
        });
        vec2.scale(avg, 1/count);
        
        return [node, lerp(original, avg, amount)];
    }));

    // compute displacement for internal edge nodes;
    _.each(graph.edgeList, function(edgeList, from) {
        _.each(edgeList, function(entry) {
            var to = entry.node;
            var vs = entry.arc.vertices;
            var newPositions = _.map(vs, function(v, i) {
                if (i === 0) {
                    return vec.make(newBoundaryPositions[from]);
                }
                if (i === vs.length-1) {
                    return vec.make(newBoundaryPositions[to]);
                }
                return lerp(v, lerp(vs[i-1], vs[i+1], 0.5), amount);
            });
            entry.arc = makeArc(newPositions, entry.arc.internal);
        });
    });

    _.each(graph.reverseEdgeList, function(reverseEdgeList, to) {
        _.each(reverseEdgeList, function(entry) {
            var from = entry.node;
            entry.arc = graph.edgeList[from][to].arc;
        });
    });
}

function makeGraph(nodes, edges)
{
    var edgeList = {}, reverseEdgeList = {};
    _.each(edges, function(edge) {
        var from = edge[0], to = edge[1],
            entry = { node: edge[1], arc: edge[2] }, 
            reverseEntry = { node: edge[0], arc: edge[2] };
        
        if (!(from in edgeList)) {
            edgeList[from] = {};
        }
        edgeList[from][to] = entry;

        if (!(to in reverseEdgeList)) {
            reverseEdgeList[to] = {};
        }
        reverseEdgeList[to][from] = reverseEntry;
    });
    return {
        nodes: nodes,
        edgeList: edgeList,
        reverseEdgeList: reverseEdgeList
    };
}

function midpointSubdivision(arc, iterations)
{
    if (iterations <= 0)
        return arc;
    var result = [];
    var vs = arc.vertices, i;
    result.push(vec2.make(vs[0]));
    for (i=1; i<vs.length; ++i) {
        result.push(vec2.scale(vec2.plus(vs[i-1], vs[i]), 0.5));
        result.push(vec2.make(vs[i]));
    }
    return midpointSubdivision(makeArc(result, arc.internal), iterations-1);
};

function makeOneSquare(steps)
{
    var arc1 = midpointSubdivision(makeArc(_.map([[0,0], [1,0]], vec.make)),steps);
    var arc2 = midpointSubdivision(makeArc(_.map([[1,0], [1,1]], vec.make)),steps);
    var arc3 = midpointSubdivision(makeArc(_.map([[1,1], [0,1]], vec.make)),steps);
    var arc4 = midpointSubdivision(makeArc(_.map([[0,1], [0,0]], vec.make)),steps);
    return makeGraph(
        [0,1,2,3],
        [[0,1,arc1],
         [1,2,arc2],
         [2,3,arc3],
         [3,0,arc4]]);
}

function makeTwoSquares(steps)
{
    function make(vs, internal) {
        return midpointSubdivision(makeArc(_.map(vs, vec.make), internal), steps);
    }

    var arcs = [make([[0,0], [0.5,0]]),
                make([[0.5,0], [1,0]]),
                make([[1,0], [1,0.5], [1,1]]),
                make([[1,1], [0.5,1]]),
                make([[0.5,1], [0, 1]]),
                make([[0,1], [0, 0.5], [0, 0]]),
                make([[0.5, 0], [0.5, 0.5], [0.5, 1]], true)];

    return makeGraph(
        [0,1,2,3,4,5],
        [[0,1,arcs[0]],
         [1,2,arcs[1]],
         [2,3,arcs[2]],
         [3,4,arcs[3]],
         [4,5,arcs[4]],
         [5,0,arcs[5]],
         [1,4,arcs[6]]
         ]);
}

function makeTwoSquaresB(steps)
{
    function make(vs) {
        return midpointSubdivision(makeArc(_.map(vs, vec.make)), steps);
    }
    var arcs = _.map([[[0,0],  [1,0]],
                      [[1,0],  [2,0]],
                      [[2,0],  [2,1]],
                      [[2,1],  [1,1]],
                      [[1,1],  [0,1]],
                      [[0,1],  [0,0]],
                      [[1,0],  [1,-1]],
                      [[1,-1], [2,-1], [3,-1]],
                      [[3,-1], [3,0], [3,1], [3,2]],
                      [[3,2],  [2,2], [1,2]],
                      [[1,2],  [1,1]],
                      [[1,1],  [1,0]]
                     ], make);
    return makeGraph(
        [0,1,2,3,4,5,6,7,8,9],
        [[0,1,arcs[0]],
         [1,2,arcs[1]],
         [2,3,arcs[2]],
         [3,4,arcs[3]],
         [4,5,arcs[4]],
         [5,0,arcs[5]],
         [1,6,arcs[6]],
         [6,7,arcs[7]],
         [7,8,arcs[8]],
         [8,9,arcs[9]],
         [9,4,arcs[10]],
         [4,1,arcs[11]]
        ]);

}


function main()
{
    function updateNodes(sel)
    {
        sel .data(function(d) { return d.arc.vertices; })
            .attr("cx", function(d) { return x(d[0]); })
            .attr("cy", function(d) { return y(d[1]); })
            .attr("r", 3)
            .attr("fill", "red")
            .attr("stroke", "black");
    }

    function updateArcs(sel)
    {
        sel .data(function(d) {
                var l = d.arc.vertices.length-1, vs = d.arc.vertices;
                var result = _.zip(vs.slice(0, l), vs.slice(1, l+1));
                return result;
            })
            .attr("x1", function(d) { return x(d[0][0]); })
            .attr("y1", function(d) { return y(d[0][1]); })
            .attr("x2", function(d) { return x(d[1][0]); })
            .attr("y2", function(d) { return y(d[1][1]); })
            .attr("stroke", "black");
    }

    // var graph = makeOneSquare(1);
    // var graph = makeTwoSquaresB(2);
    var graph = makeTwoSquares(2);
    // var graph = makeTwoSquares(0);
    var x = d3.scale.linear().domain([-2.5, 4.5]).range([0,480]);
    var y = d3.scale.linear().domain([ 4.5,-2.5]).range([0,480]);
    var svg = d3.select("#main")
        .append("svg")
        .attr("width", 480)
        .attr("height", 480)
        .style("background-color", "#ddd");
    var edges = svg.selectAll("g")
        .data(_.flatten(_.map(_.values(graph.edgeList), _.values)))
        .enter()
        .append("g");

    updateArcs(
        edges.selectAll("line")
            .data(function(d) {
                var l = d.arc.vertices.length-1, vs = d.arc.vertices;
                var result = _.zip(vs.slice(0, l), vs.slice(1, l+1));
                return result;
            })
            .enter()
            .append("line"));

    updateNodes(edges.selectAll("circle")
                .data(function(d) { return d.arc.vertices; })
                .enter()
                .append("circle"));

    function step() {
        stepMeanCurvatureFlow(graph, 0.4);
        stepMeanCurvatureFlow(graph, -0.4);
        updateArcs(edges.selectAll("line"));
        updateNodes(edges.selectAll("circle"));
    }

    d3.select("#step")
        .on("click", step);

    d3.select("#go")
        .on("click", function() {
            function f() {
                step();
                window.requestAnimationFrame(f);
            }
            window.requestAnimationFrame(f);
        });
}

main();
