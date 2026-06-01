/*
----- 《引流解謎遊戲：拯救小魚》視覺細化高質感版 ----- 
核心：全面美化水流、岩石與魚缸視覺，擺脫粗糙像素感！
*/

let grid = [];
let cols, rows;
let size = 12; // 稍微縮小格子，讓水流與地形更細膩

let waterCount = 0;
let winTarget = 200; 
let gameWon = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  initGameLayout();
}

function initGameLayout() {
  cols = floor(width / size);
  rows = floor(height / size);

  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      grid[i][j] = 0; 
    }
  }

  // 建造岩石斜坡擋板 (狀態 2) ── 相對位置自適應
  // 左側斜坡擋板
  for (let i = 0; i < cols * 0.48; i++) {
    let j = floor(rows * 0.35 + i * 0.35);
    if (j < rows) {
      grid[i][j] = 2;
      if (j + 1 < rows) grid[i][j + 1] = 2; // 增加擋板厚度
      if (j + 2 < rows) grid[i][j + 2] = 2; 
    }
  }

  // 右側斜坡擋板
  for (let i = floor(cols * 0.52); i < cols; i++) {
    let j = floor(rows * 0.72 - (i - cols * 0.52) * 0.35);
    if (j < rows) {
      grid[i][j] = 2;
      if (j + 1 < rows) grid[i][j + 1] = 2;
      if (j + 2 < rows) grid[i][j + 2] = 2;
    }
  }

  // 右下角玻璃魚缸 (狀態 3)
  let tankW = floor(width * 0.22 / size); 
  let tankH = floor(height * 0.2 / size); 
  tankW = max(8, tankW);
  tankH = max(6, tankH);

  for (let i = cols - tankW; i < cols; i++) {
    for (let j = rows - tankH; j < rows; j++) {
      grid[i][j] = 3;
    }
  }
}

function draw() {
  // 深邃的宇宙星空藍背景
  background(15, 20, 30); 

  // 1. 互動觸發：支援手機觸控與滑鼠
  if (touchIsPressed || mouseIsPressed) {
    // 一次注入一小團水，增加水流豐富度
    for(let d = -1; d <= 1; d++) {
      addWater(mouseX + d*size, mouseY);
    }
  }
  if (touches.length > 0) {
    for (let i = 0; i < touches.length; i++) {
      addWater(touches[i].x, touches[i].y);
    }
  }

  // 2. 物理演算
  if (!gameWon) {
    updatePhysics();
  }

  // 3. 繪製精細化物件
  drawGameObjects();

  // 4. 顯示高質感 UI 與新手引導
  drawUI();
}

function addWater(mx, my) {
  let x = floor(mx / size);
  let y = floor(my / size);
  if (x >= 0 && x < cols && y >= 0 && y < rows) {
    if (grid[x][y] === 0) {
      // 給水滴一個動態的時間戳記，用來做發光漸層
      grid[x][y] = 1; 
    }
  }
}

function updatePhysics() {
  let nextGrid = [];
  for (let i = 0; i < cols; i++) {
    nextGrid[i] = [];
    for (let j = 0; j < rows; j++) {
      nextGrid[i][j] = (grid[i][j] === 2 || grid[i][j] === 3) ? grid[i][j] : 0;
    }
  }

  for (let i = 0; i < cols; i++) {
    for (let j = rows - 1; j >= 0; j--) {
      let state = grid[i][j];
      if (state === 1) {
        if (j + 1 < rows) {
          let below = grid[i][j + 1];
          if (below === 3) { 
            waterCount++;
            if (waterCount >= winTarget) gameWon = true;
            continue; 
          }
          let dir = random() < 0.5 ? 1 : -1;
          let belowDiag = 0;
          if (i + dir >= 0 && i + dir < cols) {
            belowDiag = grid[i + dir][j + 1];
          }
          if (below === 0) {
            nextGrid[i][j + 1] = 1;
          } else if (belowDiag === 0 && i + dir >= 0 && i + dir < cols) {
            nextGrid[i + dir][j + 1] = 1;
          } else {
            nextGrid[i][j] = 1;
          }
        } else {
          nextGrid[i][j] = 0; 
        }
      }
    }
  }
  grid = nextGrid;
}

