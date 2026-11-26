/* =========================================================
   SCENE 08 — 꺼진 불빛 (영향 반경과 서명)
   방식: 드래그(반경 슬라이더) + 상태 단계형 + 클릭(서명)
   ---------------------------------------------------------
   부모 영역 : .scene-08          고정 화면 : .sticky-screen
   변경 대상 : .s08-lights (마을 불빛 · 어둠의 원 canvas), .s08-count (불 꺼진 마을 N곳),
               .s08-stats (22,000+ · 5,900+ 취소선), .s08-end (1만 원의 온기 · 서명 버튼)
   실행 조건
     드래그  반경 0 → 50km: 어둠의 원이 커지고 그 안의 불빛이 하나씩 꺼지며 숫자가 오른다.
             50km 에 닿으면 "반경 50km, 불이 꺼졌다" (.is-full)
     step 1 (0.35~)  통계 패널 — 아직 끝까지 끌지 않았으면 반경이 50km 까지 저절로 커진다
     step 2 (0.65~)  결말: 금화의 온기 + "의료 시설 보호 촉구 서명하기"
     클릭    서명 → 서명 완료 상태 (화면 안 연출, 외부로 전송하지 않음)
   유지 조건 : 금액은 S01 에서 고른 금액 (Story.shared.amount)
   ========================================================= */
