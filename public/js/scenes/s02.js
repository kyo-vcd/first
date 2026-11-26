/* =========================================================
   SCENE 02 — 화폐에서 생명으로 (구호 키트)
   방식: 클릭 + 상태 단계형
   ---------------------------------------------------------
   부모 영역 : .scene-02          고정 화면 : .sticky-screen
   변경 대상 : .s02-title (질문 2개), .s02-make (버튼), .s02-fx (동전 더미 · 흩어짐 canvas),
               .s02-item (물품 15개), .s02-crate (상자 앞판)
   실행 조건
     클릭  "긴급 구호 키트 만들기" → 동전이 흩어지고 물품이 튀어나온다 (.is-made)
     step 1 (0.22~)  버튼을 누르지 않았으면 자동으로 만든다
     step 2 (0.50~)  상자가 올라오고 물품이 상자 안으로 (CSS)
     step 3 (0.78~)  "그렇다면 이 물품들이 모인 전장의 병원은 안전할까요?"
   유지 조건 : 금액은 S01 에서 고른 금액의 86% (Story.shared.amount)
   ========================================================= */
(function () {
  'use strict';

  var u = Story.util;
  var STEPS = [0.22, 0.5, 0.78];
  var COIN_SRC = ['gold_1', 'gold_2', 'gold_3', 'gold_4', 'blood_1'];
  var GRAVITY = 1400;

  Story.register('s02', function (root) {
    var $ = function (s) { return root.querySelector(s); };
    var stage = $('.s02-stage');
    var btn = $('.s02-make');
    var amountEls = root.querySelectorAll('.s02-amount');
    var canvas = $('.s02-fx');
    var ctx = canvas.getContext('2d');
    var dust = u.embers($('.s02-dust'), {
      rate: 10, speed: 25, size: 1.4, alpha: 0.6,
      colors: ['#f2c25a', '#d6a23a', '#ffe19a'],
      area: function (w, h) { return { x: w * (0.25 + Math.random() * 0.55), y: h * (0.5 + Math.random() * 0.4) }; }
    });

    var imgs = COIN_SRC.map(function (n) { var i = new Image(); i.src = 'images/s01/coin_' + n + '.png'; return i; });
    var coins = [];          // 동전 더미 (흩어지면 날아감)
    var sparks = [];
    var made = false, raf = 0, last = 0, w = 0, h = 0, dpr = 1, r = 12;

    /* ---------- 동전 더미: 금액에 비례 (1만 원 = 86개 → 최대 140개) ---------- */
    function layoutPile() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      if (made) return;
      var n = Math.min(140, Math.round(86 * Math.sqrt(Story.shared.amount / 10000)));
      var sw = stage.clientWidth;
      r = Math.max(6, sw * 0.018);
      var cx = w * 0.5 + w * 0.017, base = h * (0.2 / 1.2 + 0.88 * (1 / 1.2));   // 무대 아래쪽
      var cols = Math.max(8, Math.round(Math.sqrt(n * 3)));          // 낮은 언덕 모양 (시안)
      coins = [];
      for (var i = 0, row = 0; i < n; row++) {
        var inRow = Math.max(2, Math.round(cols - row * 1.5));
        for (var c = 0; c < inRow && i < n; c++, i++) {
          coins.push({
            x: cx + (c - (inRow - 1) / 2) * r * 2 + (row % 2 ? r * 0.3 : 0),
            y: base - row * r * 1.7,
            vx: 0, vy: 0, a: 1, rot: (i * 2.39996) % 6.28, vr: 0, img: imgs[i % 10 === 7 ? 4 : i % 4]
          });
        }
      }
      draw();
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      coins.forEach(function (c) {
        if (c.a <= 0) return;
        ctx.globalAlpha = c.a;
        if (c.img.complete && c.img.naturalWidth) {
          ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot);
          ctx.drawImage(c.img, -r, -r, r * 2, r * 2);
          ctx.restore();
        } else {
          ctx.fillStyle = '#c99630'; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
        }
      });
      ctx.globalCompositeOperation = 'lighter';
      sparks.forEach(function (s) {
        ctx.globalAlpha = Math.max(0, 1 - s.t / s.max);
        ctx.fillStyle = s.c;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    function loop(now) {
      var dt = Math.min((now - last) / 1000, 0.04); last = now;
      var alive = false;
      coins.forEach(function (c) {
        if (c.a <= 0) return;
        c.vy += GRAVITY * dt * 0.35;
        c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt;
        c.a -= dt * 0.9;
        alive = true;
      });
      sparks.forEach(function (s) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 60 * dt; });
      sparks = sparks.filter(function (s) { return s.t < s.max; });
      draw();
      if (alive || sparks.length) raf = requestAnimationFrame(loop);
      else raf = 0;
    }

    /* ---------- 클릭: 동전 → 물품 ---------- */
    function make(mode) {
      if (made) return;
      made = true;
      btn.disabled = true;
      btn.textContent = '키트를 만들었습니다';
      var cx = w * 0.52, cy = h * 0.7;
      coins.forEach(function (c) {
        var ang = Math.atan2(c.y - cy - 40, c.x - cx) + (Math.random() - 0.5) * 0.6;
        var sp = 300 + Math.random() * 520;
        c.vx = Math.cos(ang) * sp * 0.8;
        c.vy = -Math.abs(Math.sin(ang) * sp) - 200;
        c.vr = (Math.random() - 0.5) * 10;
      });
      for (var i = 0; i < 90; i++) {
        var a = Math.random() * Math.PI * 2, s = 80 + Math.random() * 380;
        sparks.push({ x: cx, y: cy - 20, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, t: 0, max: 0.6 + Math.random() * 0.9,
          r: 1 + Math.random() * 2.4, c: ['#ffe19a', '#f2c25a', '#fff3c4'][i % 3] });
      }
      root.classList.add('is-made');
      if (u.reducedMotion || mode === 'instant') { coins = []; draw(); return; }
      last = performance.now();
      if (!raf) raf = requestAnimationFrame(loop);
    }

    function updateAmount() {
      var t = u.won(Story.shared.amount * 0.86);
      Array.prototype.forEach.call(amountEls, function (e) { e.textContent = t; });
      if (!made) layoutPile();
    }

    btn.addEventListener('click', function () { make('click'); });
    document.addEventListener('story:amount', updateAmount);
    imgs[0].addEventListener('load', function () { if (!made) draw(); });
    updateAmount();

    return {
      steps: STEPS,
      onStep: function (step) {
        if (step >= 1 && !made) make('auto');
        // 숨은 제목은 보조기기에서도 숨긴다
        $('.s02-title--ask').setAttribute('aria-hidden', step >= 3 ? 'true' : 'false');
        $('.s02-title--next').setAttribute('aria-hidden', step >= 3 ? 'false' : 'true');
      },
      resize: function () { layoutPile(); dust.resize(); },
      visible: function (on) { if (on) dust.start(); else dust.stop(); }
    };
  });
})();
