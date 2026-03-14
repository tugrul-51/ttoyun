export function spawnConfetti(n = 30) {
  const cols = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A8E6CF", "#FF8A5C", "#6C5CE7", "#FD79A8", "#00B894", "#E17055"];
  for (let i = 0; i < n; i++) {
    const d = document.createElement("div");
    d.style.cssText = "position:fixed;top:-10px;left:" + Math.random() * 100 + "%;width:" + (5 + Math.random() * 10) + "px;height:" + (5 + Math.random() * 10) + "px;background:" + cols[i % cols.length] + ";border-radius:" + (Math.random() > .5 ? "50%" : "2px") + ";pointer-events:none;z-index:9999;animation:confFall " + (1 + Math.random()) + "s " + Math.random() * .4 + "s ease-out forwards";
    document.body.appendChild(d);
    setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d) }, 3000);
  }
}

export function spawnEmoji(emoji, x = 50, y = 50) {
  const d = document.createElement("div");
  d.textContent = emoji;
  d.style.cssText = "position:fixed;left:" + x + "%;top:" + y + "%;font-size:48px;pointer-events:none;z-index:9999;animation:emojiPop .8s ease-out forwards;transform:translate(-50%,-50%)";
  document.body.appendChild(d);
  setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d) }, 1000);
}

export function shakeEl(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.animation = "shake .4s ease-in-out";
    setTimeout(() => { if (el) el.style.animation = "" }, 500);
  }
}