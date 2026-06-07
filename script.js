/* ============================================================
   ROMANTIC INTERACTIVE EXPERIENCE — script.js
   ทุก Scene Logic, Animation, Particle System, Flower Canvas
   เขียนด้วย Vanilla JavaScript ล้วน (ไม่มี Framework)
   ============================================================ */

/* ============================================================
   SECTION 1: CONSTANTS & STATE
   ตัวแปรสถานะของโปรแกรม
   ============================================================ */

// สถานะปัจจุบันของฉาก
let currentScene = 'scene1';

// หยุด particle loop หรือไม่ (ใช้ตอน cleanup)
let particleRunning = true;

// หยุด flower loop หรือไม่
let flowerRunning = false;

// เก็บ requestAnimationFrame id เพื่อ cancel ได้
let particleRAF = null;
let flowerRAF  = null;

/* ============================================================
   SECTION 2: PARTICLE BACKGROUND SYSTEM
   วาด particle ลอยอยู่เบื้องหลังด้วย Canvas API
   ใช้ requestAnimationFrame เพื่อให้ smooth 60FPS
   ============================================================ */

const pCanvas = document.getElementById('particleCanvas');
const pCtx    = pCanvas.getContext('2d');

// กำหนดจำนวน particle ตามขนาดหน้าจอ
const PARTICLE_COUNT = Math.min(Math.floor(window.innerWidth * window.innerHeight / 6000), 120);

// Array เก็บ particle ทุกตัว
let particles = [];

/**
 * Particle class — แต่ละ particle มีตำแหน่ง ความเร็ว สี ขนาด
 * ใช้ CSS transform แนวคิด (compute ใน JS แล้วใช้ canvas)
 */
class Particle {
  constructor() {
    this.reset();
  }

  /** สุ่มค่าเริ่มต้น */
  reset() {
    this.x     = Math.random() * pCanvas.width;
    this.y     = Math.random() * pCanvas.height;
    this.vx    = (Math.random() - 0.5) * 0.4; // ความเร็วแนวนอน
    this.vy    = -(Math.random() * 0.5 + 0.1); // ลอยขึ้นเสมอ
    this.size  = Math.random() * 2.5 + 0.5;    // ขนาด
    this.alpha = Math.random() * 0.6 + 0.1;    // ความโปร่งใส
    this.life  = 1;                             // ชีวิต (1 = เต็ม, 0 = ตาย)
    this.decay = Math.random() * 0.003 + 0.001; // อัตราสลาย

    // สีสุ่มระหว่าง neon pink กับ white
    const hue = Math.random() < 0.7 ? 330 + Math.random() * 20 : 0;
    const sat = hue === 0 ? '0%' : '80%';
    const lig = hue === 0 ? '100%' : '65%';
    this.color = `hsl(${hue}, ${sat}, ${lig})`;
  }

  /** อัปเดตตำแหน่งทุก frame */
  update() {
    this.x    += this.vx;
    this.y    += this.vy;
    this.life -= this.decay;
    this.alpha = this.life * 0.7;

    // ถ้าตายหรือออกนอกจอ → reset
    if (this.life <= 0 || this.y < -10) {
      this.reset();
      this.y = pCanvas.height + 10; // เริ่มจากล่าง
    }
  }

  /** วาด particle บน canvas */
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle   = this.color;
    ctx.shadowBlur  = 8;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** ปรับขนาด canvas ให้ตรงกับหน้าจอ (retina-friendly) */
function resizeParticleCanvas() {
  const dpr = window.devicePixelRatio || 1;
  pCanvas.width  = window.innerWidth  * dpr;
  pCanvas.height = window.innerHeight * dpr;
  pCanvas.style.width  = window.innerWidth  + 'px';
  pCanvas.style.height = window.innerHeight + 'px';
  pCtx.scale(dpr, dpr);
}

/** สร้าง particle ทั้งหมด */
function initParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = new Particle();
    // กระจาย y แบบสุ่มทั่วหน้าจอตอนเริ่ม (ไม่ให้กองอยู่ล่าง)
    p.y = Math.random() * pCanvas.height;
    particles.push(p);
  }
}

