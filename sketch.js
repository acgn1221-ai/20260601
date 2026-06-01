/*
----- 引流解謎遊戲：拯救小魚（結構修復版） ----- 
修正核心：修復 setup 內非同步順序，確保 ml5 正確綁定視訊串流！
*/

// 遊戲邏輯變數
let grid = [];
let cols, rows;
let size = 15; // 網格大小

let handPose;
let video;
let hands = [];
let isVideoAvailable = false; // 追蹤攝影機是否可用
let cameraErrorMessage = "";  // 儲存報錯訊息
let isModelLoaded = false;    // 檢查 AI 是否載入成功
let waterCount = 0;

function preload() {
  // 初始化新版 ml5.handPose
  handPose = ml5.handPose({ flipped: true }, () => {
    isModelLoaded = true;
    console.log("✅ AI 模型載入成功！");
  });
}

function setup() {
  let canvas = createCanvas(640, 480);
  canvas.parent(document.body);

  // 設定最穩定的相機請求參數（關閉音訊防止搶佔）
  let constraints = {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: "user" 
    },
    audio: false
  };

  // 【關鍵修復】直接呼叫 createCapture，並在成功回呼函式中綁定 ml5.js
  video = createCapture(constraints, function(stream) {
    if (stream) {
      isVideoAvailable = true;
      console.log("🎥 攝影機硬體成功驅動！");
      
      // 確保相機成功開啟後，才將視訊源餵給 AI 開始偵測
      if (handPose) {
        handPose.detectStart(video, (results) => {
          hands = results;
        });
      }
    } else {
      isVideoAvailable = false;
      cameraErrorMessage = "找不到攝影機串流";
    }
  });

  // 隱藏 HTML 原生的 video 標籤，我們要在 p5 畫布裡自己畫
  video.size(640, 480);
  video.hide();

  // 監聽底層硬體錯誤（例如權限被拒絕、或設備被佔用）
  video.elt.onerror = () => {
    isVideoAvailable = false;
    cameraErrorMessage = "硬體拒絕存取 (可能被其他程式佔用)";
  };

  // 初始化網格系統
  cols = floor(width / size);
  rows = floor(height / size);

  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      grid[i][j] = 0; // 0 = 空氣
    }
  }

  // 建造固定的岩石擋板 (狀態 2)
  // 擋板 1：左上到中間
  for (let i = 0; i < cols * 0.45; i++) {
    let j = floor(rows * 0.4 + i * 0.3);
    if (j < rows) grid[i][j] = 2;
    if (j + 1 < rows) grid[i][j + 1] = 2; 
  }

  // 擋板 2：右上到中間
  for (let i = floor(cols * 0.55); i < cols; i++) {
    let j = floor(rows * 0.7 - (i - cols * 0.55) * 0.3);
    if (j < rows) grid[i][j] = 2;
    if (j + 1 < rows) grid[i][j + 1] = 2;
  }

  // 右下角的魚缸 (狀態 3)
  for (let i = cols - 10; i < cols; i++) {
    for (let j = rows - 6; j < rows; j++) {
      grid[i][j] = 3;
    }
  }
}

function draw() {
  background(30); 

  // 1. 畫出視訊畫面
  if (isVideoAvailable && video) {
    push();
    translate(width, 0);
    scale(-1, 1); // 鏡像
    image(video, 0, 0, width, height);
    pop();
  }

  // 2. 互動觸發：手勢
  if (isModelLoaded && hands && hands.length > 0) {
    let hand = hands[0];
    if (hand.keypoints && hand.keypoints[8]) {
      let indexFinger = hand.keypoints[8];
      // 注意：因為畫面水平翻轉了，手勢點位的 x 軸座標需要鏡像對應回網格
      addWater(width - indexFinger.x, indexFinger.y);
    }
  }

  // 互動觸發：滑鼠測試
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
  rect(0, 0, 260, 120);
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
    rect(0, 65, 260, 50);
    fill(255);
    textSize(14);
    text("⚠️ 相機失效: " + (cameraErrorMessage || "裝置繁忙"), 15, 70, 230);
    fill(255, 255, 0);
    text("已自動切換至【滑鼠模式】", 15, 95);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}