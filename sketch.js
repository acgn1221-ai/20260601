/*
----- Coding Tutorial by Patt Vira ----- 
Name: 《引流解謎遊戲：拯救小魚》核心整合版本
Video Tutorial: https://youtu.be/Fp7nkcKi5Dw

Connect with Patt: @pattvira
https://www.pattvira.com/
----------------------------------------
*/

let video;
let handPose;
let hands = [];
let isVideoAvailable = false;
let options = {flipped: true};

// 遊戲邏輯變數
let grid = [];
let cols = 64; // 基於 640 寬度，每格 10 像素
let rows = 48; // 基於 480 高度，每格 10 像素
let waterCount = 0;

function preload() {
  // 初始化手勢偵測模型
  handPose = ml5.handPose(options);
}

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 建立攝影機擷取，並加入回呼函數確認攝影機是否啟動成功
  video = createCapture(VIDEO, options, (stream) => {
    if (stream) isVideoAvailable = true;
  });
  video.size(640, 480);
  video.hide();

  // 開始偵測手勢
  handPose.detectStart(video, (results) => {
    hands = results;
  });

  // 初始化網格 (0=空氣, 1=金幣水流, 2=岩石, 3=魚缸)
  for (let i = 0; i < cols; i++) {
    grid[i] = new Array(rows).fill(0);
  }

  // --- 初始化關卡地形 ---
  initLevel();
}

function draw() {
  // 設定畫布顏色為 778da9
  background("#778da9");
  
  // 如果攝影機尚未就緒，顯示提示文字
  if (!isVideoAvailable) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("找不到攝影機裝置。\n請確認已連接攝影機並允許瀏覽器存取權限，\n或確保正透過 Live Server (http://...) 開啟網頁。", width/2, height/2);
    return;
  }

  // 計算顯示影像的寬高 (全螢幕的 70%)
  let displayW = width * 0.7;
  let displayH = height * 0.7;

  // 計算置中座標
  let x = (width - displayW) / 2;
  let y = (height - displayH) / 2;

  // 繪製攝影機影像
  if (video) {
    image(video, x, y, displayW, displayH);
  }

  // 2. 互動機制：產生金幣 (狀態 1)
  if (hands.length > 0) {
    // 手勢控制：食指尖端 (Keypoint 8)
    let finger = hands[0].keypoints[8];
    let gx = floor(finger.x / 10);
    let gy = floor(finger.y / 10);
    addWater(gx, gy);
  } else if (mouseIsPressed) {
    // 滑鼠備用測試：將滑鼠座標映射到 640x480 的網格中
    let gx = floor(map(mouseX, x, x + displayW, 0, cols));
    let gy = floor(map(mouseY, y, y + displayH, 0, rows));
    addWater(gx, gy);
  }

  // 3. 物理運算
  updatePhysics();

  // 4. 視覺渲染
  drawRect(x, y, displayW, displayH);
  
  // 5. 顯示 UI
  fill(255);
  noStroke();
  textSize(24);
  textAlign(LEFT, TOP);
  text("小魚喝水量: " + waterCount, 30, 30);
}

function initLevel() {
  // 1. 放置魚缸 (X: 520~620, Y: 400~460 -> 縮放 10 倍後的索引)
  for (let i = 52; i < 62; i++) {
    for (let j = 40; j < 46; j++) {
      grid[i][j] = 3;
    }
  }

  // 2. 繪製左側斜向擋板 (0, 20) 斜向下到 (28, 28)
  for (let i = 0; i <= 28; i++) {
    let j = floor(map(i, 0, 28, 20, 28));
    if (i < cols && j < rows) {
      grid[i][j] = 2;
      if (j + 1 < rows) grid[i][j + 1] = 2; // 增加厚度感
    }
  }

  // 3. 繪製右側斜向擋板 (64, 22) 斜向下到 (36, 30)
  for (let i = 36; i < 64; i++) {
    let j = floor(map(i, 36, 64, 30, 22));
    if (i < cols && j < rows) {
      grid[i][j] = 2;
      if (j + 1 < rows) grid[i][j + 1] = 2;
    }
  }
}

function addWater(gx, gy) {
  if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
    if (grid[gx][gy] === 0) grid[gx][gy] = 1;
  }
}

function updatePhysics() {
  let nextGrid = [];
  for (let i = 0; i < cols; i++) {
    nextGrid[i] = [...grid[i]];
  }

  // 從底部往上計算，實現 Cellular Automata
  for (let i = 0; i < cols; i++) {
    for (let j = rows - 1; j >= 0; j--) {
      if (grid[i][j] === 1) {
        if (j + 1 < rows) {
          let below = grid[i][j + 1];
          if (below === 0) {
            nextGrid[i][j] = 0;
            nextGrid[i][j + 1] = 1;
          } else if (below === 3) {
            nextGrid[i][j] = 0;
            waterCount++;
          } else {
            // 遇到障礙，隨機向左右兩側斜向滑落
            let dir = random() < 0.5 ? 1 : -1;
            if (i + dir >= 0 && i + dir < cols) {
              if (grid[i + dir][j + 1] === 0) {
                nextGrid[i][j] = 0;
                nextGrid[i + dir][j + 1] = 1;
              } else if (grid[i + dir][j + 1] === 3) {
                nextGrid[i][j] = 0;
                waterCount++;
              }
            }
          }
        }
      }
    }
  }
  grid = nextGrid;
}

function drawRect(ox, oy, dw, dh) {
  let cw = dw / cols;
  let ch = dh / rows;
  
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let state = grid[i][j];
      if (state === 0) continue;

      noStroke();
      if (state === 1) fill(255, 223, 0); // 金幣水流：黃色
      if (state === 2) fill(80);           // 岩石：深灰色
      if (state === 3) fill(0, 150, 255, 150); // 魚缸：半透明藍色

      rect(ox + i * cw, oy + j * ch, cw + 1, ch + 1);
      
      // 在魚缸中心畫小魚
      if (state === 3 && i === 57 && j === 43) {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(dw * 0.05);
        text('🐟', ox + i * cw, oy + j * ch);
      }
    }
  }
}

// 處理視窗大小改變
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
