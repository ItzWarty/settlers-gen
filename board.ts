﻿var kTileSide: number = 50;
var g = this;

enum TileType {
   Water,
   Desert,
   Gold,
   Wood,
   Clay,
   Sheep,
   Ore,
   Wheat,
   Undefined
}

var kTileColors = [];
kTileColors[TileType.Water]  = "#00B7FF";
kTileColors[TileType.Desert] = "#FFF09E";
kTileColors[TileType.Gold]   = "#FFE100";
kTileColors[TileType.Wood]   = "#39AD43";
kTileColors[TileType.Clay]   = "#FF9100";
kTileColors[TileType.Sheep]  = "#BBFF00";
kTileColors[TileType.Ore]    = "#D1D1D1";
kTileColors[TileType.Wheat] = "#FFFF00";

var kTileLetters = [];
kTileLetters[TileType.Water] = "w";
kTileLetters[TileType.Desert] = "d";
kTileLetters[TileType.Gold] = "G";
kTileLetters[TileType.Wood] = "W";
kTileLetters[TileType.Clay] = "C";
kTileLetters[TileType.Sheep] = "S";
kTileLetters[TileType.Ore] = "O";
kTileLetters[TileType.Wheat] = "H";

var kWeightsByNumber = [0, 0, 1, 2, 3, 4, 5, 0, 5, 4, 3, 2, 1, 0];

var allTileTypes = [TileType.Water, TileType.Desert, TileType.Wood, TileType.Clay, TileType.Sheep, TileType.Ore, TileType.Wheat];
var interiorTileTypes = [TileType.Desert, TileType.Gold, TileType.Wood, TileType.Clay, TileType.Sheep, TileType.Ore, TileType.Wheat];
var resourceTileTypes = [TileType.Wood, TileType.Clay, TileType.Sheep, TileType.Ore, TileType.Wheat];

class GridLocation {
   constructor(
      public x: number = 0,
      public y: number = 0,
      public z: number = 0
   ) { }

   public toScreenCoordinates(): Vec2 {
      // pointy-top:
      var x = kTileSide * Math.sqrt(3) * (this.x + this.y / 2);
      var y = kTileSide * 1.5 * this.y;
      return new Vec2(x, y);
   }

   public distanceFrom(o: GridLocation): number {
      return (Math.abs(this.x - o.x) + Math.abs(this.y - o.y) + Math.abs(this.z - o.z)) / 2;
   }
}

class Vec2 {
   constructor(
      public x: number = 0,
      public y: number = 0
   ) { }
}

class Board {
   constructor(private hexesXy: BoardDimension<BoardDimension<Hex>>) { }

   public getHexesXy() { return this.hexesXy; }

   public forEach(f, context?: any): void {
      var i = 0;
      for (var x = this.hexesXy.getLowerIndex(); x <= this.hexesXy.getUpperIndex(); x++) {
         var yLine = this.hexesXy.get(x);
         for (var y = yLine.getLowerIndex(); y <= yLine.getUpperIndex(); y++) {
            var hex = yLine.get(y);
            f.apply(context || this, [hex, i, x, y]);
            i++;
         }
      }
   }

   public forEachInterior(f, context?: any): void {
      var i = 0;
      for (var x = this.hexesXy.getLowerIndex() + 1; x <= this.hexesXy.getUpperIndex() - 1; x++) {
         var yLine = this.hexesXy.get(x);
         for (var y = yLine.getLowerIndex() + 1; y <= yLine.getUpperIndex() - 1; y++) {
            var hex = yLine.get(y);
            f.apply(context || this, [hex, i, x, y]);
            i++;
         }
      }
   }

   public clone(): Board {
      var newHexesXy = new BoardDimension<BoardDimension<Hex>>(this.hexesXy.getLowerIndex(), this.hexesXy.getUpperIndex());
      for (var x = newHexesXy.getLowerIndex(); x <= newHexesXy.getUpperIndex(); x++) {
         var yLine = this.hexesXy.get(x);
         var newYLine = new BoardDimension<Hex>(yLine.getLowerIndex(), yLine.getUpperIndex());
         for (var y = yLine.getLowerIndex(); y <= yLine.getUpperIndex(); y++) {
            newYLine.put(y, yLine.get(y).clone());
         }
         newHexesXy.put(x, newYLine);
      }
      return new Board(newHexesXy);
   }

