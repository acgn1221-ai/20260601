/*
----- Coding Tutorial by Patt Vira ----- 
Name: 《引流解謎遊戲：拯救小魚》除錯加強版
Video Tutorial: https://youtu.be/Fp7nkcKi5Dw

Connect with Patt: @pattvira
https://www.pattvira.com/
----------------------------------------
*/

// 遊戲邏輯變數
let grid = [];
let cols, rows; 
let size = 15; // 網格大小，加大以提升流暢度

let handPose;
let video;
let hands = [];
let isVideoAvailable = false; // 新增：追蹤攝影機是否可用
let isModelLoaded = false; // 檢查 AI 是否載入成功
let waterCount = 0;

function preload() {
  // 初始化新版 ml5.handPose
  handPose = ml5.handPose({ flipped: true }, () => {
    isModelLoaded = true;
    console.log("✅ AI 模型載入成功！");
  });
}

function setup() {
  createCanvas(640, 480);
  
  // 初始化攝影機
  video = createCapture(VIDEO, { flipped: true }, (stream) => {
    if (stream) {
      isVideoAvailable = true;
      // 攝影機成功啟動後，才開啟 AI 偵測
      handPose.detectStart(video, (results) => {
        hands = results;
      });
    }
  });
  video.size(640, 480);
  video.hide();
  
  // 初始化網格系統
  cols = floor(width / size);
  rows = floor(height / size);
  
  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      grid[i][j] = 0; // 0 = 空氣
    }
  }
  
  // 【強制繪製關卡】建造固定的岩石擋板 (狀態 2)
  // 擋板 1：左上到中間
  for (let i = 0; i < cols * 0.45; i++) {
    let j = floor(rows * 0.4 + i * 0.3);
    if (j < rows) grid[i][j] = 2;
    if (j + 1 < rows) grid[i][j + 1] = 2; // 讓擋板厚一點
  }
  
  // 擋板 2：右上到中間
  for (let i = floor(cols * 0.55); i < cols; i++) {
    let j = floor(rows * 0.7 - (i - cols * 0.55) * 0.3);
    if (j < rows) grid[i][j] = 2;
    if (j + 1 < rows) grid[i][j + 1] = 2;
  }
  
  // 【強制繪製終點】右下角的魚缸 (狀態 3)
  for (let i = cols - 10; i < cols; i++) {
    for (let j = rows - 6; j < rows; j++) {
      grid[i][j] = 3;
    }
  }
}

function draw() {
  background(0);
  
  // 1. 畫出視訊畫面 (僅在可用時繪製)
  if (isVideoAvailable) {
    image(video, 0, 0, width, height);
  }
  
  // 2. 互動觸發：手勢或滑鼠
  if (isVideoAvailable && hands && hands.length > 0) {
    let hand = hands[0];
    if (hand.keypoints && hand.keypoints[8]) {
      let indexFinger = hand.keypoints[8];
      addWater(indexFinger.x, indexFinger.y);
    }
  }
  
  if (mouseIsPressed) {
    addWater(mouseX, mouseY);
  }
  
  // 3. 物理沙化下落演算法
  updatePhysics();
  
  // 4. 繪製所有畫面元素
  drawGameObjects();
  
  // 5. 顯示 UI 文字資訊
  drawUI();
}

function addWater(mx, my) {
  let x = floor(mx / size);
  let y = floor(my / size);
  if (x >= 0 && x < cols && y >= 0 && y < rows) {
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
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j] === 1) { 
        noStroke();
        fill(65, 105, 225); 
        ellipse(i * size + size / 2, j * size + size / 2, size * 0.8);
      } else if (grid[i][j] === 2) { 
        noStroke();
        fill(100, 100, 100); 
        rect(i * size, j * size, size, size);
      } else if (grid[i][j] === 3) { 
        noStroke();
        fill(0, 139, 139, 150); 
        rect(i * size, j * size, size, size);
      }
    }
  }
  textSize(24);
  textAlign(CENTER, CENTER);
  text('🐟', width - 5 * size, height - 3 * size);
}

function drawUI() {
  fill(0, 180);
  noStroke();
  rect(0, 0, 260, 80);
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text("💧 小魚喝水量: " + waterCount, 15, 15);
  if (isModelLoaded) {
    fill(0, 255, 0);
    text("● AI 辨識系統：已連線", 15, 45);
  } else {
    fill(255, 165, 0);
    text("○ AI 載入中... (此時可用滑鼠測試)", 15, 45);
  }
  if (!isVideoAvailable) {
    fill(255, 50, 50);
    text("❌ 找不到攝影機 (請檢查硬體或權限)", 15, 65);
  }
}

// 處理視窗大小改變
function windowResized() {
  // 此版本固定 640x480，如需全螢幕可再調整
}