function drawGameObjects() {
  // 啟用色彩 HSB 模式來畫發光水流，畫完再切回 RGB
  colorMode(HSB, 360, 100, 100, 100);
  
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      
      if (grid[i][j] === 1) { // 💧 螢光霓虹水流
        noStroke();
        // 讓水流顏色隨時間微幅波動 (藍色到青色之間)
        let hue = 190 + sin(frameCount * 0.02 + i) * 15; 
        fill(hue, 85, 95, 80); 
        ellipse(i * size + size / 2, j * size + size / 2, size * 1.1); // 稍微放大消除縫隙
        
      } else if (grid[i][j] === 2) { // ⛰️ 浮雕感岩石斜坡
        colorMode(RGB);
        noStroke();
        // 根據高低差給予岩石深淺漸層，製造立體陰影感
        let shadow = map(j, 0, rows, 90, 50);
        fill(shadow, shadow + 10, shadow + 20); 
        rect(i * size, j * size, size, size);
        // 加上岩石上緣的亮線外框
        stroke(shadow + 40, shadow + 50, shadow + 60);
        line(i * size, j * size, (i+1) * size, j * size);
        colorMode(HSB, 360, 100, 100, 100);
        
      } else if (grid[i][j] === 3) { // 🧪 科技感半透明水底魚缸
        colorMode(RGB);
        noStroke();
        fill(0, 180, 216, 30); // 極淡的科技發光藍
        rect(i * size, j * size, size, size);
        colorMode(HSB, 360, 100, 100, 100);
      }
    }
  }
  colorMode(RGB); // 切回標準色彩模式
  
  // 繪製魚缸的實體玻璃外框與動態水面波浪
  drawTankDecorations();
}

function drawTankDecorations() {
  // 尋找魚缸的左邊界與上邊界座標
  let tankLeft = width;
  let tankTop = height;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j] === 3) {
        if (i * size < tankLeft) tankLeft = i * size;
        if (j * size < tankTop) tankTop = j * size;
      }
    }
  }
  
  // 畫出霓虹發光的魚缸外框
  noFill();
  stroke(0, 180, 216);
  strokeWeight(3);
  rect(tankLeft, tankTop, width - tankLeft, height - tankTop, 8);
  
  // 裝飾性標籤
  noStroke();
  fill(0, 180, 216, 150);
  rect(tankLeft + 10, tankTop - 20, 60, 20, 4);
  fill(255);
  textSize(11);
  textAlign(CENTER, CENTER);
  text("TARGET", tankLeft + 40, tankTop - 10);

  // 🐟 動態游動的小魚
  let fishX = tankLeft + (width - tankLeft) / 2 + cos(frameCount * 0.03) * 15;
  let fishY = tankTop + (height - tankTop) / 2 + sin(frameCount * 0.05) * 8;
  textSize(36);
  text('🐟', fishX, fishY);
}

function drawUI() {
  // 頂部半透明現代感計分板
  noStroke();
  fill(20, 25, 35, 200);
  rect(20, 20, 280, 50, 10);
  stroke(255, 255, 255, 30);
  strokeWeight(1);
  noFill();
  rect(20, 20, 280, 50, 10);
  
  // 計分文字
  fill(255);
  noStroke();
  textSize(16);
  textAlign(LEFT, CENTER);
  text("💧 小魚喝水量: ", 40, 45);
  
  // 動態跳動的分數數字
  fill(0, 180, 216);
  textSize(20);
  text(waterCount + " / " + winTarget, 150, 44);

  // 新手特效引導（當水為 0 時）
  if (waterCount === 0) {
    fill(255, 255, 0);
    textSize(18);
    textAlign(CENTER, CENTER);
    text("👇 請在螢幕上方「左右抹動」降下水源！", width / 2, height * 0.15);
    
    // 動態指引發光箭頭
    stroke(0, 180, 216, 100 + sin(frameCount * 0.1) * 50);
    strokeWeight(4);
    let arrowY = height * 0.2 + sin(frameCount * 0.08) * 10;
    line(width / 2, arrowY, width / 2, arrowY + 20);
    line(width / 2, arrowY + 20, width / 2 - 8, arrowY + 12);
    line(width / 2, arrowY + 20, width / 2 + 8, arrowY + 12);
  }

  // 勝利大畫面
  if (gameWon) {
    fill(10, 15, 25, 230);
    rect(0, 0, width, height);
    
    // 閃爍的獲勝文字
    fill(0, 255, 150);
    textSize(46);
    textAlign(CENTER, CENTER);
    text("🎉 MISSION COMPLETE!", width / 2, height / 2 - 30);
    
    fill(255);
    textSize(20);
    text("你成功引導水源，拯救了瀕臨缺水的小魚！", width / 2, height / 2 + 25);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initGameLayout();
}

function touchMoved() {
  return false;
}

function touchEnded() {
  return false;
}