   public getTiles(): Array<Hex> {
      var result = new Array<Hex>();
      this.forEach(tile => result.push(tile));
      return result;
   }

   public getInteriorTiles(): Array<Hex> {
      var result = new Array<Hex>();
      this.forEachInterior(tile => result.push(tile));
      return result;
   }

   public getTile(x: number, y: number, z?: number): Hex {
      if (typeof(z) !== "undefined") {
         if (x + y + z !== 0) {
            throw new Error("Invalid tile coordinate!");
         }
      }

      var yLine = this.hexesXy.get(x);
      if (yLine === null) {
         return null;
      } else {
         return yLine.get(y);
      }
   }

   public getNeighbors(tile: Hex): Array<Hex> {
      var neighbors = new Array<Hex>();
      var candidates = [];
      var position = tile.getPosition();
      candidates.push(this.getTile(position.x + 1, position.y - 1, position.z));
      candidates.push(this.getTile(position.x + 1, position.y, position.z - 1));
      candidates.push(this.getTile(position.x - 1, position.y + 1, position.z));
      candidates.push(this.getTile(position.x - 1, position.y, position.z + 1));
      candidates.push(this.getTile(position.x, position.y + 1, position.z - 1));
      candidates.push(this.getTile(position.x, position.y - 1, position.z + 1));
      candidates.forEach(candidate => {
         if (candidate) {
            neighbors.push(candidate);
         }
      });
      return neighbors;
   }
}

class BoardGenerator {
   public generateCircularBoard(n: number = 3): Board {
      var hexesXy = new BoardDimension<BoardDimension<Hex>>(-n, n);
      for (var x = -n; x <= n; x++) {
         var minY = Math.max(-n, -x - n);
         var maxY = Math.min(n, -x + n);
         var hexesY = new BoardDimension<Hex>(minY, maxY);
         for (var y = hexesY.getLowerIndex(); y <= hexesY.getUpperIndex(); y++) {
            var z = - x - y;
            var position = new GridLocation(x, y, z);
            var boundary = y === hexesY.getLowerIndex() || y === hexesY.getUpperIndex() || x === -n || x === n;
            hexesY.put(y, new Hex(position, boundary));
         }
         hexesXy.put(x, hexesY);
      }
      return new Board(hexesXy);
   }
}

class BoardDimension<T> {
   private arr: Array<T>;

   constructor(
      private minIndex: number,
      private maxIndex: number
   ) {
      this.arr = new Array<T>(maxIndex - minIndex + 1);
   }

   public put(index: number, value: T) {
      this.arr[index - this.minIndex] = value;
   }

   public get(index: number) {
      if (this.minIndex <= index && index <= this.maxIndex) {
         return this.arr[index - this.minIndex];
      } else {
         return null;
      }
   }

   public getLowerIndex(): number { return this.minIndex; }
   public getUpperIndex(): number { return this.maxIndex; }
}

class Hex {
   private type: TileType = TileType.Undefined;
   private number: number = 0;

   constructor(private position: GridLocation, private boundary: Boolean) { }

   public isBoundary(): Boolean { return this.boundary; }
   public getPosition(): GridLocation { return this.position; }
   public getType(): TileType { return this.type; }
   public setType(value: TileType): void { this.type = value; }
   public getNumber(): number { return this.number; }
   public setNumber(value: number): void { this.number = value; }

   public clone(): Hex {
      var newHex = new Hex(new GridLocation(this.position.x, this.position.y, this.position.z), this.boundary);
      newHex.setType(this.getType());
      newHex.setNumber(this.getNumber());
      return newHex;
   }
}

