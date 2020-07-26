let cells = []
let size = {}
let bombCount = 0
let bombCountText;

const CellState = {
    HIDDEN: 0,
    FLAGGED: 1,
    CLICKED: 2
};

window.onload = function () {

    document.getElementById("generate-button").onclick = () => generate({
        width: parseInt(document.getElementById("width").value || 30),
        height: parseInt(document.getElementById("height").value || 15)
    });
    document.getElementById("restart-button").onclick = () => generate(size);
    bombCountText = document.getElementById("bomb-count-text");

    generate({width: 30, height: 15});
}

function generate(_size) {
    const table = document.getElementsByClassName("field")[0];
    table.innerHTML = "";

    cells = []
    bombCount = 0

    size = _size;

    for (let r = 0; r < size.height; r ++) {

        let cr = table.insertRow(r);
        cells.push([]);

        for (let c = 0; c < size.width; c++) {
        
            let cc = cr.insertCell(c);
        
            cc.classList.add("field-cell");
            cc.classList.add("hidden-cell");

            cc.pos = {row: r, col: c};

            cc.onclick = function() {
                this.classList.remove("hidden-cell");
                this.classList.add("clicked-cell")
                generate_bomb(this.pos)
                cells[r][c].neighbors.forEach(n => n.classList.add("neighboring-cell"))
            }

            cells[r].push(cc);

        }
    }
}

function generate_bomb(pos) {

    let _min_row = clamp_in_size(pos.row - 1, size.height - 1);
    let _max_row = clamp_in_size(pos.row + 1, size.height - 1);

    let _min_col = clamp_in_size(pos.col - 1, size.width - 1);
    let _max_col = clamp_in_size(pos.col + 1, size.width - 1);

    for (let r = 0; r < size.height; r ++) {
        for (let c = 0; c < size.width; c++) {

            if (!((r <= _max_row && r >= _min_row) && (c <= _max_col && c >= _min_col))) {
                let isBomb = Math.random() < .25;
                cells[r][c].isBomb = isBomb;
                if (isBomb)
                    bombCount++;
            }

            cells[r][c].state = CellState.HIDDEN;

            cells[r][c].onclick = function () {
                if (this.state === CellState.FLAGGED) {
                    this.classList.remove("flagged-cell");
                    
                    this.state = CellState.HIDDEN;
                    bombCount++;
                    bombCountText.innerHTML = bombCount;
                    return;
                }

                if (this.state === CellState.CLICKED)
                    return;

                this.state = CellState.CLICKED;
                this.classList.remove("hidden-cell");

                const css = this.isBomb ? "bomb-cell" : "clicked-cell";
                this.classList.add(css);

                if (!this.isBomb) {
                    this.innerHTML = this.bombCount || "";
                    this.classList.add(`b-${this.bombCount}`)
                }
                else {
                    cells.forEach(r => {
                        r.forEach(c => {
                            c.classList.remove("hidden-cell");

                            const css = c.isBomb ? "bomb-cell" : "clicked-cell";
                            c.classList.add(css);

                            if (!c.isBomb) {
                                c.classList.add(`b-${c.bombCount}`)
                                c.innerHTML = c.bombCount || ""
                            }

                            c.state = CellState.CLICKED;

                            c.onclick = function() {}
                            c.oncontextmenu = () => false
                        })
                    })
                }
                
                if (this.bombCount === 0)
                    this.neighbors.forEach(n => n.propagate([this.pos]))

                cells[r][c].neighbors.forEach(n => n.classList.add("neighboring-cell"))
            }

            cells[r][c].oncontextmenu = function () {
                if (this.state === CellState.CLICKED)
                    return false;

                this.state = CellState.FLAGGED;
                bombCount--;
                bombCountText.innerHTML = bombCount;

                this.classList.add("flagged-cell");
                return false;
            }

            cells[r][c].propagate = function(pos) {
                this.classList.remove("hidden-cell");
                this.classList.add("clicked-cell");
                this.classList.add(`b-${this.bombCount}`)
                this.state = CellState.CLICKED;

                if (!this.isBomb)
                    this.innerHTML = this.bombCount || "";

                if (this.bombCount === 0)
                    this.neighbors.forEach(n => {
                        
                        let hasPropagated = pos.find(p => p.row === n.pos.row && p.col === n.pos.col)

                        if (!hasPropagated) {
                            pos.push(this.pos)
                            n.propagate(pos)
                        }
                    })

            }

            cells[r][c].onmouseover = function () {
                if (this.state === CellState.CLICKED)
                    cells[r][c].neighbors.forEach(n => n.classList.add("neighboring-cell"))
            }

            cells[r][c].onmouseout = function () {
                if (this.state === CellState.CLICKED)
                    cells[r][c].neighbors.forEach(n => n.classList.remove("neighboring-cell"))
            }

        }
    }


    for (let r = 0; r < size.height; r++) {
        for (let c = 0; c < size.width; c++) {

            cells[r][c].bombCount = 0;
            cells[r][c].neighbors = [];

            if (cells[r][c].isBomb)
                continue;
            
            let min_row = clamp_in_size(r - 1, size.height - 1);
            let max_row = clamp_in_size(r + 1, size.height - 1);

            let min_col = clamp_in_size(c - 1, size.width - 1);
            let max_col = clamp_in_size(c + 1, size.width - 1);

            for (let cr = min_row; cr <= max_row; cr++) {
                for (let cc = min_col; cc <= max_col; cc++) {

                    if (cr === r && cc === c)
                        continue;

                    cells[r][c].bombCount += cells[cr][cc].isBomb ? 1 : 0;
                    cells[r][c].neighbors.push(cells[cr][cc]);
                }
            }
        }
    }
    
    cells[pos.row][pos.col].propagate([pos]);
    bombCountText.innerHTML = bombCount;
}

function clamp_in_size(n, mx) {
    return n < 0 ? 0 : n > mx ? mx : n;
}
