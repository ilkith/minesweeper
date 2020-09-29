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

            cells[r][c].onclick = function (dontHighlightNeighbors) {
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
                    this.innerHTML = this.bombText || this.bombCount || "";
                    this.classList.add(`b-${this.bombText ? Number(this.bombText[0]) : this.bombCount}`)
                }
                else {
                    cells.forEach(r => {
                        r.forEach(c => {
                            c.classList.remove("hidden-cell");

                            const css = c.isBomb ? "bomb-cell" : "clicked-cell";
                            c.classList.add(css);

                            if (!c.isBomb) {
                                c.classList.add(`b-${c.bombText ? Number(c.bombText[0]) : c.bombCount}`)
                                c.innerHTML = c.bombText || c.bombCount || ""
                            }

                            c.state = CellState.CLICKED;

                            c.onclick = function() {}
                            c.ondblclick = function() {}
                            c.oncontextmenu = () => false
                        })
                    })
                }
                
                if (this.bombCount === 0)
                    this.neighbors.forEach(n => n.propagate([this.pos]))

                if (!dontHighlightNeighbors)
                    cells[r][c].neighbors.forEach(n => n.classList.add("neighboring-cell"))
                
                const hidden_neigh = this.neighbors.filter(x => x.state === CellState.HIDDEN)
                const flagged = this.neighbors.filter(x => x.state === CellState.FLAGGED)
                if (this.bombCount === hidden_neigh.length + flagged.length && flagged.length < this.bombCount) {
                    hidden_neigh.forEach(n => n.oncontextmenu())
                }
            }

            cells[r][c].ondblclick = function () {
                let nbc = 0
                let tbc = 0
                this.neighbors.forEach(n => nbc += (n.state === CellState.FLAGGED ? 1 : 0))
                this.neighbors.forEach(n => tbc += (n.isBomb ? 1 : 0))

                if (nbc === tbc)
                    this.neighbors.forEach(n => { if(n.state !== CellState.FLAGGED && n.state !== CellState.CLICKED)n.onclick(true) })
                
                if (this.bombText && Number(this.bombText[0]) === nbc)
                    this.neighbors.forEach(n => { if(n.state !== CellState.FLAGGED && n.state !== CellState.CLICKED)n.onclick(true) })
            }

            cells[r][c].oncontextmenu = function () {
                if (this.state === CellState.CLICKED)
                    return false;
                
                if (this.state === CellState.FLAGGED) {
                    this.classList.remove("flagged-cell");
                    
                    this.state = CellState.HIDDEN;
                    bombCount++;
                    bombCountText.innerHTML = bombCount;
                    return false;
                }

                this.state = CellState.FLAGGED;
                bombCount--;
                bombCountText.innerHTML = bombCount;

                this.classList.add("flagged-cell");

                return false;
            }

            cells[r][c].propagate = function(pos) {
                this.classList.remove("hidden-cell");
                this.classList.add("clicked-cell");
                this.classList.add(`b-${(this.bombText && this.bombText[0]) || this.bombCount}`)
                this.state = CellState.CLICKED;

                if (!this.isBomb)
                    this.innerHTML = this.bombText || this.bombCount || "";

                if (this.bombCount === 0)
                    this.neighbors.forEach(n => {
                        
                        let hasPropagated = pos.find(p => p.row === n.pos.row && p.col === n.pos.col)

                        if (!hasPropagated) {
                            pos.push(this.pos)
                            n.propagate(pos)
                        }
                    })
                
                const hidden_neigh = this.neighbors.filter(x => x.state === CellState.HIDDEN)
                const flagged = this.neighbors.filter(x => x.state === CellState.FLAGGED)
                if (this.bombCount === hidden_neigh.length + flagged.length && flagged.length < this.bombCount) {
                    hidden_neigh.forEach(n => n.oncontextmenu())
                    
                }
            }

            cells[r][c].autocheckbombs = () => {
                const hidden_neigh = this.neighbors.filter(x => x.state === CellState.HIDDEN)
                const flagged = this.neighbors.filter(x => x.state === CellState.FLAGGED)
                if (this.bombCount === hidden_neigh.length && flagged.length < this.bombCount)
                    hidden_neigh.forEach(n => n.oncontextmenu())
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

            if (cells[r][c].bombCount > 0 && Math.random() < .15)
                cells[r][c].bombText = `${(Math.random() < .3 ? cells[r][c].bombCount : Math.random() < .3 ? clamp_17(cells[r][c].bombCount+1) : clamp_17(cells[r][c].bombCount-1) )}?`
        }
    }
    
    cells[pos.row][pos.col].propagate([pos]);
    bombCountText.innerHTML = bombCount;
}

function clamp_in_size(n, mx) {
    return n < 0 ? 0 : n > mx ? mx : n;
}

function clamp_17(n) {
    return n <= 0 ? 1 : n >= 8 ? 7 : n
}
