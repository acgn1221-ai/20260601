/*
----- 《引流解謎遊戲：拯救小魚》視覺細化高質感版 ----- 
*/

let grid = [];
let cols = 50;
let rows = 40;
let size; 

let currentLevel = 1;
let waterCount = 0;
let winTarget = 100; 
let levelWon = false;
let nextBtn;

function setup() {
  // 固定畫布大小
  createCanvas(640, 480);
  size = width / cols;
  
  // 建立切換關卡按鈕
  nextBtn = createButton('切換下一關');
  nextBtn.position(10, 80);
  nextBtn.mousePressed(goToNextLevel);

  initLevel(currentLevel);
}

function initLevel(level) {
  waterCount = 0;
  levelWon = false;
  
  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      grid[i][j] = 0; 
    }
  }

  if (level === 1) {
    // Level 1 (左右漏斗)
    for (let x = 0; x <= 22; x++) {
      let y = floor(12 + x * 0.6);
      setBlock(x, y, 2);
    }
    for (let x = 28; x <= 49; x++) {
      let y = floor(25 - (x - 28) * 0.6);
      setBlock(x, y, 2);
    }
    setArea(38, 33, 48, 39, 3);
  } 
  else if (level === 2) {
    // Level 2 (交錯擋板)
    for (let x = 15; x <= 49; x++) {
      setBlock(x, 12, 2);
    }
    for (let x = 0; x <= 30; x++) {
      let y = floor(20 + x * 0.3);
      setBlock(x, y, 2);
    }
    setArea(2, 33, 12, 39, 3);
  } 
  else if (level === 3) {
    // Level 3 (極限峽谷)
    setArea(0, 20, 18, 35, 2);
    setArea(32, 20, 49, 35, 2);
    setArea(20, 33, 30, 39, 3);
  }
}

function setBlock(x, y, type) {
  if (x >= 0 && x < cols && y >= 0 && y < rows) grid[x][y] = type;
}

function setArea(x1, y1, x2, y2, type) {
  for (let i = x1; i <= x2; i++) {
    for (let j = y1; j <= y2; j++) {
      setBlock(i, j, type);
    }
  }
}

function goToNextLevel() {
  currentLevel = (currentLevel % 3) + 1;
  initLevel(currentLevel);
}

function draw() {
  background(15, 20, 30); 

  // 1. 互動處理 (Y < 120 降雨)
  if ((mouseIsPressed || touches.length > 0) && mouseY < 120) {
    addWater(mouseX, mouseY);
  }

  // 2. 物理演算
  if (!levelWon) {
    updatePhysics();
  }

  // 3. 繪製
  drawGameObjects();
  drawUI();
}

function addWater(mx, my) {
  let x = floor(mx / size);
  let y = floor(my / size);
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      if (grid[x + i] && grid[x + i][y + j] === 0) {
        grid[x + i][y + j] = 1;
      }
    }
  }
}

function updatePhysics() {
  let nextGrid = [];
  for (let i = 0; i < cols; i++) {
    nextGrid[i] = [];
    for (let j = 0; j < rows; j++) {
      let state = grid[i][j];
      nextGrid[i][j] = (state === 2 || state === 3) ? state : 0;
    }
  }

  for (let i = 0; i < cols; i++) {
    for (let j = rows - 1; j >= 0; j--) {
      if (grid[i][j] === 1) {
        if (j + 1 < rows) {
          let below = grid[i][j + 1];
          if (below === 3) { 
            waterCount++;
            if (waterCount >= winTarget) levelWon = true;
            continue; 
          }
          
          if (below === 0 && nextGrid[i][j+1] === 0) {
            nextGrid[i][j + 1] = 1;
          } else {
            let dir = random() < 0.5 ? 1 : -1;
            if (i + dir >= 0 && i + dir < cols && grid[i + dir][j + 1] === 0 && nextGrid[i + dir][j + 1] === 0) {
              nextGrid[i + dir][j + 1] = 1;
            } else if (i - dir >= 0 && i - dir < cols && grid[i - dir][j + 1] === 0 && nextGrid[i - dir][j + 1] === 0) {
              nextGrid[i - dir][j + 1] = 1;
            } else {
              nextGrid[i][j] = 1;
            }
          }
        }
      }
    }
  }
  grid = nextGrid;
}

function drawGameObjects() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let state = grid[i][j];
      let x = i * size;
      let y = j * size;
      
      if (state === 1) {
        noStroke();
        fill(50, 150, 255); 
        rect(x, y, size, size);
      } 
      else if (state === 2) {
        noStroke();
        fill(60);
        rect(x, y, size, size);
        stroke(120); 
        line(x, y, x + size, y);
      } 
      else if (state === 3) {
        noStroke();
        fill(0, 200, 255, 30);
        rect(x, y, size, size);
      }
    }
  }
  drawTankDecorations();
}

function drawTankDecorations() {
  let tankL = width, tankT = height, tankR = 0, tankB = 0;
  let hasTank = false;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j] === 3) {
        tankL = min(tankL, i * size);
        tankT = min(tankT, j * size);
        tankR = max(tankR, (i + 1) * size);
        tankB = max(tankB, (j + 1) * size);
        hasTank = true;
      }
    }
  }
  
  if (hasTank) {
    noFill();
    stroke(0, 255, 255, 150 + sin(frameCount * 0.1) * 50); 
    strokeWeight(2);
    rect(tankL, tankT, tankR - tankL, tankB - tankT, 5);
    
    let fx = (tankL + tankR) / 2;
    let fy = (tankT + tankB) / 2 + sin(frameCount * 0.05) * 5;
    textSize(32);
    textAlign(CENTER, CENTER);
    text('🐟', fx, fy);
  }
}

function drawUI() {
  noStroke();
  fill(255);
  textSize(22);
  textAlign(LEFT, TOP);
  text(`Level ${currentLevel}`, 15, 15);
  
  fill(0, 200, 255);
  textSize(18);
  text(`目標水量: ${waterCount} / ${winTarget}`, 15, 45);

  let currentWater = 0;
  for(let i=0; i<cols; i++) for(let j=0; j<rows; j++) if(grid[i][j]===1) currentWater++;

  if (currentWater === 0 && waterCount === 0) {
    fill(255, 255, 0);
    textAlign(CENTER, CENTER);
    text("👇 請在畫面最上方塗抹降雨！", width / 2, height / 2);
    stroke(255, 255, 0, 50);
    line(0, 120, width, 120);
  }

  if (levelWon) {
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);
    fill(255, 215, 0);
    textSize(50);
    textAlign(CENTER, CENTER);
    text(`🎉 LEVEL ${currentLevel} CLEAR!`, width / 2, height / 2);
  }
}

function touchMoved() { return false; }