/** Animation loop ของ particle — เรียกด้วย requestAnimationFrame */
function animateParticles() {
  if (!particleRunning) return;

  // ล้าง canvas ด้วย fade effect (ไม่ใช่ clearRect เต็ม เพื่อให้มี trail)
  pCtx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  pCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  // อัปเดตและวาดทุก particle
  for (const p of particles) {
    p.update();
    p.draw(pCtx);
  }

  particleRAF = requestAnimationFrame(animateParticles);
}

/* ============================================================
   SECTION 3: FLOWER CANVAS SYSTEM
   วาดดอกไม้จำนวนมากด้วย Canvas — procedural drawing
   รองรับ 100-200 ดอก พร้อม Parallax Depth Effect
   ============================================================ */

const fCanvas = document.getElementById('flowerCanvas');
const fCtx    = fCanvas.getContext('2d');

// ชนิดดอกไม้: กุหลาบ, ทิวลิป, ซากุระ, เดซี่, ลิลลี่
const FLOWER_TYPES = ['rose', 'tulip', 'sakura', 'daisy', 'lily'];

// จำนวนดอกไม้ทั้งหมด
const FLOWER_COUNT = 150;

// Array เก็บดอกไม้ทุกดอก
let flowers = [];

/** ปรับขนาด flower canvas */
function resizeFlowerCanvas() {
  const dpr = window.devicePixelRatio || 1;
  fCanvas.width  = window.innerWidth  * dpr;
  fCanvas.height = window.innerHeight * dpr;
  fCanvas.style.width  = window.innerWidth  + 'px';
  fCanvas.style.height = window.innerHeight + 'px';
  fCtx.scale(dpr, dpr);
}

/**
 * Flower class — แต่ละดอกไม้มีชนิด ตำแหน่ง ขนาด ความลึก ความเร็ว
 * ใช้ depth เพื่อสร้าง Parallax Effect (ดอกใกล้เคลื่อนเร็ว ไกลเคลื่อนช้า)
 */
class Flower {
  constructor(startFromBottom = false) {
    this.init(startFromBottom);
  }

  init(fromBottom = false) {
    this.type    = FLOWER_TYPES[Math.floor(Math.random() * FLOWER_TYPES.length)];
    this.x       = Math.random() * window.innerWidth;
    this.y       = fromBottom
      ? window.innerHeight + Math.random() * 200 + 50
      : Math.random() * window.innerHeight;

    // depth: 0.3 (ไกล/เล็ก/ช้า) — 1.0 (ใกล้/ใหญ่/เร็ว)
    this.depth   = Math.random() * 0.7 + 0.3;
    this.size    = (Math.random() * 22 + 12) * this.depth;
    this.alpha   = Math.random() * 0.5 + 0.4;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.025 * this.depth;

    // ลอยขึ้น — ดอกใกล้ลอยเร็วกว่า (parallax)
    this.vy   = -(Math.random() * 1.2 + 0.4) * this.depth;
    this.vx   = (Math.random() - 0.5) * 0.8 * this.depth;

    // Sine wave โยกซ้ายขวา
    this.sineOffset = Math.random() * Math.PI * 2;
    this.sineAmp    = Math.random() * 30 + 10;
    this.sineSpeed  = Math.random() * 0.02 + 0.008;
    this.sineTime   = 0;

    // สีตามชนิด
    this.setColor();

    // scale animation (bloom effect)
    this.scale      = 0.1;
    this.targetScale = 1;
    this.blooming   = true;
  }

