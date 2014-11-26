var lines = [], points = [];
var lineElements = [], pointElements = [];

function step() {
    function prev(i) {
        return points[(i + points.length - 1) % points.length];
    }
    function next(i) {
        return points[(i+1) % points.length];
    }
    var newPoints = [];
    var mu = 0.1;
    for (var i=0; i<points.length; ++i) {
        var avg = [0.5 * (prev(i)[0] + next(i)[0]),
                   0.5 * (prev(i)[1] + next(i)[1])];
        newPoints.push([avg[0] * mu + points[i][0] * (1.0 - mu),
                         avg[1] * mu + points[i][1] * (1.0 - mu)]);
    }
    for (i=0; i<points.length; ++i) {
        // NB: don't replace this with an assignment to points[i];
        // we need to mutate the previous list object so that the svg
        // elements see it;
        points[i][0] = newPoints[i][0];
        points[i][1] = newPoints[i][1];
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