class BoardRenderer {
   constructor(private canvas: any, private context: any) {
      
   }

   public render(board: Board, iterations: number, scrollingGraph: SlidingGraph): void {
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
      board.forEachInterior(
         tile => {
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
         }
      )
      for (var i = 2; i <= 12; i++) {
         var fontSize = 20;
         this.context.fillStyle = "#000000";
         this.context.textAlign = 'right';
         var rowY = fontSize * (i - 2);
         this.context.fillText(i.toString(), 0, rowY);
         this.context.stroke();
         var group = tilesByNumber[i] || [];
         if (group) {
            group.sort((a, b) => {
               if (a.getType() < b.getType()) {
                  return -1;
               } else if (a.getType() > b.getType()) {
                  return 1;
               } else {
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

      board.forEach(
         (hex) => {
            var position = hex.getPosition();
            var screenCoordinates = position.toScreenCoordinates();
            this.context.fillStyle = kTileColors[hex.getType()] || "#FF00FF";
            this.context.setTransform(1, 0, 0, 1, 500, 400);

            this.context.strokeStyle = "#000000";
            this.context.beginPath();
            this.context.moveTo(screenCoordinates.x, screenCoordinates.y);
            this.context.lineTo(screenCoordinates.x + kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2);
            this.context.lineTo(screenCoordinates.x + kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2 + kTileSide);
            this.context.lineTo(screenCoordinates.x, screenCoordinates.y + kTileSide * 2);
            this.context.lineTo(screenCoordinates.x - kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2 + kTileSide);
            this.context.lineTo(screenCoordinates.x - kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2);
            this.context.lineTo(screenCoordinates.x, screenCoordinates.y);
            this.context.closePath();
            this.context.fill();
            this.context.stroke();

            if (hex.getType() !== TileType.Water && hex.getType() !== TileType.Desert) {
               var fontSize = 20;
               this.context.fillStyle = "#000000";
               this.context.font = fontSize + "px 'segoe ui'";
               this.context.textAlign = 'center';
               this.context.fillText(hex.getNumber().toString(), screenCoordinates.x, screenCoordinates.y + kTileSide + fontSize / 2);
               this.context.stroke();
            }

            // Draw tiles lit by probability
            var weight = kWeightsByNumber[hex.getNumber()];
            var colorHex = (~~(255 * weight / 5)).toString(16);
            if (colorHex.length === 1) colorHex = "0" + colorHex;
            this.context.fillStyle = "#" + colorHex + colorHex + colorHex;
            this.context.setTransform(0.5, 0, 0, 0.5, 1150, 200);
            this.context.strokeStyle = "#000000";
            this.context.beginPath();
            this.context.moveTo(screenCoordinates.x, screenCoordinates.y);
            this.context.lineTo(screenCoordinates.x + kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2);
            this.context.lineTo(screenCoordinates.x + kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2 + kTileSide);
            this.context.lineTo(screenCoordinates.x, screenCoordinates.y + kTileSide * 2);
            this.context.lineTo(screenCoordinates.x - kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2 + kTileSide);
            this.context.lineTo(screenCoordinates.x - kTileSide * Math.sqrt(3) / 2, screenCoordinates.y + kTileSide / 2);
            this.context.lineTo(screenCoordinates.x, screenCoordinates.y);
            this.context.closePath();
            this.context.fill();
            this.context.stroke();

         }, this
      );
   }
}

class IterationResult {
   constructor(
      public board: Board,
      public score: number
   ) { }
}

class MapGenerator {
   public randomizeBoard(board: Board, interiorWaterFraction: number = 0.0): void {
      var desertCount = 2;
      var interiorTileCount = 0;
      board.forEachInterior(tile => interiorTileCount++);
      board.forEach(tile => { if (tile.isBoundary()) tile.setType(TileType.Water); });
      var waterTileCount = ~~(interiorWaterFraction * interiorTileCount);
      var nonwaterTileCount = interiorTileCount - waterTileCount;
      var resourceTileCount = interiorTileCount - waterTileCount - desertCount;

      var numberNormalize = 0.8;
      var numbers = [];
      for (var i = 0; i < ~~(resourceTileCount * numberNormalize); i++) {
         var number = i % 10 + 2;
         if (number >= 7) number++;
         numbers.push(number);
      }

      while (numbers.length < resourceTileCount) {
         var number = ~~(Math.random() * 10) + 2;
         if (number >= 7) number++;
         numbers.push(number);
      }
      if (numbers.length != resourceTileCount) {
         throw new Error("Check number distribution code: " + numbers.length + " " + resourceTileCount);
      }

      var types = [TileType.Desert, TileType.Desert, TileType.Gold, TileType.Gold, TileType.Gold];
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
         types.push(TileType.Water);
      }
      shuffle(types);
      
      if (types.length != interiorTileCount) {
         throw new Error("Check distribution code: " + types.length + " " + interiorTileCount);
      }

      var numberIndex = 0;
      board.forEachInterior(
         (tile, i) => {
            tile.setType(types[i]);
            if (types[i] === TileType.Water || types[i] === TileType.Desert) {
               tile.setNumber(0);
            } else {
               tile.setNumber(numbers[numberIndex++]);
            }
         });
   }

   private getBoardEdgeTiles(board: Board) {
      var edgeTiles = new Array<Hex>();
      board.forEach(tile => {
         var neighbors = board.getNeighbors(tile);
         var hasWaterNeighbor = false;
         neighbors.forEach(n => {
            if (n.getType() === TileType.Water) {
               hasWaterNeighbor = true;
            }
         });
         if (hasWaterNeighbor && tile.getType() != TileType.Water) {
            edgeTiles.push(tile);
         }
      });
      return edgeTiles;
   }
   
   public iterateBoard(board: Board, iterations: number = 10): IterationResult {
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
   }

   public iterateBoardDispatcher(board: Board, interiorTiles: Array<Hex>) {
      var operations = [
         this.iterateBoardSwapNumbers,
         this.iterateBoardSwapTypes
      ];
      operations[~~(Math.random() * operations.length)](board, interiorTiles);
   }

   public iterateBoardSwapNumbers(board: Board, interiorTiles: Array<Hex>) {
      var first = interiorTiles[~~(Math.random() * interiorTiles.length)];
      var second = interiorTiles[~~(Math.random() * interiorTiles.length)];

      if (first.getType() === TileType.Water || second.getType() === TileType.Water || 
          first.getType() === TileType.Desert || second.getType() === TileType.Desert) {
         return;
      }

      var temp = first.getNumber();
      first.setNumber(second.getNumber());
      second.setNumber(temp);
   }

   public iterateBoardSwapTypes(board: Board, interiorTiles: Array<Hex>) {
      var first = interiorTiles[~~(Math.random() * interiorTiles.length)];
      var second = interiorTiles[~~(Math.random() * interiorTiles.length)];

      if (first.getType() === TileType.Water || second.getType() === TileType.Water) {
         return;
      }

      if (first.getType() === TileType.Desert || second.getType() === TileType.Desert) {
         var firstValue = first.getNumber();
         first.setNumber(second.getNumber());
         second.setNumber(firstValue);
      }

      var temp = first.getType();
      first.setType(second.getType());
      second.setType(temp);
   }

   public scoreBoard(board: Board, interiorTiles: Array<Hex>): number {
      var kWeightsByNumber = [-1, -1, 1, 2, 3, 4, 5, -1, 5, 4, 3, 2, 1, -1];
      var score = 0;
      interiorTiles.forEach(tileA => {
         var hexPower = 0;
         interiorTiles.forEach(tileB => {
            if (tileA !== tileB) {
               var weight = kWeightsByNumber[tileA.getNumber()] * kWeightsByNumber[tileB.getNumber()];
               var multiplier = this.rateHexPair(tileA, tileB);
               hexPower += Math.pow(weight * multiplier, 2);
            }
         }, this);
         score += hexPower;  //Math.pow(hexPower, 2);
      }, this);
      return score;
   }

   private rateHexPair(a: Hex, b: Hex) {
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
         if (aType === TileType.Gold) {
            multiplier = 100.0;
         } else if (aType === TileType.Wood) {
            multiplier = 1.8;
         } else if (aType === TileType.Sheep) {
            multiplier = 2.8;
         } else if (aType === TileType.Wheat) {
            multiplier = 2.5;
         } else if (aType === TileType.Ore) {
            multiplier = 2.8;
         } else if (aType === TileType.Clay) {
            multiplier = 1.8;
         }
      } else if (aType === TileType.Wood && bType === TileType.Clay) {
         multiplier = 1.8;
      } else if (aType === TileType.Ore && bType === TileType.Wheat) {
         multiplier = 1.8;
      } else if (aType === TileType.Desert) {
         multiplier = 0.0;
      } else if (aType === TileType.Water) {
         multiplier = 3;
//         multiplier = 8.0;
      } else if (aType === TileType.Gold) {
         multiplier = 1.2;
      } else if (aType === TileType.Sheep && (bType === TileType.Wheat || bType === TileType.Ore)) {
         multiplier = 1.2;
      }

      if (a.getNumber() === b.getNumber() && distance === 1) {
         multiplier *= 20;
      }
      return 1 + multiplier * weight;
   }
}

class SlidingGraph {
   private canvas: any;
   private context: any;
   private currentX: number = 0;
   private scale: number = 1;
   private isSliding: boolean = false;

   constructor(private width: number, private height: number) {
      this.canvas = document.createElement("canvas");
      this.canvas.width = width + "";
      this.canvas.height = width + "";
      this.context = this.canvas.getContext("2d");
   }

   public push(value: number) {
      if (value > this.scale) {
         var ratio = this.scale / value;
         var rescaledHeight = ~~(this.height * ratio);
         this.context.drawImage(this.canvas, 0, this.height - rescaledHeight, this.width, rescaledHeight);
         this.scale = value;
      }
      
      this.context.fillStyle = "#FFFFFF"
      this.context.fillRect(this.currentX, 0, 1, this.height);
      var renderedHeight = this.height * (value / this.scale);
      this.context.fillStyle = "#000000";
      this.context.fillRect(this.currentX, this.height - renderedHeight, 1, renderedHeight);
      this.currentX++;
      if (this.currentX > this.width) {
         this.currentX = 0;
         this.isSliding = true;
      }
   }

   public render(ctx, x, y, w, h) {
      if (!this.isSliding) {
         ctx.drawImage(this.canvas, 0, 0, this.width, this.height, x, y, w, h);
      } else {
         ctx.drawImage(this.canvas, this.currentX + 1, 0, this.width - this.currentX - 1, this.height, x, y, w * (this.width - this.currentX) / this.width, h); // * (1 - (this.currentX / this.width)), h);
         ctx.drawImage(this.canvas, 0, 0, this.currentX, this.height, x + w * (this.width - this.currentX) / this.width, y, w * (this.currentX / this.width), h);
      }
   }
}

class Application {
   private context: any;

   constructor(private canvas: any) { }

   public run() {
      this.context = this.canvas.getContext("2d");

      var boardGenerator = new BoardGenerator();
      var board = boardGenerator.generateCircularBoard(5);
      var mapGenerator = new MapGenerator();
      mapGenerator.randomizeBoard(board, 0.5);
      var boardRenderer = new BoardRenderer(this.canvas, this.context);
      var scrollingGraph = new SlidingGraph(200, 100);

      var iterations = 0;
      g.board = board;
      setInterval(
         function() {
            var iterationsPerFrame = 10;
            var iterationResult = mapGenerator.iterateBoard(board, iterationsPerFrame);
            board = iterationResult.board;
            scrollingGraph.push(iterationResult.score);
            iterations += iterationsPerFrame;
            boardRenderer.render(board, iterations, scrollingGraph);
         }, 1);
   }
}

function shuffle(o) {
   for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
   return o;
};