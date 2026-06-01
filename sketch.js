/*
----- 《引流解謎遊戲：拯救小魚》行動觸控/新手教學版 ----- 
核心：免相機！支援手機螢幕觸控，並內建新手引導動態提示。
*/

let grid = [];
let cols, rows;
let size = 15; // 網格大小

let waterCount = 0;
let winTarget = 150; // 達到這個分數就獲勝
let gameWon = false;

function setup() {
  // 自動適應手機或電腦視窗大小
  createCanvas(windowWidth, windowHeight);
  
  initGameLayout();
}

function initGameLayout() {
  cols = floor(width / size);
  rows = floor(height / size);

  // 初始化網格
  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      grid[i][j] = 0; 
    }
  }

  // 建造固定的岩石擋板 (狀態 2) ── 改為相對位置，確保手機上不會跑位
  // 左擋板
  for (let i = 0; i < cols * 0.45; i++) {
    let j = floor(rows * 0.35 + i * 0.4);
    if (j < rows) {
      grid[i][j] = 2;
      if (j + 1 < rows) grid[i][j + 1] = 2; // 加厚
    }
  }

  // 右擋板
  for (let i = floor(cols * 0.55); i < cols; i++) {
    let j = floor(rows * 0.75 - (i - cols * 0.55) * 0.4);
    if (j < rows) {
      grid[i][j] = 2;
      if (j + 1 < rows) grid[i][j + 1] = 2;
    }
  }

  // 右下角的魚缸 (狀態 3)
  let tankW = floor(width * 0.2 / size); // 魚缸佔螢幕寬度 20%
  let tankH = floor(height * 0.15 / size); // 魚缸佔螢幕高度 15%
  tankW = max(5, tankW);
  tankH = max(4, tankH);

  for (let i = cols - tankW; i < cols; i++) {
    for (let j = rows - tankH; j < rows; j++) {
      grid[i][j] = 3;
    }
  }
}

function draw() {
  background(20, 24, 35); // 換成更有質感的深藍黑色背景

  // 1. 手機多點觸控 / 電腦滑鼠 互動觸發
  if (touchIsPressed || mouseIsPressed) {
    addWater(mouseX, mouseY);
  }
  
  // 支援手機多點觸控（如果用兩根手指一起滑，可以同時兩個地方出水）
  if (touches.length > 0) {
    for (let i = 0; i < touches.length; i++) {
      addWater(touches[i].x, touches[i].y);
    }
  }

  // 2. 物理沙化下落演算法
  if (!gameWon) {
    updatePhysics();
  }

  // 3. 繪製所有畫面元素
  drawGameObjects();

  // 4. 顯示引導 UI 與勝負資訊
  drawUI();
}

function addWater(mx, my) {
  let x = floor(mx / size);
  let y = floor(my / size);
  if (x >= 0 && x < cols && y >= 0 && y < rows) {
    // 只有在空氣中才能點出水，不能蓋掉擋板或魚缸
    if (grid[x][y] === 0) {
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
          nextGrid[i][j] = 0; // 漏到底部消失
        }
      }
    }
  }
  grid = nextGrid;
}

function drawGameObjects() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j] === 1) {
        noStroke();
        fill(0, 191, 255); // 亮天藍色（水滴）
        ellipse(i * size + size / 2, j * size + size / 2, size * 0.85);
      } else if (grid[i][j] === 2) {
        noStroke();
        fill(140, 110, 95); // 木質感的灰色擋板
        rect(i * size, j * size, size, size, 4); // 帶點圓角
      } else if (grid[i][j] === 3) {
        noStroke();
        fill(0, 128, 128, 100); // 魚缸水色
        rect(i * size, j * size, size, size);
      }
    }
  }
  
  // 動態小魚：讓小魚在魚缸裡微微浮動
  let fishX = width - (width * 0.1);
  let fishY = height - (height * 0.08) + sin(frameCount * 0.05) * 5;
  textSize(32);
  textAlign(CENTER, CENTER);
  text('🐟', fishX, fishY);
}

function drawUI() {
  // 上方資訊列
  fill(0, 150);
  rect(0, 0, width, 60);
  
  fill(255);
  textSize(20);
  textAlign(LEFT, CENTER);
  text("💧 小魚喝水量: " + waterCount + " / " + winTarget, 20, 30);

  // 【核心改動：新手教學引導】如果還沒有水滴，在畫面上秀出玩法動畫提示
  if (waterCount === 0) {
    // 提示文字
    fill(255, 255, 0);
    textSize(18);
    textAlign(CENTER, CENTER);
    text("👇 請用手指在螢幕上方「左右滑動」擠出水流！", width / 2, height * 0.15);
    
    // 繪製左右滑動的手勢虛線引導
    stroke(255, 255, 0, 150);
    strokeWeight(2);
    let waveX = width / 2 + sin(frameCount * 0.05) * (width * 0.2);
    let waveY = height * 0.22;
    noFill();
    line(width / 2 - (width * 0.2), waveY, width / 2 + (width * 0.2), waveY);
    fill(255, 255, 0);
    noStroke();
    ellipse(waveX, waveY, 15, 15); // 移動的提示點
    
    // 引流箭頭
    stroke(100, 100, 100, 100);
    strokeWeight(3);
    line(width * 0.3, height * 0.4, width * 0.45, height * 0.55); // 左流向
    line(width * 0.7, height * 0.4, width * 0.55, height * 0.6); // 右流向
  }

  // 獲勝畫面
  if (gameWon) {
    fill(0, 200);
    rect(0, 0, width, height);
    fill(0, 255, 0);
    textSize(40);
    textAlign(CENTER, CENTER);
    text("🎉 YOU WIN!", width / 2, height / 2 - 30);
    fill(255);
    textSize(20);
    text("小魚成功喝飽水了！", width / 2, height / 2 + 20);
  }
}

// 當手機旋轉或視窗改變大小時，自動重算網格，防止畫面黑掉
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initGameLayout();
}

// 防止手機網頁在滑動時，觸發到瀏覽器預設的「下拉重新整理」或頁面捲動
function touchMoved() {
  return false;
}