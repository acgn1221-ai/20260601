/*
----- Coding Tutorial by Patt Vira ----- 
Name: Interactive Falling Coins (with ml5.js handPose) 
Video Tutorial: https://youtu.be/Fp7nkcKi5Dw

Connect with Patt: @pattvira
https://www.pattvira.com/
----------------------------------------
*/

let video;
let isVideoAvailable = false;
let options = {flipped: true};

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 建立攝影機擷取，並加入回呼函數確認攝影機是否啟動成功
  video = createCapture(VIDEO, options, (stream) => {
    if (stream) isVideoAvailable = true;
  });
  
  video.hide();
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
}

// 處理視窗大小改變
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
