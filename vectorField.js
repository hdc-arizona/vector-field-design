function createField(opts)
{
    opts = _.defaults(opts, {
        width: 5,
        height: 5,
        smooth: 0.15
    });
    if (_.isUndefined(opts.constraints)) {
        throw new Error("'constraints' is a required option");
    }
    var width = opts.width, height = opts.height;

    var solver = createSolver(opts);


    var vfX = solver.solve(_.pluck(opts.constraints, "vx"));
    var vfY = solver.solve(_.pluck(opts.constraints, "vy"));

    function ix(row, column) {
        return (row + 1) * (width + 2) + (column + 1);
    }

    return {
        field: [vfX, vfY],
        eval: function(x, y) {
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
