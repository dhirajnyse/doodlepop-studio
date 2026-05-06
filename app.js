const canvas = document.querySelector("#paintCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const modeTabs = [...document.querySelectorAll("[data-mode]")];
const toolButtons = [...document.querySelectorAll("[data-tool]")];
const stampButtons = [...document.querySelectorAll("[data-stamp]")];
const swatches = [...document.querySelectorAll("[data-color]")];
const activityCards = [...document.querySelectorAll(".activity-card")];
const templateButtons = [...document.querySelectorAll("[data-template]")];
const customColor = document.querySelector("#customColor");
const brushSize = document.querySelector("#brushSize");
const sizePreview = document.querySelector("#sizePreview");
const undoButton = document.querySelector("#undoButton");
const redoButton = document.querySelector("#redoButton");
const clearButton = document.querySelector("#clearButton");
const saveButton = document.querySelector("#saveButton");
const uploadInput = document.querySelector("#uploadInput");
const uploadStatus = document.querySelector("#uploadStatus");
const uploadDrop = document.querySelector(".upload-drop");
const canvasFrame = document.querySelector(".canvas-frame");

const paperColor = "#fffdf7";

const state = {
  color: "#ed254e",
  tool: "brush",
  stamp: null,
  size: Number(brushSize.value),
  isDrawing: false,
  lastPoint: null,
  undo: [],
  redo: [],
  maxHistory: 32,
};

function setupCanvas() {
  clearToPaper();
  drawWelcomeMarks();
  pushHistory();
}

function clearToPaper() {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = paperColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawWelcomeMarks() {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#118ab2";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(145, 160);
  ctx.bezierCurveTo(290, 70, 392, 236, 538, 130);
  ctx.stroke();

  ctx.strokeStyle = "#ed254e";
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(758, 684);
  ctx.bezierCurveTo(896, 548, 1020, 770, 1160, 620);
  ctx.stroke();

  ctx.fillStyle = "#ffd166";
  for (const [x, y, radius] of [
    [1100, 142, 28],
    [170, 660, 20],
    [1010, 250, 16],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function pushHistory() {
  state.undo.push(canvas.toDataURL("image/png"));
  if (state.undo.length > state.maxHistory) {
    state.undo.shift();
  }
  state.redo = [];
  updateHistoryButtons();
}

function restoreImage(dataUrl, callback) {
  const image = new Image();
  image.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    callback?.();
  };
  image.src = dataUrl;
}

function updateHistoryButtons() {
  undoButton.disabled = state.undo.length <= 1;
  redoButton.disabled = state.redo.length === 0;
  undoButton.style.opacity = undoButton.disabled ? "0.45" : "1";
  redoButton.style.opacity = redoButton.disabled ? "0.45" : "1";
}

function setMode(mode) {
  modeTabs.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === mode);
  });

  if (mode === "paint") {
    setActiveActivity("blank");
  }
}

function setActiveActivity(kind, value = null) {
  activityCards.forEach((card) => {
    const active =
      (kind === "blank" && card.dataset.action === "blank") ||
      (kind === "upload" && card.classList.contains("upload-card")) ||
      (kind === "template" && card.dataset.template === value);
    card.classList.toggle("is-active", active);
  });
}

function setTool(tool) {
  state.tool = tool;
  state.stamp = null;
  toolButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tool === tool);
  });
  stampButtons.forEach((button) => button.classList.remove("is-active"));
  canvas.style.cursor = tool === "bucket" ? "copy" : tool === "eraser" ? "cell" : "crosshair";
}

function setStamp(stamp) {
  state.stamp = stamp;
  state.tool = "stamp";
  toolButtons.forEach((button) => button.classList.remove("is-active"));
  stampButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.stamp === stamp);
  });
  canvas.style.cursor = "copy";
}

