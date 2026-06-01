/*
----- 《引流解謎遊戲：拯救小魚》完美正式版 ----- 
*/

let grid = [];
const cols = 50;
const rows = 40;
let size; 

let currentLevel = 1;
let waterCount = 0;
const winTarget = 100; 
let levelWon = false;
let nextBtn;

function setup() {
  // 固定畫布大小
  createCanvas(640, 480);
  size = width / cols;
  
  // 建立進入下一關按鈕
  nextBtn = createButton('進入下一關');
  nextBtn.position(10, 80);
  nextBtn.style('padding', '10px');
  nextBtn.style('font-weight', 'bold');
  nextBtn.style('cursor', 'pointer');
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
    // Level 1 【初學大漏斗】
    for (let x = 0; x <= 18; x++) {
      let y = floor(15 + x * (10 / 18));
      setBlock(x, y, 2);
    }
    for (let x = 32; x <= 49; x++) {
      let y = floor(15 + (49 - x) * (10 / 18));
      setBlock(x, y, 2);
    }
    setArea(20, 33, 30, 39, 3); // 魚缸：中央底部
  } 
  else if (level === 2) {
    // Level 2 【Z字型滑水道】
    for (let x = 0; x <= 35; x++) {
      let y = floor(15 + x * 0.2);
      setBlock(x, y, 2);
    }
    for (let x = 15; x <= 49; x++) {
      let y = floor(25 + (49 - x) * 0.2);
      setBlock(x, y, 2);
    }
    setArea(38, 33, 48, 39, 3); // 魚缸：右下
  } 
  else if (level === 3) {
    // Level 3 【水流分道揚鑣】
    for (let x = 0; x <= 25; x++) {
      let y = floor(25 - (25 - x) * 0.4);
      setBlock(x, y, 2);
    }
    for (let x = 25; x <= 49; x++) {
      let y = floor(25 - (x - 25) * 0.4);
      setBlock(x, y, 2);
    }
    setArea(2, 33, 12, 39, 3); // 魚缸：左下
  }
  else if (level === 4) {
    // Level 4 【夾縫定時射門】
    setArea(10, 15, 49, 16, 2); // 牆1: 缺口左
    setArea(0, 22, 40, 23, 2);  // 牆2: 缺口右
    setArea(0, 29, 20, 30, 2); setArea(30, 29, 49, 30, 2); // 牆3: 缺口中
    setArea(20, 33, 30, 39, 3);
  }
  else if (level === 5) {
    // Level 5 【極限滴水穿石】
    setArea(0, 15, 20, 35, 2);  // 左峭壁
    setArea(30, 15, 49, 35, 2); // 右峭壁
    setArea(22, 35, 28, 39, 3); // 魚缸：極小中央
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
  currentLevel = (currentLevel % 5) + 1;
  initLevel(currentLevel);
}

function draw() {
  background(15, 20, 30); 

  // 1. 互動處理 (Y < 120 降雨)
  if ((mouseIsPressed || (touches && touches.length > 0)) && mouseY < 120) {
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
  let cx = floor(mx / size);
  let cy = floor(my / size);
  let count = floor(random(2, 4));
  for (let i = 0; i < count; i++) {
    let rx = cx + floor(random(-1, 2));
    let ry = cy + floor(random(-1, 2));
    if (grid[rx] && grid[rx][ry] === 0) grid[rx][ry] = 1;
  }
}

function updatePhysics() {
  let nextGrid = [];
  for (let i = 0; i < cols; i++) {
    nextGrid[i] = [];
    for (let j = 0; j < rows; j++) {
      let state = grid[i][j];
      if (state === 2 || state === 3) {
        nextGrid[i][j] = state;
      } else {
        nextGrid[i][j] = 0;
      }
    }
  }

  // 嚴格物理碰撞判定
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j] === 1) {
        if (j >= rows - 1) continue;

        let below = grid[i][j + 1];
        
        if (below === 3) { 
          waterCount++;
          if (waterCount >= winTarget) levelWon = true;
          continue; 
        }
        
        // 檢查正下方
        if (below === 0 && nextGrid[i][j+1] === 0) {
          nextGrid[i][j + 1] = 1;
        } else {
          // 隨機左下或右下滑落
          let dir = random() < 0.5 ? 1 : -1;
          let canMoveDir = (i + dir >= 0 && i + dir < cols && grid[i + dir][j + 1] === 0 && nextGrid[i + dir][j + 1] === 0);
          let canMoveOther = (i - dir >= 0 && i - dir < cols && grid[i - dir][j + 1] === 0 && nextGrid[i - dir][j + 1] === 0);

          if (canMoveDir) {
            nextGrid[i + dir][j + 1] = 1;
          } else if (canMoveOther) {
            nextGrid[i - dir][j + 1] = 1;
          } else {
            nextGrid[i][j] = 1; // 留原位
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
        fill(50, 180, 255); 
        ellipse(x + size/2, y + size/2, size * 1.2);
      } 
      else if (state === 2) {
        noStroke();
        fill(60);
        rect(x, y, size, size);
        stroke(120); // 岩石頂端高光
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
    stroke(0, 255, 255, 180 + sin(frameCount * 0.1) * 70); 
    strokeWeight(3);
    rect(tankL, tankT, tankR - tankL, tankB - tankT, 8);
    
    let fx = (tankL + tankR) / 2;
    let fy = (tankT + tankB) / 2 + sin(frameCount * 0.08) * 10;
    textSize(36);
    textAlign(CENTER, CENTER);
    push();
    translate(fx, fy);
    rotate(sin(frameCount * 0.05) * 0.1);
    text('🐟', 0, 0);
    pop();
  }
}

function drawUI() {
  noStroke();
  fill(255);
  textStyle(BOLD);
  textSize(24);
  textAlign(LEFT, TOP);
  text(`LEVEL ${currentLevel}`, 15, 15);
  
  fill(0, 255, 255);
  textSize(18);
  text(`Water: ${waterCount} / ${winTarget}`, 15, 50);

  let currentWater = 0;
  for(let i=0; i<cols; i++) for(let j=0; j<rows; j++) if(grid[i][j]===1) currentWater++;

  if (currentWater === 0 && waterCount === 0 && frameCount % 60 < 40) {
    drawingContext.setLineDash([10, 10]);
    stroke(255, 255, 0, 80);
    line(0, 120, width, 120);
    drawingContext.setLineDash([]);
    fill(255, 255, 0);
    textAlign(CENTER, CENTER);
    text("👇 請在此線上方點擊降雨！", width / 2, 60);
  }

  if (levelWon) {
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);
    fill(255, 215, 0);
    textSize(60);
    textAlign(CENTER, CENTER);
    text(`🎉 LEVEL ${currentLevel} CLEAR!`, width / 2, height / 2 - 20);
    fill(255);
    textSize(20);
    text("點擊按鈕進入下一關", width / 2, height / 2 + 50);
  }
}

function touchMoved() { return false; }