  /** กำหนดสีตามชนิดดอก */
  setColor() {
    const colors = {
      rose:   ['#ff2d78', '#e91e8c', '#ff6ba8', '#c2185b'],
      tulip:  ['#ff7eb3', '#ff3f9b', '#ff9ec4', '#e0006e'],
      sakura: ['#ffb7d5', '#ffd6e7', '#ff8fb3', '#f48eb1'],
      daisy:  ['#fffde7', '#fff9c4', '#ffecb3', '#fff'],
      lily:   ['#e040fb', '#ce93d8', '#ba68c8', '#ab47bc'],
    };
    const arr = colors[this.type];
    this.color  = arr[Math.floor(Math.random() * arr.length)];
    this.color2 = arr[Math.floor(Math.random() * arr.length)];

    // สีแกนดอก
    const cores = {
      rose:   '#7a0026',
      tulip:  '#b71c6e',
      sakura: '#c2185b',
      daisy:  '#f9a825',
      lily:   '#6a0080',
    };
    this.coreColor = cores[this.type];
  }

  /** อัปเดตตำแหน่งทุก frame */
  update() {
    this.sineTime += this.sineSpeed;
    this.x        += this.vx + Math.sin(this.sineTime + this.sineOffset) * 0.4;
    this.y        += this.vy;
    this.rotation += this.rotSpeed;

    // bloom scale animation
    if (this.blooming && this.scale < this.targetScale) {
      this.scale += 0.03;
      if (this.scale >= this.targetScale) {
        this.scale   = this.targetScale;
        this.blooming = false;
      }
    }

    // ถ้าออกนอกหน้าจอ (บน/ซ้าย/ขวา) → เริ่มใหม่จากล่าง
    if (
      this.y < -this.size * 2 ||
      this.x < -this.size * 2 ||
      this.x > window.innerWidth + this.size * 2
    ) {
      this.init(true);
    }
  }

