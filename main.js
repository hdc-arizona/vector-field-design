var lines = [], points = [];
var lineElements = [], pointElements = [];
var speed = 0.01;

function step() {
    function prev(vec, i) {
        return vec[(i + vec.length - 1) % vec.length];
    }
    function next(vec, i) {
        return vec[(i+1) % vec.length];
    }
    var vectors = [];

    for (var i=0; i<points.length; ++i) {
        var avg = [0.5 * (prev(points, i)[0] + next(points, i)[0]),
                   0.5 * (prev(points, i)[1] + next(points, i)[1])];
        vectors.push([avg[0] - points[i][0], avg[1] - points[i][1]]);
    }

    // compute area to force it to be area preserving by expanding away from centroid
    var area_before = 0.0;
    var area_after = 0.0;
    for (i=0; i<points.length; ++i) {
        area_before += prev(points, i)[0] * points[i][1] - prev(points, i)[1] * points[i][0];
    }

    for (i=0; i<points.length; ++i) {
        var vec;
        if (d3.select("#surface_tension").property("checked")) {
            vec = [vectors[i][0] - 0.5 * (prev(vectors, i)[0] + next(vectors, i)[0]),
                   vectors[i][1] - 0.5 * (prev(vectors, i)[1] + next(vectors, i)[1])];
        } else {
            vec = vectors[i];
        }
        points[i][0] += vec[0] * speed;
        points[i][1] += vec[1] * speed;
    }

    if (d3.select("#surface_tension_2").property("checked")) {
        for (i=0; i<points.length; ++i) {
            area_after += prev(points, i)[0] * points[i][1] - prev(points, i)[1] * points[i][0];
        }
        var area_ratio = area_after / area_before;
        var displacement = Math.sqrt(area_ratio);
        var center = [0,0];
        for (i=0; i<points.length; ++i) {
            center[0] += points[i][0];
            center[1] += points[i][1];
        }
        center[0] /= points.length;
        center[1] /= points.length;
        for (i=0; i<points.length; ++i) {
            points[i][0] = (points[i][0] - center[0]) / displacement + center[0];
            points[i][1] = (points[i][1] - center[1]) / displacement + center[1];
        }
    }

    if (d3.select("#lambda_mu").property("checked")) {
        vectors = [];
        for (i=0; i<points.length; ++i) {
            var avg = [0.5 * (prev(points, i)[0] + next(points, i)[0]),
                       0.5 * (prev(points, i)[1] + next(points, i)[1])];
            vectors.push([avg[0] - points[i][0], avg[1] - points[i][1]]);
        }
        for (i=0; i<points.length; ++i) {
            points[i][0] -= vectors[i][0] * speed;
            points[i][1] -= vectors[i][1] * speed;
        }
    }
}

function updatePointPos(sel)
{
    return sel
        .attr("cx", function(d) { return d[0]; })
        .attr("cy", function(d) { return d[1]; });
}

function updateLinePos(sel)
{
    return sel
        .attr("x1", function(d) { return d[0][0]; })
        .attr("y1", function(d) { return d[0][1]; })
        .attr("x2", function(d) { return d[1][0]; })
        .attr("y2", function(d) { return d[1][1]; });
}

function main()
{
    d3.select("#step")
        .on("click", function() {
            step();
            updatePointPos(pointsGroup.selectAll("circle"));
            updateLinePos(linesGroup.selectAll("line"));
        });
    d3.select("#go")
        .on("click", function() {
            function yeah() {
                window.requestAnimationFrame(yeah);
                step();
                updatePointPos(pointsGroup.selectAll("circle"));
                updateLinePos(linesGroup.selectAll("line"));
            }
            yeah();
        });
    d3.select("#faster")
        .on("click", function() { 
            speed *= 1.5; 
            console.log("new speed: ", speed);
        });
    var svg = d3.select("#main").append("svg")
        .attr("width", 480)
        .attr("height", 480)
        .style("background-color", "#ddd")
    ;
    var linesGroup = svg.append("g");
    var pointsGroup = svg.append("g");

    svg.on("click", function() {
        var pos = d3.mouse(this);
        pointElements.push(
            updatePointPos(
                pointsGroup.append("circle")
                    .attr("fill", "red")
                    .attr("stroke", "black")
                    .attr("r", 5)
                    .datum(pos)));
        points.push(pos);
        
        if (points.length === 2) {
            lineElements.push(
                updateLinePos(
                    linesGroup.append("line")
                        .datum([points[points.length-2], points[points.length-1]])
                        .attr("stroke", "black")));
        } else if (points.length === 3) {
            lineElements.push(
                updateLinePos(
                    linesGroup.append("line")
                        .datum([points[points.length-2], points[points.length-1]])
                        .attr("stroke", "black")));
            lineElements.push(
                updateLinePos(
                    linesGroup.append("line")
                        .datum([points[points.length-1], points[0]])
                        .attr("stroke", "black")));
        } else if (points.length > 3) {
            lineElements[lineElements.length-1].remove();
            lineElements.push(
                updateLinePos(
                    linesGroup.append("line")
                        .datum([points[points.length-2], points[points.length-1]])
                        .attr("stroke", "black")));
            lineElements.push(
                updateLinePos(
                    linesGroup.append("line")
                        .datum([points[points.length-1], points[0]])
                        .attr("stroke", "black")));
        }
    });
}

main();
