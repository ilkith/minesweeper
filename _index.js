const cells = {
    __private: [],
    __b_count: 0,

    clear: function() {
        this.__private = []
        this.__b_count = 0
    },

    all: function () {
        return __private
    },

    add: function (o) {
        this.__private.push(o)
    },

    add_to: function (i, o) {
        this.__private[i].push(o)
    }
}

const size = {
    __size: {},

    default: {
        width : 30,
        height: 15
    },

    set: function (size) {
        __size = size
    },

    height: () => __size.height,
    width : () => __size.width ,

    object: () => __size
}

const States = {
    HIDDEN: 0,
    FLAGGED: 1,
    CLICKED: 2
}

const Texts = {
    bombCount: null,
}

window.onload = function () {

    document.getElementById("generate-button").onclick = () => {
        size.set({
            width: parseInt(document.getElementById("width").value || size.default.width),
            height: parseInt(document.getElementById("height").value || size.default.height)
        })
        generate()
    }

    document.getElementById("restart-button").onclick = () => generate()

    size.set(size.default)
    generate()
}


function generate()
{
    const table = document.getElementsByClassName("field")[0];
    table.innerHTML = "";

    cells.clear()

    loop_over_matrix(size.object(), {
        
        on_row: function (r) {
            cells.add([])
            return table.insertRow(r)
        },

        on_col: function (r, c, row) {

            let cell = row.insertCell(c)

            cell.classList.add("field-cell" )
            cell.classList.add("hidden-cell")
            cell.position = { row: r, col: c}

            cell.onclick = function () {
                this.classList.remove("hidden-cell")
                this.classList.add("clicked-cell"  )

                add_bombs(this.position)
                cells.all[r][c].neighbors.forEach(n => n.classList.add("neighboring-cell"))
            }

            cells.add_to(r, cell)
        }
    })
}

function loop_over_matrix(dimensions, funcs)
{
    if (!funcs.on_row) funcs.on_row = () => 0;
    if (!funcs.on_col) funcs.on_row = () => 0;

    for (let r = 0; r < dimensions.height; r++)
    {
        let row_data = funcs.on_row(r)

        for (let c = 0; c < dimensions.width; c++)
        {
            funcs.on_col(r, c, row_data)
        }
    }
}

function add_bombs () 
{

}