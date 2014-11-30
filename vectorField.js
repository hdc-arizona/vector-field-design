function createField(opts)
{
    opts = _.defaults(opts, {
        width: 5,
        height: 5,
        smooth: 0.15,
        domainX: d3.scale.linear(),
        domainY: d3.scale.linear()
    });
    if (_.isUndefined(opts.constraints)) {
        throw new Error("'constraints' is a required option");
    }
    var width = opts.width, height = opts.height;
    opts.domainX.range([0, width]);
    opts.domainY.range([0, height]);

    opts.constraints = _.map(opts.constraints, function(constraint) {
        return {
            x: opts.domainX(constraint.x),
            y: opts.domainY(constraint.y),
            vx: constraint.vx,
            vy: constraint.vy
        };
    });

    var solver = createSolver(opts);

    // var vfX = _.map(solver.solve(_.pluck(opts.constraints, "vx")), opts.domainX);
    // var vfY = _.map(solver.solve(_.pluck(opts.constraints, "vy")), opts.domainY);

    var vfX = solver.solve(_.pluck(opts.constraints, "vx"));
    var vfY = solver.solve(_.pluck(opts.constraints, "vy"));

    function ix(row, column) {
        return (row + 1) * (width + 2) + (column + 1);
    }

    return {
        field: [vfX, vfY],
        eval: function(x, y) {
            x = opts.domainX(x);
            y = opts.domainY(y);
            var row = Math.floor(y), rowNext = row + 1,
                col = Math.floor(x), colNext = col + 1,
                u = x - col, v = y - row;

            function evalField(field) {
                var xTop  = (1-u) * field[ix(row,   col)] + u * field[ix(row,   col+1)];
                var xBot  = (1-u) * field[ix(row+1, col)] + u * field[ix(row+1, col+1)];
                return (1-v) * xTop + v * xBot;
            }

            return [evalField(vfX), evalField(vfY)];            
        }
    };
};