(function () {
  'use strict';

  var u = Story.util;
  var DOTS = 240;

  function seeded(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function manwon(n) { return (n / 10000).toLocaleString('ko-KR') + '만 원'; }

  Story.register('s08', function (root) {
    var $ = function (s) { return root.querySelector(s); };
    var canvas = $('.s08-lights');
    var ctx = canvas.getContext('2d');
    var range = $('.s08-range');
    var kmEl = $('.s08-km');
    var countEl = $('.s08-count-num b');
    var live = $('.s08-live');
    var signBtn = $('.s08-sign');
    var sparks = u.embers($('.s08-sparks'), {
      rate: 0, speed: 60, colors: ['#ffe19a', '#f2c25a', '#ffd27a'],
      area: function (w, h) { return { x: w / 2 + (Math.random() - 0.5) * 120, y: h * 0.3 + (Math.random() - 0.5) * 60 }; }
    });

    var dots = [], w = 0, h = 0, dpr = 1, R = 300, km = 0, shown = 0, full = false, raf = 0, last = 0, auto = 0;
    var cx = 0, cy = 0;

    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      cx = w / 2; cy = h * 0.54;
      R = Math.min(h * 0.36, w * 0.44);              // 50km 반지름
      var rnd = seeded(8);
      dots = [];
      for (var i = 0; i < DOTS; i++) {
        var x = rnd() * w, y = rnd() * h;
        if (Math.hypot(x - cx, y - cy) < 34) { i--; continue; }
        dots.push({ x: x, y: y, d: Math.hypot(x - cx, y - cy), r: 1.4 + rnd() * 2.2, ph: rnd() * 6.28, sp: 0.6 + rnd() * 1.6, off: 0 });
      }
    }

    function draw(now) {
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      var r = R * km / 50;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // 불빛: 반경 안은 꺼진다 (0.4초에 걸쳐)
      ctx.globalCompositeOperation = 'lighter';
      dots.forEach(function (o) {
        var target = o.d <= r ? 1 : 0;
        o.off += (target - o.off) * Math.min(1, dt * 5);
        var tw = 0.75 + 0.25 * Math.sin(now / 1000 * o.sp + o.ph);
        var a = (1 - o.off) * tw;
        if (a > 0.02) {
          var g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 4);
          g.addColorStop(0, 'rgba(255, 200, 90,' + a + ')');
          g.addColorStop(0.35, 'rgba(240, 160, 50,' + a * 0.5 + ')');
          g.addColorStop(1, 'rgba(240, 160, 50, 0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 4, 0, Math.PI * 2); ctx.fill();
        }
      });
      ctx.globalCompositeOperation = 'source-over';
      if (r > 2) {
        // 어둠의 원 + 붉은 테두리 + 거리 눈금
        ctx.save();
        ctx.beginPath();
        for (var k = 0; k <= 72; k++) {
          var ang = k / 72 * Math.PI * 2, jag = 1 + Math.sin(k * 7.3) * 0.012 + Math.sin(k * 2.1) * 0.01;
          var px = cx + Math.cos(ang) * r * jag, py = cy + Math.sin(ang) * r * jag;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(6, 4, 4, 0.92)';
        ctx.shadowColor = 'rgba(229, 38, 43, 0.75)'; ctx.shadowBlur = 30;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(229, 38, 43, 0.85)'; ctx.stroke();
        ctx.clip();
        ctx.setLineDash([4, 8]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(239, 230, 214, 0.18)';
        [10, 30, 50].forEach(function (kmRing) {
          var rr = R * kmRing / 50; if (rr > r) return;
          ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
        });
        for (var s = 0; s < 8; s++) {
          var a2 = s / 8 * Math.PI * 2;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r); ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(229, 38, 43, 0.85)'; ctx.font = '600 11px ui-monospace, monospace';
        [10, 30, 50].forEach(function (kmRing) {
          var rr = R * kmRing / 50; if (rr > r - 6) return;
          ctx.fillText(kmRing + 'km', cx + rr + 4, cy - 4);
        });
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    }

    function setKm(v, fromUser) {
      km = u.clamp(v, 0, 50);
      range.value = km;
      range.style.setProperty('--p', (km / 50).toFixed(4));
      kmEl.textContent = Math.round(km) + 'km';
      var r = R * km / 50, n = 0;
      dots.forEach(function (o) { if (o.d <= r) n++; });
      if (n !== shown) { shown = n; countEl.textContent = n; }
      var isFull = km >= 49.5;
      if (isFull !== full) {
        full = isFull;
        root.classList.toggle('is-full', full);
        live.textContent = full ? '반경 50km 안의 마을 ' + n + '곳의 불이 꺼졌습니다.' : '';
      }
      if (fromUser) root.classList.add('is-dragged');
    }

    range.addEventListener('input', function () { cancelAnimationFrame(auto); auto = 0; setKm(parseFloat(range.value), true); });

    function autoFill() {
      if (full || auto) return;
      var from = km, t0 = performance.now();
      (function step(t) {
        var k = u.clamp((t - t0) / 1600, 0, 1);
        setKm(from + (50 - from) * u.easeInOut(k));
        auto = k < 1 ? requestAnimationFrame(step) : 0;
      })(t0);
    }

    signBtn.addEventListener('click', function () {
      if (root.classList.contains('is-signed')) return;
      root.classList.add('is-signed');
      signBtn.setAttribute('aria-pressed', 'true');
      signBtn.textContent = '✓ 서명했습니다';
      var coin = $('.s08-coin');
      coin.classList.remove('is-pop'); void coin.offsetWidth; coin.classList.add('is-pop');
      var c = $('.s08-sparks'), cr = coin.getBoundingClientRect(), br = c.getBoundingClientRect();
      sparks.burst(cr.left - br.left + cr.width / 2, cr.top - br.top + cr.height / 2, 70);
      sparks.setRate(6);
    });

    function updateAmount() { $('.s08-amount').textContent = manwon(Story.shared.amount); }
    document.addEventListener('story:amount', updateAmount);
    updateAmount();

    layout();
    setKm(0);

    return {
      steps: [0.35, 0.65],
      snaps: [0, 0.5, 0.825],
      onStep: function (step) { if (step >= 1) autoFill(); },
      resize: function () { layout(); setKm(km); sparks.resize(); },
      visible: function (on) {
        root.classList.toggle('is-paused', !on);
        if (on) { if (!raf) { last = performance.now(); raf = requestAnimationFrame(draw); } sparks.start(); }
        else { cancelAnimationFrame(raf); raf = 0; sparks.stop(); }
      }
    };
  });
})();
