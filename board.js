var kTileSide = 50;
var g = this;
var TileType;
(function (TileType) {
    TileType[TileType["Water"] = 0] = "Water";
    TileType[TileType["Desert"] = 1] = "Desert";
    TileType[TileType["Gold"] = 2] = "Gold";
    TileType[TileType["Wood"] = 3] = "Wood";
    TileType[TileType["Clay"] = 4] = "Clay";
    TileType[TileType["Sheep"] = 5] = "Sheep";
    TileType[TileType["Ore"] = 6] = "Ore";
    TileType[TileType["Wheat"] = 7] = "Wheat";
    TileType[TileType["Undefined"] = 8] = "Undefined";
})(TileType || (TileType = {}));
var kTileColors = [];
kTileColors[0 /* Water */] = "#00B7FF";
kTileColors[1 /* Desert */] = "#FFF09E";
kTileColors[2 /* Gold */] = "#FFE100";
kTileColors[3 /* Wood */] = "#39AD43";
kTileColors[4 /* Clay */] = "#FF9100";
kTileColors[5 /* Sheep */] = "#BBFF00";
kTileColors[6 /* Ore */] = "#D1D1D1";
kTileColors[7 /* Wheat */] = "#FFFF00";
var kTileLetters = [];
kTileLetters[0 /* Water */] = "w";
kTileLetters[1 /* Desert */] = "d";
kTileLetters[2 /* Gold */] = "G";
kTileLetters[3 /* Wood */] = "W";
kTileLetters[4 /* Clay */] = "C";
kTileLetters[5 /* Sheep */] = "S";
kTileLetters[6 /* Ore */] = "O";
kTileLetters[7 /* Wheat */] = "H";
var kWeightsByNumber = [0, 0, 1, 2, 3, 4, 5, 0, 5, 4, 3, 2, 1, 0];
var allTileTypes = [0 /* Water */, 1 /* Desert */, 3 /* Wood */, 4 /* Clay */, 5 /* Sheep */, 6 /* Ore */, 7 /* Wheat */];
var interiorTileTypes = [1 /* Desert */, 2 /* Gold */, 3 /* Wood */, 4 /* Clay */, 5 /* Sheep */, 6 /* Ore */, 7 /* Wheat */];
var resourceTileTypes = [3 /* Wood */, 4 /* Clay */, 5 /* Sheep */, 6 /* Ore */, 7 /* Wheat */];
var GridLocation = (function () {
    function GridLocation(x, y, z) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (z === void 0) { z = 0; }
        this.x = x;
        this.y = y;
        this.z = z;
    }
    GridLocation.prototype.toScreenCoordinates = function () {
        // pointy-top:
        var x = kTileSide * Math.sqrt(3) * (this.x + this.y / 2);
        var y = kTileSide * 1.5 * this.y;
        return new Vec2(x, y);
    };
    GridLocation.prototype.distanceFrom = function (o) {
        return (Math.abs(this.x - o.x) + Math.abs(this.y - o.y) + Math.abs(this.z - o.z)) / 2;
    };
    return GridLocation;
})();
var Vec2 = (function () {
    function Vec2(x, y) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        this.x = x;
        this.y = y;
    }
    return Vec2;
})();
var Board = (function () {
    function Board(hexesXy) {
        this.hexesXy = hexesXy;
    }
    Board.prototype.getHexesXy = function () {
        return this.hexesXy;
    };
    Board.prototype.forEach = function (f, context) {
        var i = 0;
        for (var x = this.hexesXy.getLowerIndex(); x <= this.hexesXy.getUpperIndex(); x++) {
            var yLine = this.hexesXy.get(x);
            for (var y = yLine.getLowerIndex(); y <= yLine.getUpperIndex(); y++) {
                var hex = yLine.get(y);
                f.apply(context || this, [hex, i, x, y]);
                i++;
            }
        }
    };
    Board.prototype.forEachInterior = function (f, context) {
        var i = 0;
        for (var x = this.hexesXy.getLowerIndex() + 1; x <= this.hexesXy.getUpperIndex() - 1; x++) {
            var yLine = this.hexesXy.get(x);
            for (var y = yLine.getLowerIndex() + 1; y <= yLine.getUpperIndex() - 1; y++) {
                var hex = yLine.get(y);
                f.apply(context || this, [hex, i, x, y]);
                i++;
            }
        }
    };
    Board.prototype.clone = function () {
        var newHexesXy = new BoardDimension(this.hexesXy.getLowerIndex(), this.hexesXy.getUpperIndex());
        for (var x = newHexesXy.getLowerIndex(); x <= newHexesXy.getUpperIndex(); x++) {
            var yLine = this.hexesXy.get(x);
            var newYLine = new BoardDimension(yLine.getLowerIndex(), yLine.getUpperIndex());
            for (var y = yLine.getLowerIndex(); y <= yLine.getUpperIndex(); y++) {
                newYLine.put(y, yLine.get(y).clone());
            }
            newHexesXy.put(x, newYLine);
        }
        return new Board(newHexesXy);
    };
    Board.prototype.getTiles = function () {
        var result = new Array();
        this.forEach(function (tile) { return result.push(tile); });
        return result;
    };
    Board.prototype.getInteriorTiles = function () {
        var result = new Array();
        this.forEachInterior(function (tile) { return result.push(tile); });
        return result;
    };
    Board.prototype.getTile = function (x, y, z) {
        if (typeof (z) !== "undefined") {
            if (x + y + z !== 0) {
                throw new Error("Invalid tile coordinate!");
            }
        }
        var yLine = this.hexesXy.get(x);
        if (yLine === null) {
            return null;
        }
        else {
            return yLine.get(y);
        }
    };
    Board.prototype.getNeighbors = function (tile) {
        var neighbors = new Array();
        var candidates = [];
        var position = tile.getPosition();
        candidates.push(this.getTile(position.x + 1, position.y - 1, position.z));
        candidates.push(this.getTile(position.x + 1, position.y, position.z - 1));
        candidates.push(this.getTile(position.x - 1, position.y + 1, position.z));
        candidates.push(this.getTile(position.x - 1, position.y, position.z + 1));
        candidates.push(this.getTile(position.x, position.y + 1, position.z - 1));
        candidates.push(this.getTile(position.x, position.y - 1, position.z + 1));
        candidates.forEach(function (candidate) {
            if (candidate) {
                neighbors.push(candidate);
            }
        });
        return neighbors;
    };
    return Board;
})();
var BoardGenerator = (function () {
    function BoardGenerator() {
    }
    BoardGenerator.prototype.generateCircularBoard = function (n) {
        if (n === void 0) { n = 3; }
        var hexesXy = new BoardDimension(-n, n);
        for (var x = -n; x <= n; x++) {
            var minY = Math.max(-n, -x - n);
            var maxY = Math.min(n, -x + n);
            var hexesY = new BoardDimension(minY, maxY);
            for (var y = hexesY.getLowerIndex(); y <= hexesY.getUpperIndex(); y++) {
                var z = -x - y;
                var position = new GridLocation(x, y, z);
                var boundary = y === hexesY.getLowerIndex() || y === hexesY.getUpperIndex() || x === -n || x === n;
                hexesY.put(y, new Hex(position, boundary));
            }
            hexesXy.put(x, hexesY);
        }
        return new Board(hexesXy);
    };
    return BoardGenerator;
})();
var BoardDimension = (function () {
    function BoardDimension(minIndex, maxIndex) {
        this.minIndex = minIndex;
        this.maxIndex = maxIndex;
        this.arr = new Array(maxIndex - minIndex + 1);
    }
    BoardDimension.prototype.put = function (index, value) {
        this.arr[index - this.minIndex] = value;
    };
    BoardDimension.prototype.get = function (index) {
        if (this.minIndex <= index && index <= this.maxIndex) {
            return this.arr[index - this.minIndex];
        }
        else {
            return null;
        }
    };
    BoardDimension.prototype.getLowerIndex = function () {
        return this.minIndex;
    };
    BoardDimension.prototype.getUpperIndex = function () {
        return this.maxIndex;
    };
    return BoardDimension;
})();
var Hex = (function () {
    function Hex(position, boundary) {
        this.position = position;
        this.boundary = boundary;
        this.type = 8 /* Undefined */;
        this.number = 0;
    }
    Hex.prototype.isBoundary = function () {
        return this.boundary;
    };
    Hex.prototype.getPosition = function () {
        return this.position;
    };
    Hex.prototype.getType = function () {
        return this.type;
    };
    Hex.prototype.setType = function (value) {
        this.type = value;
    };
    Hex.prototype.getNumber = function () {
        return this.number;
    };
    Hex.prototype.setNumber = function (value) {
        this.number = value;
    };
    Hex.prototype.clone = function () {
        var newHex = new Hex(new GridLocation(this.position.x, this.position.y, this.position.z), this.boundary);
        newHex.setType(this.getType());
        newHex.setNumber(this.getNumber());
        return newHex;
    };
    return Hex;
})();
var BoardRenderer = (function () {
    function BoardRenderer(canvas, context) {
        this.canvas = canvas;
        this.context = context;
    }
    BoardRenderer.prototype.render = function (board, iterations, scrollingGraph) {
        var _this = this;
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, 100, 50);
        var fontSize = 20;
        this.context.fillStyle = "#000000";
        this.context.font = fontSize + "px 'segoe ui'";
        this.context.textAlign = 'left';
        this.context.fillText(iterations.toString(), 10, fontSize);
        this.context.stroke();
        this.context.setTransform(1, 0, 0, 1, 1000, 550);
        this.context.fillStyle = "#000000";
        var tilesByNumber = {};
        var tilesByType = {};
        board.forEachInterior(function (tile) {
            var tileNumber = tile.getNumber();
            var tileType = tile.getType();
            if (typeof (tilesByNumber[tileNumber]) === "undefined") {
                tilesByNumber[tileNumber] = [];
            }
            if (typeof (tilesByType[tileType]) === "undefined") {
                tilesByType[tileType] = [];
            }
            var numberGroup = tilesByNumber[tileNumber];
            numberGroup.push(tile);
            var typeGroup = tilesByType[tileType];
            typeGroup.push(tile);
        });
        for (var i = 2; i <= 12; i++) {
            var fontSize = 20;
            this.context.fillStyle = "#000000";
            this.context.textAlign = 'right';
            var rowY = fontSize * (i - 2);
            this.context.fillText(i.toString(), 0, rowY);
            this.context.stroke();
            var group = tilesByNumber[i] || [];
            if (group) {
                group.sort(function (a, b) {
                    if (a.getType() < b.getType()) {
                        return -1;
                    }
                    else if (a.getType() > b.getType()) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });
                for (var j = 0; j < group.length; j++) {
                    var tile = group[j];
                    this.context.fillStyle = kTileColors[tile.getType()];
                    this.context.fillRect(5 + j * 12, rowY - (fontSize - 10), 10, 10);
                }
            }
        }
        var maximumTypeCount = 1; // can't be 0 or div by 0
        for (var i = 0; i < interiorTileTypes.length; i++) {
            if (tilesByType[interiorTileTypes[i]]) {
                var group = tilesByType[interiorTileTypes[i]];
                var frequencySum = 0;
                for (var j = 0; j < group.length; j++) {
                    var tile = group[j];
                    frequencySum += kWeightsByNumber[tile.getNumber()];
                }
                if (maximumTypeCount < frequencySum) {
                    maximumTypeCount = frequencySum;
                }
            }
        }
        this.context.setTransform(1, 0, 0, 1, 1100, 500);
        var typeFrequencyGraphHeight = 100;
        this.context.fillStyle = "#444444";
        this.context.fillRect(0, 0, 100, typeFrequencyGraphHeight);
        for (var i = 0; i < interiorTileTypes.length; i++) {
            var fontSize = 20;
            this.context.fillStyle = "#000000";
            this.context.textAlign = 'left';
            var tileType = interiorTileTypes[i];
            var group = tilesByType[tileType] || [];
            var groupSum = 0;
            for (var j = 0; j < group.length; j++) {
                groupSum += kWeightsByNumber[group[j].getNumber()];
            }
            if (groupSum > maximumTypeCount) {
                alert("! " + groupSum + " " + maximumTypeCount);
            }
            this.context.fillStyle = kTileColors[tileType];
            var blockHeight = typeFrequencyGraphHeight * (groupSum / maximumTypeCount);
            this.context.fillRect(10 * i, typeFrequencyGraphHeight - blockHeight, 10, blockHeight);
        }
        this.context.setTransform(1, 0, 0, 1, 1100, 650);
        scrollingGraph.render(this.context, 0, 0, 200, 100);
        board.forEach(function (hex) {
            var position = hex.getPosition();
            var screenCoordinates = position.toScreenCoordinates();
            _this.context.fillStyle = kTileColors[hex.getType()] || "#FF00FF";
            _this.context.setTransform(1, 0, 0, 1, 500, 400);
            _this.context.strokeStyle = "#000000";
            _this.context.beginPath();
            _this.context.moveTo(screenCoordinates.x, screenCoordinates.y);
            _this.context.lineTo(screenCoordinates.x + kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2);
            _this.context.lineTo(screenCoordinates.x + kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2 + kTileSide);
            _this.context.lineTo(screenCoordinates.x, screenCoordinates.y + kTileSide * 2);
            _this.context.lineTo(screenCoordinates.x - kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2 + kTileSide);
            _this.context.lineTo(screenCoordinates.x - kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2);
            _this.context.lineTo(screenCoordinates.x, screenCoordinates.y);
            _this.context.closePath();
            _this.context.fill();
            _this.context.stroke();
            if (hex.getType() !== 0 /* Water */ && hex.getType() !== 1 /* Desert */) {
                var fontSize = 20;
                _this.context.fillStyle = "#000000";
                _this.context.font = fontSize + "px 'segoe ui'";
                _this.context.textAlign = 'center';
                _this.context.fillText(hex.getNumber().toString(), screenCoordinates.x, screenCoordinates.y + kTileSide + fontSize / 2);
                _this.context.stroke();
            }
            // Draw tiles lit by probability
            var weight = kWeightsByNumber[hex.getNumber()];
            var colorHex = (~~(255 * weight / 5)).toString(16);
            if (colorHex.length === 1)
                colorHex = "0" + colorHex;
            _this.context.fillStyle = "#" + colorHex + colorHex + colorHex;
            _this.context.setTransform(0.5, 0, 0, 0.5, 1150, 200);
            _this.context.strokeStyle = "#000000";
            _this.context.beginPath();
            _this.context.moveTo(screenCoordinates.x, screenCoordinates.y);
            _this.context.lineTo(screenCoordinates.x + kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2);
            _this.context.lineTo(screenCoordinates.x + kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2 + kTileSide);
            _this.context.lineTo(screenCoordinates.x, screenCoordinates.y + kTileSide * 2);
            _this.context.lineTo(screenCoordinates.x - kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2 + kTileSide);
            _this.context.lineTo(screenCoordinates.x - kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2);
            _this.context.lineTo(screenCoordinates.x, screenCoordinates.y);
            _this.context.closePath();
            _this.context.fill();
            _this.context.stroke();
        }, this);
    };
    return BoardRenderer;
})();
var IterationResult = (function () {
    function IterationResult(board, score) {
        this.board = board;
        this.score = score;
    }
    return IterationResult;
})();
var MapGenerator = (function () {
    function MapGenerator() {
    }
    MapGenerator.prototype.randomizeBoard = function (board, interiorWaterFraction) {
        if (interiorWaterFraction === void 0) { interiorWaterFraction = 0.0; }
        var desertCount = 2;
        var interiorTileCount = 0;
        board.forEachInterior(function (tile) { return interiorTileCount++; });
        board.forEach(function (tile) {
            if (tile.isBoundary())
                tile.setType(0 /* Water */);
        });
        var waterTileCount = ~~(interiorWaterFraction * interiorTileCount);
        var nonwaterTileCount = interiorTileCount - waterTileCount;
        var resourceTileCount = interiorTileCount - waterTileCount - desertCount;
        var numberNormalize = 0.8;
        var numbers = [];
        for (var i = 0; i < ~~(resourceTileCount * numberNormalize); i++) {
            var number = i % 10 + 2;
            if (number >= 7)
                number++;
            numbers.push(number);
        }
        while (numbers.length < resourceTileCount) {
            var number = ~~(Math.random() * 10) + 2;
            if (number >= 7)
                number++;
            numbers.push(number);
        }
        if (numbers.length != resourceTileCount) {
            throw new Error("Check number distribution code: " + numbers.length + " " + resourceTileCount);
        }
        var types = [1 /* Desert */, 1 /* Desert */, 2 /* Gold */, 2 /* Gold */, 2 /* Gold */];
        var typeNormalize = 0.8;
        var requiredTilesPerType = ~~(typeNormalize * (nonwaterTileCount - types.length) / resourceTileTypes.length);
        for (var i = 0; i < resourceTileTypes.length; i++) {
            for (var j = 0; j < requiredTilesPerType; j++) {
                types.push(resourceTileTypes[i]);
            }
        }
        while (types.length < nonwaterTileCount) {
            types.push(resourceTileTypes[~~(Math.random() * resourceTileTypes.length)]);
        }
        if (types.length != nonwaterTileCount) {
            throw new Error("Check nonwater distribution code: " + types.length + " " + nonwaterTileCount);
        }
        shuffle(numbers);
        shuffle(types);
        for (var i = 0; i < waterTileCount; i++) {
            types.push(0 /* Water */);
        }
        shuffle(types);
        if (types.length != interiorTileCount) {
            throw new Error("Check distribution code: " + types.length + " " + interiorTileCount);
        }
        var numberIndex = 0;
        board.forEachInterior(function (tile, i) {
            tile.setType(types[i]);
            if (types[i] === 0 /* Water */ || types[i] === 1 /* Desert */) {
                tile.setNumber(0);
            }
            else {
                tile.setNumber(numbers[numberIndex++]);
            }
        });
    };
    MapGenerator.prototype.getBoardEdgeTiles = function (board) {
        var edgeTiles = new Array();
        board.forEach(function (tile) {
            var neighbors = board.getNeighbors(tile);
            var hasWaterNeighbor = false;
            neighbors.forEach(function (n) {
                if (n.getType() === 0 /* Water */) {
                    hasWaterNeighbor = true;
                }
            });
            if (hasWaterNeighbor && tile.getType() != 0 /* Water */) {
                edgeTiles.push(tile);
            }
        });
        return edgeTiles;
    };
    MapGenerator.prototype.iterateBoard = function (board, iterations) {
        if (iterations === void 0) { iterations = 10; }
        var initialTiles = board.getTiles();
        var edgeTiles = this.getBoardEdgeTiles(board);
        var initialScore = this.scoreBoard(board, initialTiles);
        var bestScore = initialScore;
        for (var i = 0; i < iterations; i++) {
            var clone = board.clone();
            var cloneTiles = clone.getTiles();
            var cloneInteriorTiles = clone.getInteriorTiles();
            this.iterateBoardDispatcher(clone, cloneInteriorTiles);
            var cloneScore = this.scoreBoard(clone, cloneTiles);
            if (cloneScore < bestScore) {
                board = clone;
                bestScore = cloneScore;
            }
        }
        console.log("Iterated from " + initialScore + " to " + bestScore);
        return new IterationResult(board, bestScore);
    };
    MapGenerator.prototype.iterateBoardDispatcher = function (board, interiorTiles) {
        var operations = [
            this.iterateBoardSwapNumbers,
            this.iterateBoardSwapTypes
        ];
        operations[~~(Math.random() * operations.length)](board, interiorTiles);
    };
    MapGenerator.prototype.iterateBoardSwapNumbers = function (board, interiorTiles) {
        var first = interiorTiles[~~(Math.random() * interiorTiles.length)];
        var second = interiorTiles[~~(Math.random() * interiorTiles.length)];
        if (first.getType() === 0 /* Water */ || second.getType() === 0 /* Water */ || first.getType() === 1 /* Desert */ || second.getType() === 1 /* Desert */) {
            return;
        }
        var temp = first.getNumber();
        first.setNumber(second.getNumber());
        second.setNumber(temp);
    };
    MapGenerator.prototype.iterateBoardSwapTypes = function (board, interiorTiles) {
        var first = interiorTiles[~~(Math.random() * interiorTiles.length)];
        var second = interiorTiles[~~(Math.random() * interiorTiles.length)];
        if (first.getType() === 0 /* Water */ || second.getType() === 0 /* Water */) {
            return;
        }
        if (first.getType() === 1 /* Desert */ || second.getType() === 1 /* Desert */) {
            var firstValue = first.getNumber();
            first.setNumber(second.getNumber());
            second.setNumber(firstValue);
        }
        var temp = first.getType();
        first.setType(second.getType());
        second.setType(temp);
    };
    MapGenerator.prototype.scoreBoard = function (board, interiorTiles) {
        var _this = this;
        var kWeightsByNumber = [-1, -1, 1, 2, 3, 4, 5, -1, 5, 4, 3, 2, 1, -1];
        var score = 0;
        interiorTiles.forEach(function (tileA) {
            var hexPower = 0;
            interiorTiles.forEach(function (tileB) {
                if (tileA !== tileB) {
                    var weight = kWeightsByNumber[tileA.getNumber()] * kWeightsByNumber[tileB.getNumber()];
                    var multiplier = _this.rateHexPair(tileA, tileB);
                    hexPower += Math.pow(weight * multiplier, 2);
                }
            }, _this);
            score += hexPower; //Math.pow(hexPower, 2);
        }, this);
        return score;
    };
    MapGenerator.prototype.rateHexPair = function (a, b) {
        if (a.getType() > b.getType()) {
            return this.rateHexPair(b, a);
        }
        var distance = a.getPosition().distanceFrom(b.getPosition());
        if (distance > 3) {
            return 0;
        }
        var weight = 1 / Math.pow(a.getPosition().distanceFrom(b.getPosition()), 2);
        var aType = a.getType();
        var bType = b.getType();
        /* Desert, Wood, Clay, Sheep, Ore, Wheat
           Road = Wood Clay
           Settlement = Clay Wood Wheat Sheep
           City = Wheat Wheat Ore Ore Ore
           Dev = Sheap Wheat Ore
        */
        var multiplier = 1;
        if (aType === bType) {
            if (aType === 2 /* Gold */) {
                multiplier = 100.0;
            }
            else if (aType === 3 /* Wood */) {
                multiplier = 1.8;
            }
            else if (aType === 5 /* Sheep */) {
                multiplier = 2.8;
            }
            else if (aType === 7 /* Wheat */) {
                multiplier = 2.5;
            }
            else if (aType === 6 /* Ore */) {
                multiplier = 2.8;
            }
            else if (aType === 4 /* Clay */) {
                multiplier = 1.8;
            }
        }
        else if (aType === 3 /* Wood */ && bType === 4 /* Clay */) {
            multiplier = 1.8;
        }
        else if (aType === 6 /* Ore */ && bType === 7 /* Wheat */) {
            multiplier = 1.8;
        }
        else if (aType === 1 /* Desert */) {
            multiplier = 0.0;
        }
        else if (aType === 0 /* Water */) {
            multiplier = 3;
        }
        else if (aType === 2 /* Gold */) {
            multiplier = 1.2;
        }
        else if (aType === 5 /* Sheep */ && (bType === 7 /* Wheat */ || bType === 6 /* Ore */)) {
            multiplier = 1.2;
        }
        if (a.getNumber() === b.getNumber() && distance === 1) {
            multiplier *= 20;
        }
        return 1 + multiplier * weight;
    };
    return MapGenerator;
})();
var SlidingGraph = (function () {
    function SlidingGraph(width, height) {
        this.width = width;
        this.height = height;
        this.currentX = 0;
        this.scale = 1;
        this.isSliding = false;
        this.canvas = document.createElement("canvas");
        this.canvas.width = width + "";
        this.canvas.height = width + "";
        this.context = this.canvas.getContext("2d");
    }
    SlidingGraph.prototype.push = function (value) {
        if (value > this.scale) {
            var ratio = this.scale / value;
            var rescaledHeight = ~~(this.height * ratio);
            this.context.drawImage(this.canvas, 0, this.height - rescaledHeight, this.width, rescaledHeight);
            this.scale = value;
        }
        this.context.fillStyle = "#FFFFFF";
        this.context.fillRect(this.currentX, 0, 1, this.height);
        var renderedHeight = this.height * (value / this.scale);
        this.context.fillStyle = "#000000";
        this.context.fillRect(this.currentX, this.height - renderedHeight, 1, renderedHeight);
        this.currentX++;
        if (this.currentX > this.width) {
            this.currentX = 0;
            this.isSliding = true;
        }
    };
    SlidingGraph.prototype.render = function (ctx, x, y, w, h) {
        if (!this.isSliding) {
            ctx.drawImage(this.canvas, 0, 0, this.width, this.height, x, y, w, h);
        }
        else {
            ctx.drawImage(this.canvas, this.currentX + 1, 0, this.width - this.currentX - 1, this.height, x, y, w * (this.width - this.currentX) / this.width, h); // * (1 - (this.currentX / this.width)), h);
            ctx.drawImage(this.canvas, 0, 0, this.currentX, this.height, x + w * (this.width - this.currentX) / this.width, y, w * (this.currentX / this.width), h);
        }
    };
    return SlidingGraph;
})();
var Application = (function () {
    function Application(canvas) {
        this.canvas = canvas;
    }
    Application.prototype.run = function () {
        this.context = this.canvas.getContext("2d");
        var boardGenerator = new BoardGenerator();
        var board = boardGenerator.generateCircularBoard(5);
        var mapGenerator = new MapGenerator();
        mapGenerator.randomizeBoard(board, 0.5);
        var boardRenderer = new BoardRenderer(this.canvas, this.context);
        var scrollingGraph = new SlidingGraph(200, 100);
        var iterations = 0;
        g.board = board;
        setInterval(function () {
            var iterationsPerFrame = 10;
            var iterationResult = mapGenerator.iterateBoard(board, iterationsPerFrame);
            board = iterationResult.board;
            scrollingGraph.push(iterationResult.score);
            iterations += iterationsPerFrame;
            boardRenderer.render(board, iterations, scrollingGraph);
        }, 1);
    };
    return Application;
})();
function shuffle(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x)
        ;
    return o;
}
;