function setColor(color) {
  state.color = color;
  sizePreview.style.color = color;
  customColor.value = color;
  swatches.forEach((swatch) => {
    swatch.classList.toggle("is-selected", swatch.dataset.color === color);
  });
}

function setSize(size) {
  state.size = size;
  const scale = Math.max(0.22, Math.min(1, size / 58));
  sizePreview.style.setProperty("--preview-scale", scale.toFixed(2));
}

function getPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const source = event.touches?.[0] ?? event.changedTouches?.[0] ?? event;
  return {
    x: Math.max(0, Math.min(canvas.width - 1, ((source.clientX - rect.left) / rect.width) * canvas.width)),
    y: Math.max(0, Math.min(canvas.height - 1, ((source.clientY - rect.top) / rect.height) * canvas.height)),
  };
}

function drawLine(from, to) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = state.tool === "eraser" ? paperColor : state.color;
  ctx.lineWidth = state.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function drawSprinkle(point) {
  const count = Math.max(8, Math.round(state.size / 2));
  ctx.save();
  ctx.fillStyle = state.color;
  ctx.globalAlpha = 0.86;
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * state.size * 1.7;
    const radius = 2 + Math.random() * Math.max(4, state.size / 5);
    ctx.beginPath();
    ctx.arc(point.x + Math.cos(angle) * distance, point.y + Math.sin(angle) * distance, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStamp(point) {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.fillStyle = state.color;
  ctx.strokeStyle = darken(state.color, 0.24);
  ctx.lineWidth = Math.max(3, state.size / 8);
  const scale = state.size / 32;

  if (state.stamp === "star") {
    starPath(0, 0, 32 * scale, 14 * scale, 5);
    ctx.fill();
    ctx.stroke();
  }

  if (state.stamp === "heart") {
    heartPath(0, 2 * scale, 34 * scale);
    ctx.fill();
    ctx.stroke();
  }

  if (state.stamp === "flower") {
    flowerPath(0, 0, 12 * scale, 24 * scale);
  }

  ctx.restore();
}

function starPath(cx, cy, outerRadius, innerRadius, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function heartPath(cx, cy, size) {
  const top = cy - size * 0.26;
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.35);
  ctx.bezierCurveTo(cx - size * 0.5, top, cx - size, cy + size * 0.15, cx - size * 0.5, cy - size * 0.34);
  ctx.bezierCurveTo(cx - size * 0.23, cy - size * 0.62, cx, cy - size * 0.42, cx, cy - size * 0.12);
  ctx.bezierCurveTo(cx, cy - size * 0.42, cx + size * 0.23, cy - size * 0.62, cx + size * 0.5, cy - size * 0.34);
  ctx.bezierCurveTo(cx + size, cy + size * 0.15, cx + size * 0.5, top, cx, cy + size * 0.35);
  ctx.closePath();
}

function flowerPath(cx, cy, petalRadius, distance) {
  ctx.save();
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * distance, cy + Math.sin(angle) * distance, petalRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#ffd166";
  ctx.strokeStyle = "#8a5a00";
  ctx.beginPath();
  ctx.arc(cx, cy, petalRadius * 0.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function fillAt(point) {
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const fill = hexToRgb(state.color);
  const startX = Math.floor(point.x);
  const startY = Math.floor(point.y);
  const startIndex = (startY * canvas.width + startX) * 4;
  const target = [
    data[startIndex],
    data[startIndex + 1],
    data[startIndex + 2],
    data[startIndex + 3],
  ];

  if (colorDistance(target, [fill.r, fill.g, fill.b, 255]) < 8) return false;

  const tolerance = 30;
  const stack = [startY * canvas.width + startX];
  let filled = 0;

  while (stack.length) {
    const pixel = stack.pop();
    const x = pixel % canvas.width;
    const y = Math.floor(pixel / canvas.width);
    const index = pixel * 4;

    if (!matchesTarget(data, index, target, tolerance)) continue;

    data[index] = fill.r;
    data[index + 1] = fill.g;
    data[index + 2] = fill.b;
    data[index + 3] = 255;
    filled += 1;

    if (x > 0) stack.push(pixel - 1);
    if (x < canvas.width - 1) stack.push(pixel + 1);
    if (y > 0) stack.push(pixel - canvas.width);
    if (y < canvas.height - 1) stack.push(pixel + canvas.width);
  }

  if (filled > 0) {
    ctx.putImageData(image, 0, 0);
    return true;
  }
  return false;
}

function matchesTarget(data, index, target, tolerance) {
  return (
    Math.abs(data[index] - target[0]) <= tolerance &&
    Math.abs(data[index + 1] - target[1]) <= tolerance &&
    Math.abs(data[index + 2] - target[2]) <= tolerance &&
    Math.abs(data[index + 3] - target[3]) <= tolerance
  );
}

function colorDistance(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) + Math.abs(a[3] - b[3]);
}

function drawTemplate(template) {
  clearToPaper();
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (template === "rocket") drawRocketTemplate();
  if (template === "castle") drawCastleTemplate();
  if (template === "sea") drawSeaTemplate();
  if (template === "dino") drawDinoTemplate();
  if (template === "garden") drawGardenTemplate();
  if (template === "robot") drawRobotTemplate();
  if (template === "butterfly") drawButterflyTemplate();

  ctx.restore();
  pushHistory();
  setMode("color");
  setActiveActivity("template", template);
  uploadStatus.textContent = "Ready";
}

function templateStroke(width = 8) {
  ctx.strokeStyle = "#25252d";
  ctx.lineWidth = width;
}

function drawRocketTemplate() {
  templateStroke(8);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(640, 96);
  ctx.bezierCurveTo(790, 210, 832, 396, 736, 590);
  ctx.lineTo(550, 636);
  ctx.bezierCurveTo(504, 428, 530, 228, 640, 96);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(548, 539);
  ctx.lineTo(382, 682);
  ctx.lineTo(575, 642);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(731, 522);
  ctx.lineTo(946, 598);
  ctx.lineTo(735, 662);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(656, 286, 68, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(586, 654);
  ctx.bezierCurveTo(568, 715, 610, 746, 640, 780);
  ctx.bezierCurveTo(666, 734, 724, 721, 706, 638);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  drawCloud(196, 230, 0.9);
  drawCloud(1010, 210, 0.7);
  drawStarOutline(240, 620, 36);
  drawStarOutline(1050, 674, 46);
}

function drawCastleTemplate() {
  templateStroke(8);
  ctx.fillStyle = "#ffffff";
  ctx.strokeRect(270, 292, 740, 388);
  ctx.fillRect(270, 292, 740, 388);
  ctx.strokeRect(270, 292, 740, 388);

  for (const x of [230, 472, 808, 990]) {
    ctx.fillRect(x, 190, 110, 490);
    ctx.strokeRect(x, 190, 110, 490);
    for (let i = 0; i < 3; i += 1) {
      ctx.fillRect(x + i * 36, 144, 28, 48);
      ctx.strokeRect(x + i * 36, 144, 28, 48);
    }
  }

  for (let x = 340; x < 905; x += 92) {
    ctx.fillRect(x, 238, 48, 54);
    ctx.strokeRect(x, 238, 48, 54);
  }

  ctx.beginPath();
  ctx.moveTo(584, 680);
  ctx.lineTo(584, 548);
  ctx.bezierCurveTo(584, 478, 696, 478, 696, 548);
  ctx.lineTo(696, 680);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(240, 140);
  ctx.lineTo(240, 70);
  ctx.lineTo(358, 112);
  ctx.lineTo(240, 140);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(1000, 140);
  ctx.lineTo(1000, 70);
  ctx.lineTo(1118, 112);
  ctx.lineTo(1000, 140);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  drawCloud(168, 108, 0.76);
  drawCloud(1060, 214, 0.74);
  drawSun(952, 96, 42);
}

function drawSeaTemplate() {
  templateStroke(8);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(260, 386);
  ctx.bezierCurveTo(432, 190, 760, 188, 946, 390);
  ctx.bezierCurveTo(758, 594, 432, 590, 260, 386);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(942, 390);
  ctx.lineTo(1118, 256);
  ctx.lineTo(1118, 524);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(480, 350, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(620, 254);
  ctx.quadraticCurveTo(680, 390, 620, 528);
  ctx.stroke();

  for (const x of [140, 278, 424, 780, 954]) {
    ctx.beginPath();
    ctx.moveTo(x, 716);
    ctx.bezierCurveTo(x - 46, 628, x + 38, 574, x, 500);
    ctx.stroke();
  }

  drawStarOutline(178, 596, 48);
  drawStarOutline(1038, 660, 34);
  drawBubble(210, 170, 30);
  drawBubble(312, 244, 18);
  drawBubble(1034, 180, 24);

  templateStroke(6);
  ctx.beginPath();
  ctx.moveTo(80, 742);
  ctx.bezierCurveTo(206, 690, 318, 798, 442, 742);
  ctx.bezierCurveTo(566, 688, 704, 796, 832, 742);
  ctx.bezierCurveTo(956, 688, 1054, 796, 1200, 742);
  ctx.stroke();
}

function drawDinoTemplate() {
  templateStroke(8);
  ctx.fillStyle = "#ffffff";

  ctx.beginPath();
  ctx.moveTo(242, 520);
  ctx.bezierCurveTo(300, 220, 616, 170, 844, 334);
  ctx.bezierCurveTo(1032, 466, 878, 670, 596, 632);
  ctx.bezierCurveTo(470, 615, 354, 568, 242, 520);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(840, 334);
  ctx.bezierCurveTo(916, 222, 1018, 212, 1084, 310);
  ctx.bezierCurveTo(1042, 354, 948, 384, 840, 334);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(253, 515);
  ctx.lineTo(104, 648);
  ctx.lineTo(276, 626);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  for (const [x, y] of [
    [378, 250],
    [484, 206],
    [602, 198],
    [718, 230],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 44, y - 104);
    ctx.lineTo(x + 90, y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(968, 300, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  for (const x of [410, 668]) {
    ctx.beginPath();
    ctx.moveTo(x, 610);
    ctx.lineTo(x - 26, 750);
    ctx.lineTo(x + 58, 750);
    ctx.lineTo(x + 42, 620);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawCloud(146, 162, 0.78);
  drawSun(1078, 110, 42);
}

function drawGardenTemplate() {
  templateStroke(7);
  ctx.fillStyle = "#ffffff";

  drawSun(1060, 118, 44);
  drawCloud(142, 148, 0.82);

  for (const [x, y, scale] of [
    [318, 416, 1.06],
    [628, 362, 1.2],
    [948, 438, 0.98],
  ]) {
    drawFlowerOutline(x, y, scale);
  }

  templateStroke(8);
  for (const [x, y] of [
    [208, 650],
    [404, 694],
    [786, 674],
    [1052, 646],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - 32, y - 92, x + 36, y - 128, x, y - 202);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 96);
    ctx.bezierCurveTo(x - 74, y - 144, x - 116, y - 94, x - 74, y - 44);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 112);
    ctx.bezierCurveTo(x + 78, y - 166, x + 120, y - 102, x + 70, y - 54);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(70, 724);
  ctx.bezierCurveTo(236, 682, 348, 772, 516, 724);
  ctx.bezierCurveTo(674, 682, 812, 772, 970, 724);
  ctx.bezierCurveTo(1062, 696, 1146, 710, 1210, 730);
  ctx.stroke();
}

function drawRobotTemplate() {
  templateStroke(8);
  ctx.fillStyle = "#ffffff";

  ctx.beginPath();
  ctx.roundRect?.(380, 218, 520, 392, 42);
  if (!ctx.roundRect) roundedRect(380, 218, 520, 392, 42);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(640, 218);
  ctx.lineTo(640, 110);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(640, 88, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  for (const x of [535, 745]) {
    ctx.beginPath();
    ctx.arc(x, 370, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, 370, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(532, 506);
  ctx.quadraticCurveTo(640, 572, 748, 506);
  ctx.stroke();

  for (const [x1, x2] of [
    [380, 226],
    [900, 1054],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x1, 356);
    ctx.lineTo(x2, 306);
    ctx.lineTo(x2 + (x2 > x1 ? 36 : -36), 396);
    ctx.lineTo(x1, 438);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  for (const x of [510, 718]) {
    ctx.beginPath();
    ctx.moveTo(x, 610);
    ctx.lineTo(x - 52, 746);
    ctx.lineTo(x + 88, 746);
    ctx.lineTo(x + 44, 610);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawStarOutline(206, 204, 42);
  drawStarOutline(1064, 646, 38);
}

function drawButterflyTemplate() {
  templateStroke(8);
  ctx.fillStyle = "#ffffff";

  ctx.beginPath();
  ctx.moveTo(610, 370);
  ctx.bezierCurveTo(356, 20, 112, 246, 254, 492);
  ctx.bezierCurveTo(354, 666, 554, 560, 610, 370);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(670, 370);
  ctx.bezierCurveTo(924, 20, 1168, 246, 1026, 492);
  ctx.bezierCurveTo(926, 666, 726, 560, 670, 370);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(640, 470, 46, 198, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(640, 214, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(610, 174);
  ctx.bezierCurveTo(542, 82, 470, 110, 442, 48);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(670, 174);
  ctx.bezierCurveTo(738, 82, 810, 110, 838, 48);
  ctx.stroke();

  for (const [x, y, radius] of [
    [392, 360, 46],
    [486, 484, 34],
    [888, 360, 46],
    [794, 484, 34],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  drawFlowerOutline(174, 676, 0.76);
  drawFlowerOutline(1106, 676, 0.76);
}

function drawFlowerOutline(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  templateStroke(7);
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * 52, Math.sin(angle) * 52, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 86);
  ctx.lineTo(0, 220);
  ctx.stroke();
  ctx.restore();
}

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  templateStroke(7);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 26, 38, Math.PI, 0);
  ctx.arc(42, 0, 42, Math.PI, 0);
  ctx.arc(90, 25, 36, Math.PI, 0);
  ctx.lineTo(126, 56);
  ctx.lineTo(-36, 56);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSun(x, y, radius) {
  ctx.save();
  templateStroke(7);
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * (radius + 14), y + Math.sin(angle) * (radius + 14));
    ctx.lineTo(x + Math.cos(angle) * (radius + 38), y + Math.sin(angle) * (radius + 38));
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBubble(x, y, radius) {
  ctx.save();
  templateStroke(6);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawStarOutline(x, y, radius) {
  ctx.save();
  templateStroke(6);
  ctx.fillStyle = "#ffffff";
  starPath(x, y, radius, radius * 0.43, 5);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function importImage(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  uploadStatus.textContent = "Loading";
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      clearToPaper();
      const margin = 68;
      const maxWidth = canvas.width - margin * 2;
      const maxHeight = canvas.height - margin * 2;
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const width = image.width * scale;
      const height = image.height * scale;
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;

      ctx.save();
      ctx.fillStyle = "#ffffff";
      roundedRect(x - 18, y - 18, width + 36, height + 36, 24);
      ctx.fill();
      ctx.clip();
      ctx.drawImage(image, x, y, width, height);
      ctx.restore();

      pushHistory();
      setMode("upload");
      setActiveActivity("upload");
      uploadStatus.textContent = "Added";
      uploadInput.value = "";
    };
    image.onerror = () => {
      uploadStatus.textContent = "Try again";
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function clearCanvas() {
  clearToPaper();
  pushHistory();
  setMode("paint");
  setActiveActivity("blank");
  uploadStatus.textContent = "Ready";
}

function savePainting() {
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  link.download = `doodlepop-studio-${stamp}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function undo() {
  if (state.undo.length <= 1) return;
  state.redo.push(state.undo.pop());
  restoreImage(state.undo[state.undo.length - 1], updateHistoryButtons);
}

function redo() {
  if (state.redo.length === 0) return;
  const dataUrl = state.redo.pop();
  state.undo.push(dataUrl);
  restoreImage(dataUrl, updateHistoryButtons);
}

function startDrawing(event) {
  event.preventDefault();
  canvas.setPointerCapture?.(event.pointerId);
  const point = getPoint(event);

  if (state.tool === "bucket") {
    if (fillAt(point)) pushHistory();
    return;
  }

  if (state.tool === "stamp") {
    drawStamp(point);
    pushHistory();
    return;
  }

  state.isDrawing = true;
  state.lastPoint = point;
  if (state.tool === "sprinkle") {
    drawSprinkle(point);
  } else {
    drawLine(point, point);
  }
}

function moveDrawing(event) {
  if (!state.isDrawing) return;
  event.preventDefault();
  const point = getPoint(event);
  if (state.tool === "sprinkle") {
    drawSprinkle(point);
  } else {
    drawLine(state.lastPoint, point);
  }
  state.lastPoint = point;
}

function stopDrawing(event) {
  if (!state.isDrawing) return;
  if (event?.pointerId !== undefined) {
    canvas.releasePointerCapture?.(event.pointerId);
  }
  state.isDrawing = false;
  state.lastPoint = null;
  pushHistory();
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((part) => part + part)
          .join("")
      : value;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function darken(hex, amount) {
  const rgb = hexToRgb(hex);
  return `rgb(${[rgb.r, rgb.g, rgb.b].map((part) => Math.max(0, Math.floor(part * (1 - amount)))).join(", ")})`;
}

modeTabs.forEach((button) => {
  button.addEventListener("click", () => {
    setMode(button.dataset.mode);
    if (button.dataset.mode === "upload") {
      uploadInput.click();
    }
  });
});

toolButtons.forEach((button) => {
  button.addEventListener("click", () => setTool(button.dataset.tool));
});

stampButtons.forEach((button) => {
  button.addEventListener("click", () => setStamp(button.dataset.stamp));
});

swatches.forEach((swatch) => {
  swatch.addEventListener("click", () => setColor(swatch.dataset.color));
});

templateButtons.forEach((button) => {
  button.addEventListener("click", () => drawTemplate(button.dataset.template));
});

document.querySelector("[data-action='blank']").addEventListener("click", clearCanvas);
customColor.addEventListener("input", (event) => setColor(event.target.value));
brushSize.addEventListener("input", (event) => setSize(Number(event.target.value)));
undoButton.addEventListener("click", undo);
redoButton.addEventListener("click", redo);
clearButton.addEventListener("click", clearCanvas);
saveButton.addEventListener("click", savePainting);
uploadInput.addEventListener("change", (event) => importImage(event.target.files?.[0]));

for (const dropTarget of [uploadDrop, canvasFrame]) {
  dropTarget.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropTarget.classList.add("is-dragging");
  });
  dropTarget.addEventListener("dragleave", () => {
    dropTarget.classList.remove("is-dragging");
  });
  dropTarget.addEventListener("drop", (event) => {
    event.preventDefault();
    dropTarget.classList.remove("is-dragging");
    importImage(event.dataTransfer.files?.[0]);
  });
}

canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", moveDrawing);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointerleave", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);

setColor(state.color);
setSize(state.size);
setupCanvas();