  /** วาดดอกไม้ลงบน canvas context */
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha * Math.min(this.scale, 1);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale, this.scale);

    // เลือก drawing function ตามชนิด
    switch (this.type) {
      case 'rose':   this.drawRose(ctx);   break;
      case 'tulip':  this.drawTulip(ctx);  break;
      case 'sakura': this.drawSakura(ctx); break;
      case 'daisy':  this.drawDaisy(ctx);  break;
      case 'lily':   this.drawLily(ctx);   break;
    }

    ctx.restore();
  }

  /** วาดดอกกุหลาบ — วงกลมซ้อนกันหลายชั้น */
  drawRose(ctx) {
    const r = this.size;

    // กลีบชั้นนอก
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const grd = ctx.createRadialGradient(
        Math.cos(angle) * r * 0.4, Math.sin(angle) * r * 0.4, 0,
        Math.cos(angle) * r * 0.4, Math.sin(angle) * r * 0.4, r * 0.7
      );
      grd.addColorStop(0, this.color);
      grd.addColorStop(1, this.color2);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(angle) * r * 0.45,
        Math.sin(angle) * r * 0.45,
        r * 0.52, r * 0.38,
        angle, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // กลีบชั้นใน
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + 0.3;
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha * 0.85 * Math.min(this.scale, 1);
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(angle) * r * 0.22,
        Math.sin(angle) * r * 0.22,
        r * 0.34, r * 0.25,
        angle, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // แกนกลาง
    ctx.globalAlpha = this.alpha * Math.min(this.scale, 1);
    ctx.fillStyle = this.coreColor;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // highlight
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-r * 0.08, -r * 0.08, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  /** วาดดอกทิวลิป — รูประฆัง */
  drawTulip(ctx) {
    const r = this.size;
    const grd = ctx.createRadialGradient(0, -r * 0.2, 0, 0, 0, r);
    grd.addColorStop(0, this.color);
    grd.addColorStop(1, this.color2);
    ctx.fillStyle = grd;

    // ดอก 3 กลีบ
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(angle) * r * 0.3,
        Math.sin(angle) * r * 0.3 - r * 0.1,
        r * 0.38, r * 0.58,
        angle + Math.PI / 2, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // แกน
    ctx.fillStyle = this.coreColor;
    ctx.beginPath();
    ctx.arc(0, -r * 0.05, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  /** วาดดอกซากุระ — กลีบ 5 แฉก หัวใจ */
  drawSakura(ctx) {
    const r = this.size;
    ctx.fillStyle = this.color;

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const cx = Math.cos(angle) * r * 0.38;
      const cy = Math.sin(angle) * r * 0.38;
      ctx.beginPath();
      // กลีบรูปหัวใจเล็กๆ
      ctx.ellipse(cx, cy, r * 0.3, r * 0.42, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    // แกนเหลือง
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // จุดเกสร
    ctx.fillStyle = '#f9a825';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * r * 0.12, Math.sin(angle) * r * 0.12, r * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** วาดดอกเดซี่ — กลีบยาวรอบแกนสีเหลือง */
  drawDaisy(ctx) {
    const r = this.size;
    const petalCount = 12;

    ctx.fillStyle = this.color;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(angle) * r * 0.52,
        Math.sin(angle) * r * 0.52,
        r * 0.16, r * 0.38,
        angle, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // แกนสีเหลือง
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.28);
    grd.addColorStop(0, '#fff176');
    grd.addColorStop(1, '#f9a825');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  /** วาดดอกลิลลี่ — กลีบ 6 แฉกโค้ง */
  drawLily(ctx) {
    const r = this.size;
    const grd = ctx.createLinearGradient(0, -r, 0, r);
    grd.addColorStop(0, this.color);
    grd.addColorStop(1, this.color2);
    ctx.fillStyle = grd;

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(angle) * r * 0.42,
        Math.sin(angle) * r * 0.42,
        r * 0.22, r * 0.5,
        angle, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // แกนม่วงเข้ม
    ctx.fillStyle = this.coreColor;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // จุดเกสร
    ctx.fillStyle = '#ffcc80';
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * r * 0.1, Math.sin(angle) * r * 0.1, r * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** สร้างดอกไม้ทั้งหมด */
function initFlowers() {
  flowers = [];
  for (let i = 0; i < FLOWER_COUNT; i++) {
    const f = new Flower(false);
    // กระจาย y ทั่วหน้าจอตอนเริ่ม ไม่กองอยู่ล่าง
    f.y = Math.random() * (window.innerHeight * 1.5) + window.innerHeight;
    f.scale = Math.random() * 0.8 + 0.2;
    f.blooming = false;
    flowers.push(f);
  }
}

/** Animation loop ของดอกไม้ */
function animateFlowers() {
  if (!flowerRunning) return;

  // ล้าง canvas ดอกไม้ด้วย transparent เต็ม (ไม่มี trail)
  fCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  // วาดทุกดอก — เรียงจาก depth น้อย (ไกล) ไป depth มาก (ใกล้) เพื่อ depth effect
  const sorted = [...flowers].sort((a, b) => a.depth - b.depth);
  for (const f of sorted) {
    f.update();
    f.draw(fCtx);
  }

  flowerRAF = requestAnimationFrame(animateFlowers);
}

/* ============================================================
   SECTION 4: UTILITY FUNCTIONS
   ฟังก์ชันช่วยเหลือทั่วไป
   ============================================================ */

/**
 * delay — รอเวลาด้วย Promise
 * @param {number} ms - มิลลิวินาที
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * fadeOut scene — ค่อยๆ ซ่อน scene ด้วย opacity
 * @param {HTMLElement} el - element ที่จะ fade out
 * @param {number} dur - ระยะเวลา ms
 */
function fadeOut(el, dur = 800) {
  return new Promise(resolve => {
    el.style.transition = `opacity ${dur}ms ease`;
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
    setTimeout(() => {
      el.classList.add('hidden');
      el.style.opacity = '';
      el.style.transition = '';
      resolve();
    }, dur);
  });
}

/**
 * fadeIn scene — ค่อยๆ แสดง scene ด้วย opacity
 * @param {HTMLElement} el - element ที่จะ fade in
 * @param {number} dur - ระยะเวลา ms
 */
function fadeIn(el, dur = 800) {
  return new Promise(resolve => {
    el.classList.remove('hidden');
    el.style.opacity = '0';
    el.style.transition = `opacity ${dur}ms ease`;
    // รอ 1 frame ให้ browser รับรู้การเปลี่ยนแปลง
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        setTimeout(() => {
          el.style.opacity = '';
          el.style.transition = '';
          resolve();
        }, dur);
      });
    });
  });
}

/**
 * typewriter — พิมพ์ข้อความทีละตัวอักษร
 * @param {HTMLElement} el - element ที่จะแสดงข้อความ
 * @param {string} text - ข้อความที่จะพิมพ์
 * @param {number} speed - ช่องว่างระหว่างตัวอักษร ms
 * @param {boolean} showCursor - แสดง cursor กระพริบ
 */
function typewriter(el, text, speed = 80, showCursor = true) {
  return new Promise(resolve => {
    el.textContent = '';

    // สร้าง cursor element
    let cursor = null;
    if (showCursor) {
      cursor = document.createElement('span');
      cursor.className = 'cursor';
      el.appendChild(cursor);
    }

    let i = 0;
    function type() {
      if (i < text.length) {
        // แทรกตัวอักษรก่อน cursor
        const char = document.createTextNode(text[i]);
        if (cursor) {
          el.insertBefore(char, cursor);
        } else {
          el.appendChild(char);
        }
        i++;
        setTimeout(type, speed);
      } else {
        // พิมพ์เสร็จ — ลบ cursor หลัง delay สั้นๆ
        setTimeout(() => {
          if (cursor) cursor.remove();
          resolve();
        }, 300);
      }
    }
    type();
  });
}

/* ============================================================
   SECTION 5: SCENE TRANSITIONS
   ฟังก์ชันควบคุมการเปลี่ยนฉาก
   ============================================================ */

/**
 * SCENE 1 → SCENE 2
 * กดปุ่ม "ช่วยรับดอกไม้นี้ไว้ได้ไหม"
 */
async function goToScene2() {
  const s1 = document.getElementById('scene1');
  const s2 = document.getElementById('scene2');
  const textEl = document.getElementById('scene2Text');

  // Fade out scene 1
  await fadeOut(s1, 900);

  // Fade in scene 2
  await fadeIn(s2, 700);

  // แสดงข้อความ "เย้" → "เย้." → "เย้.." → "เย้..."
  // แต่ละขั้นรอก่อนแล้ว fade เปลี่ยน
  const stages = ['เย้', 'เย้.', 'เย้..', 'เย้...'];

  for (let i = 0; i < stages.length; i++) {
    // fade out ข้อความเก่า
    if (i > 0) {
      textEl.style.transition = 'opacity 0.3s ease';
      textEl.style.opacity = '0';
      await delay(350);
    }

    textEl.textContent = stages[i];
    textEl.style.opacity = '0';
    textEl.style.transition = 'opacity 0.4s ease';

    // รอ 1 frame
    await delay(20);
    textEl.style.opacity = '1';
    await delay(i === 0 ? 600 : 500); // เย้ รอนานกว่า
  }

  // รอสักครู่
  await delay(800);

  // ไปฉาก 3
  await goToScene3();
}

/**
 * SCENE 3: "เหนื่อยไหมที่รัก..." พร้อม typewriter
 * จากนั้นแสดงปุ่มตัวเลือก
 */
async function goToScene3() {
  const s2 = document.getElementById('scene2');
  const s3 = document.getElementById('scene3');
  const textEl = document.getElementById('scene3Text');
  const btnGroup = document.getElementById('btnGroup3');

  await fadeOut(s2, 800);
  await fadeIn(s3, 700);

  // Typewriter effect ข้อความ
  await typewriter(textEl, 'เหนื่อยไหมที่รัก...', 90, true);

  await delay(400);

  // แสดงปุ่ม
  btnGroup.classList.remove('hidden');
  btnGroup.classList.add('show');
}

/**
 * SCENE 4A: กด "เหนื่อย"
 * แสดง ":< " พร้อม bounce แล้วไปฉาก 5
 */
async function goToScene4A() {
  const s3    = document.getElementById('scene3');
  const s4a   = document.getElementById('scene4a');
  const react = document.getElementById('react4a');

  await fadeOut(s3, 700);
  await fadeIn(s4a, 600);

  // ตรวจสอบ animation ทำงาน (animation class ถูก add อัตโนมัติจาก CSS)
  react.style.animation = 'none';
  // force reflow
  void react.offsetWidth;
  react.style.animation = '';

  // รอ 2 วินาที แล้วไปฉาก 5
  await delay(2200);
  await goToScene5(s4a);
}

/**
 * SCENE 4B: กด "ไม่เหนื่อย"
 * แสดง ":>" พร้อม bounce แล้วไปฉาก 5
 */
async function goToScene4B() {
  const s3    = document.getElementById('scene3');
  const s4b   = document.getElementById('scene4b');
  const react = document.getElementById('react4b');

  await fadeOut(s3, 700);
  await fadeIn(s4b, 600);

  react.style.animation = 'none';
  void react.offsetWidth;
  react.style.animation = '';

  await delay(2200);
  await goToScene5(s4b);
}

/**
 * SCENE 5: กลับมาดอกกุหลาบ + ปุ่ม "รับดอกไม้"
 * @param {HTMLElement} prevScene - scene ก่อนหน้าที่จะ fade out
 */
async function goToScene5(prevScene) {
  const s5 = document.getElementById('scene5');

  await fadeOut(prevScene, 700);
  await fadeIn(s5, 800);
}

/**
 * SCENE 6: กด "รับดอกไม้" → "ไม่ให้หรอก!" → "ฮ่ะๆๆ"
 */
async function goToScene6() {
  const s5    = document.getElementById('scene5');
  const s6    = document.getElementById('scene6');
  const textEl = document.getElementById('scene6Text');

  await fadeOut(s5, 700);
  await fadeIn(s6, 600);

  // พิมพ์ "ไม่ให้หรอก!" แบบ typewriter
  await typewriter(textEl, 'ไม่ให้หรอก!', 80, false);

  await delay(900);

  // Fade ข้อความออก แล้วเปลี่ยนเป็น "ฮ่ะๆๆ"
  textEl.style.transition = 'opacity 0.4s ease';
  textEl.style.opacity = '0';
  await delay(450);

  textEl.textContent = '';
  textEl.classList.add('teasing');
  textEl.style.opacity = '1';

  await typewriter(textEl, 'ฮ่ะๆๆ', 120, false);

  await delay(1200);

  // ไปฉาก 7
  await goToScene7();
}

/**
 * SCENE 7: จุด Cinematic "." ".." "..."
 * หน้าจอดำ จุดปรากฏทีละตัว
 */
async function goToScene7() {
  const s6   = document.getElementById('scene6');
  const s7   = document.getElementById('scene7');
  const dots = document.getElementById('cinematicDots');

  await fadeOut(s6, 900);
  await fadeIn(s7, 800);

  // จุดทีละตัว
  const stages = ['.', '..', '...'];
  for (let i = 0; i < stages.length; i++) {
    dots.style.transition = 'opacity 0.5s ease';
    dots.style.opacity = '0';
    await delay(600);
    dots.textContent = stages[i];
    dots.style.opacity = '1';
    await delay(900);
  }

  await delay(600);

  // ไปฉาก Ending (scene 8-12)
  await goToSceneEnding(s7);
}

/**
 * SCENE ENDING (8-12):
 * พื้นหลังเปลี่ยน → RGB Neon → ดอกไม้บาน → ข้อความความรัก → สุดท้าย ❤️
 * @param {HTMLElement} prevScene
 */
async function goToSceneEnding(prevScene) {
  const sEnd   = document.getElementById('sceneEnding');
  const msgEl  = document.getElementById('endingMessage');
  const final  = document.getElementById('finalEnding');
  const heart  = document.getElementById('heartFinal');

  await fadeOut(prevScene, 800);
  await fadeIn(sEnd, 700);

  /* ------ SCENE 8: พื้นหลังค่อยๆ เปลี่ยนเป็นขาว ------ */
  await delay(400);
  document.body.classList.add('bg-transitioning');
  await delay(3000);
  document.body.classList.remove('bg-transitioning');
  document.body.classList.add('bg-white');

  /* ------ SCENE 9: เปิด RGB Neon + เริ่ม Flower Canvas ------ */
  // เปิด flower canvas
  resizeFlowerCanvas();
  initFlowers();
  flowerRunning = true;
  fCanvas.classList.add('visible');
  animateFlowers();

  await delay(500);

  /* ------ SCENE 10: ดอกไม้ผุดขึ้น (ดำเนินอยู่แล้ว) ------ */
  // รีเซ็ต y ของดอกทุกดอกให้อยู่ล่างจอ เพื่อให้ "ผุดขึ้น" พร้อมกัน
  for (const f of flowers) {
    f.y = window.innerHeight + Math.random() * 300 + f.size;
    f.scale = 0.1;
    f.blooming = true;
    f.targetScale = Math.random() * 0.5 + 0.5;
  }

  // รอให้ดอกไม้บานพอสมควร
  await delay(1500);

  /* ------ SCENE 11: ข้อความความรักเปลี่ยนทีละอัน ------ */
  const messages = [
    'รักนะ',
    'นี่ดอกไม้ของคนเก่ง',
    'ตั้งใจทำงานนะคะ',
    'กำลังใจจากเค้า',
    'อยู่ในนี้เสมอนะ',
    'รักตลอดไป',
  ];

  msgEl.style.display = 'block';

  for (let i = 0; i < messages.length; i++) {
    // Fade in ข้อความ
    msgEl.style.transition = 'opacity 0.8s ease';
    msgEl.style.opacity = '0';
    await delay(50);
    msgEl.textContent = messages[i];
    msgEl.style.opacity = '1';

    // Hold ข้อความไว้
    await delay(i < messages.length - 1 ? 2000 : 1200);

    // Fade out (ยกเว้นข้อความสุดท้าย)
    if (i < messages.length - 1) {
      msgEl.style.opacity = '0';
      await delay(800);
    }
  }

  /* ------ SCENE 12: "รักตลอดไป" + 🐱🐶 ------ */
  // ซ่อน endingMessage
  msgEl.style.opacity = '0';
  await delay(700);
  msgEl.style.display = 'none';

  // แสดง final ending
  final.classList.remove('hidden');
  final.classList.add('show');

  await delay(3000);

  /* ------ ENDING: ❤️ ------ */
  final.style.transition = 'opacity 1s ease';
  final.style.opacity = '0';
  await delay(1000);
  final.style.display = 'none';

  // แสดง ❤️
  heart.classList.remove('hidden');
  heart.classList.add('show');

  // หัวใจอยู่ตลอดไป พร้อมดอกไม้ลอย และ RGB neon
}

/* ============================================================
   SECTION 6: RESIZE HANDLER
   ปรับ canvas เมื่อขนาดหน้าจอเปลี่ยน
   ใช้ debounce เพื่อลด performance hit
   ============================================================ */

let resizeTimer = null;

window.addEventListener('resize', () => {
  // debounce 200ms
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeParticleCanvas();
    if (flowerRunning) resizeFlowerCanvas();
  }, 200);
});

/* ============================================================
   SECTION 7: INIT — เริ่มต้นโปรแกรม
   ============================================================ */

/**
 * init() — เรียกครั้งเดียวตอนโหลดหน้า
 * ตั้งค่า canvas และเริ่ม particle animation
 */
function init() {
  // ตั้งค่า particle canvas
  resizeParticleCanvas();
  initParticles();
  animateParticles();

  // Preload: สร้าง flower objects ไว้รอ (ยังไม่แสดง)
  resizeFlowerCanvas();
}

// เริ่มทำงานเมื่อ DOM พร้อม
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* ============================================================
   SECTION 8: KEYBOARD SHORTCUT (DEV)
   กด Escape เพื่อ skip ไป ending (สำหรับทดสอบ)
   สามารถลบออกได้เมื่อใช้งานจริง
   ============================================================ */
document.addEventListener('keydown', (e) => {
  // กด 'R' เพื่อ reload
  if (e.key === 'r' || e.key === 'R') {
    if (!e.ctrlKey && !e.metaKey) {
      window.location.reload();
    }
  }
});
