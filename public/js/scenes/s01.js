/* =========================================================
   SCENE 01 — 1만 원의 경로 (후원금 흐름)
   방식: 상태 단계형 (스크롤 트리거 + 시간 고정 전환)
   ---------------------------------------------------------
   적용 범위
     부모 영역 : .scene-01        (스크롤 구간, 진행률로 상태 번호를 정함)
     고정 화면 : .sticky-screen   (구간 동안 화면에 고정)
   변경 대상
     .s01-title--ask / --split / --result  제목 3개 (같은 자리에서 교체)
     .s01-control                           후원 금액 슬라이더 + 후원하기 버튼
     .s01-tank (--field / --fund / --ops)   86% · 10% · 4% 수조
     .s01-coins                             수조마다 동전을 그리는 canvas
     .s01-tank-badge                        86% 동전 산 위 금액 배지
     .s01-next                              다음 장면으로 잇는 질문

   상태 (진행률이 경계를 넘으면 .scene-01 에 is-step-N 클래스가 붙고,
         보이는 변화는 css/scenes/s01.css 의 transition 이 같은 속도로 재생한다)
     step 0  ~0.15   STATE 01·02  금액 선택, 후원하기 → 동전 낙하 (클릭)
     step 1  0.15~   STATE 03     분배 확인: 86% 금빛 강조, 10%·4% 어둡게, 제목 교체, 배지
     step 2  0.40~   STATE 04     결과 확인: 옆 수조가 사라지고 86% 수조가 가운데로, 결과 제목
     step 3  0.65~   다음 장면    수조가 물러나고 "8,600원은 어떤 물품이 될까요?" 질문
     step 4  0.90~   장면 끝      화면이 어두워진다
   버튼을 누르지 않고 step 1 에 들어오면 기본 금액으로 동전을 빠르게 떨어뜨린다.
   위로 스크롤하면 이전 상태 클래스로 돌아가 변화가 거꾸로 재생된다.
   ========================================================= */

(function () {
  'use strict';

  var u = Story.util;

  var STEPS = [0.15, 0.40, 0.65, 0.90];

  var DROP_MS = 1600;     // 버튼으로 후원할 때 동전이 모두 떨어지는 시간
  var AUTO_DROP_MS = 700; // 스크롤로 자동 후원할 때
  var MIX_MS = 700;       // 동전 색이 금빛/회색으로 바뀌는 시간 (CSS 전환과 맞춘다)
  var GRAVITY = 2600;     // px/s²

  /* 시안의 낡은 금화: 금빛 면 + 테두리 띠 + 안쪽 홈 + 희미한 문양 + 촘촘한 검은 점 + 일부 핏자국 */
  var COLORS = {
    gold:   { halo: 'rgba(38, 22, 6, 0.6)', light: '#e3b555', face: '#c99630', edge: '#9a6a1b',
              rim: '#87591490', groove: '#7a5012', speck: '#2a1705', blood: '#d3171c' },
    bright: { halo: 'rgba(60, 38, 8, 0.6)', light: '#efc565', face: '#d6a43a', edge: '#a8771f',
              rim: '#8f601790', groove: '#805514', speck: '#2e1a06', blood: '#df1a1f' },
    dim:    { halo: 'rgba(10, 8, 6, 0.45)', light: '#5d4f43', face: '#4b3f35', edge: '#3a3029',
              rim: '#2f261f90', groove: '#2c241d', speck: '#17120e', blood: '#5b2b25' }
  };
  /* 동전 종류 16개: 금화 이미지 4장 × 회전 14개 + 핏자국 금화 2개 (약 1/8, 시안).
     같은 번호는 색이 바뀌어도 무늬가 같다. 이미지를 못 불러오면 아래 COLORS 로 직접 그린다. */
  var COIN_KINDS = 16;
  var BLOOD_FROM = 14;
  var COIN_SEEDS = [11, 23, 37, 41, 59, 73, 89, 97, 101, 113, 127, 131, 149, 157, 163, 173];
  var COIN_SRC = ['gold_1', 'gold_2', 'gold_3', 'gold_4', 'blood_1', 'blood_4'];
  var TINT = {                    // 이미지 동전 색 (canvas filter)
    gold: 'none',
    bright: 'brightness(1.12) saturate(1.06)',
    dim: 'grayscale(0.55) brightness(0.42)'
  };
  var TINT_FALLBACK = {           // filter 를 못 쓰는 브라우저: 동전 위에 색을 덮는다
    bright: 'rgba(255, 214, 120, 0.14)',
    dim: 'rgba(18, 13, 10, 0.62)'
  };
  var COINS_PER_ROW = 12.2;                   // 1만 원일 때 86% 수조 한 줄 동전 수 (시안)

  Story.register('s01', function (root) {
    function $(sel) { return root.querySelector(sel); }
    function $$(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }

    var el = {
      titles: [$('.s01-title--ask'), $('.s01-title--split'), $('.s01-title--result')],
      form: $('.s01-control'),
      amount: $('.s01-amount'),
      amountValue: $('.s01-amount-value'),
      range: $('.s01-range'),
      donate: $('.s01-donate'),
      stage: $('.s01-stage'),
      headlines: $('.s01-headlines'),
      badge: $('.s01-tank-badge'),
      live: $('.s01-live'),
      total: $('.s01-total'),
      fieldAmounts: $$('.s01-field-amount')
    };

    var tanks = $$('.s01-tank').map(function (node) {
      var canvas = node.querySelector('.s01-coins');
      var isField = node.classList.contains('s01-tank--field');
      return {
        node: node,
        isField: isField,
        body: node.querySelector('.s01-tank-body'),
        box: node.querySelector('.s01-tank-box'),
        canvas: canvas,
        ctx: canvas.getContext('2d'),
        target: isField ? 'bright' : 'dim',  // 강조 상태에서 바뀌는 색
        count: 0,
        coins: [],
        w: 0, h: 0, boxH: 0
      };
    });
    var field = tanks[0];

    var state = {
      step: 0,
      donated: false,
      dropping: false,
      amount: 10000,
      fill: 0.5,
      r: 10,
      dpr: 1,
      sprites: null,
      coinImgs: null,            // 불러온 동전 이미지 (images/s01/coin_*.png)
      mix: 0, mixFrom: 0, mixTo: 0, mixStart: 0,   // 동전 강조 정도 0~1 (시간 기반 전환)
      raf: 0,
      last: 0,
      dropStart: 0
    };

    /* ---------- 동전 모양 (미리 그려 두고 재사용) ---------- */
    function seeded(seed) {
      return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    function makeSprite(r, dpr, c, seed, blood) {
      var pad = Math.max(2, r * 0.12);            // 동전 둘레의 어두운 그림자 자리
      var size = Math.ceil((r + pad) * 2 * dpr);
      var cv = document.createElement('canvas');
      cv.width = cv.height = size;
      var g = cv.getContext('2d');
      g.scale(dpr, dpr);
      var o = r + pad;
      var rnd = seeded(seed);
      var TAU = Math.PI * 2;

      // 그림자
      g.beginPath(); g.arc(o, o + pad * 0.3, r + pad * 0.85, 0, TAU); g.fillStyle = c.halo; g.fill();

      // 금빛 면
      var grad = g.createRadialGradient(o - r * 0.3, o - r * 0.35, r * 0.1, o, o, r);
      grad.addColorStop(0, c.light); grad.addColorStop(0.65, c.face); grad.addColorStop(1, c.edge);
      g.beginPath(); g.arc(o, o, r, 0, TAU); g.fillStyle = grad; g.fill();

      // 테두리 띠, 안쪽 홈, 희미한 문양
      g.lineWidth = Math.max(1, r * 0.1); g.strokeStyle = c.rim;
      g.beginPath(); g.arc(o, o, r * 0.9, 0, TAU); g.stroke();
      g.lineWidth = Math.max(1, r * 0.06); g.strokeStyle = c.groove;
      g.beginPath(); g.arc(o, o, r * 0.68, 0, TAU); g.stroke();
      g.globalAlpha = 0.5;
      g.lineWidth = Math.max(0.8, r * 0.05);
      var a0 = rnd() * TAU;
      g.beginPath(); g.arc(o, o, r * 0.3, a0, a0 + 2.2); g.stroke();
      g.beginPath(); g.arc(o + r * 0.06, o + r * 0.04, r * 0.16, a0 + 2.6, a0 + 4.8); g.stroke();
      g.globalAlpha = 1;

      // 핏자국: 겹친 방울 + 작은 튄 자국
      if (blood) {
        var bx = o + (rnd() - 0.5) * r * 0.7;
        var by = o + (rnd() - 0.5) * r * 0.7;
        g.fillStyle = c.blood;
        for (var b = 0; b < 7; b++) {
          g.beginPath();
          g.arc(bx + (rnd() - 0.5) * r * 0.38, by + (rnd() - 0.5) * r * 0.38, r * (0.07 + rnd() * 0.13), 0, TAU);
          g.fill();
        }
        for (var d = 0; d < 4; d++) {
          g.beginPath();
          g.arc(bx + (rnd() - 0.5) * r * 0.9, by + (rnd() - 0.5) * r * 0.9, r * 0.035, 0, TAU);
          g.fill();
        }
      }

      // 촘촘한 검은 점 (낡은 인쇄 질감)
      g.save();
      g.beginPath(); g.arc(o, o, r, 0, TAU); g.clip();
      g.fillStyle = c.speck;
      var dots = Math.round(r * r * 1.15);
      for (var i = 0; i < dots; i++) {
        var dot = 0.55 + rnd() * 0.8;
        g.globalAlpha = 0.3 + rnd() * 0.6;
        g.fillRect(o + (rnd() * 2 - 1) * r, o + (rnd() * 2 - 1) * r, dot, dot);
      }
      g.restore();
      g.globalAlpha = 1;

      return { img: cv, size: size / dpr, off: o };
    }

    /* 이미지 동전: 그림자 + 회전한 동전 이미지 + 상태별 색 */
    function makeImageSprite(r, dpr, key, kind) {
      var pad = Math.max(2, r * 0.12);
      var o = r + pad;
      var size = Math.ceil(o * 2 * dpr);
      var cv = document.createElement('canvas');
      cv.width = cv.height = size;
      var g = cv.getContext('2d');
      g.scale(dpr, dpr);
      g.beginPath(); g.arc(o, o + pad * 0.3, r + pad * 0.85, 0, Math.PI * 2);
      g.fillStyle = COLORS[key].halo; g.fill();

      var blood = kind >= BLOOD_FROM;
      var img = state.coinImgs[blood ? 4 + (kind - BLOOD_FROM) : kind % 4];
      var coin = document.createElement('canvas');
      coin.width = coin.height = size;
      var c = coin.getContext('2d');
      c.imageSmoothingQuality = 'high';
      var useFilter = 'filter' in c;
      if (useFilter) c.filter = TINT[key];
      c.translate(o * dpr, o * dpr);
      c.rotate(kind * 2.39996);                     // 황금각: 같은 그림도 회전이 모두 다르다
      c.drawImage(img, -r * dpr, -r * dpr, r * 2 * dpr, r * 2 * dpr);
      if (!useFilter && TINT_FALLBACK[key]) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = TINT_FALLBACK[key];
        c.fillRect(0, 0, size, size);
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(coin, 0, 0);
      return { img: cv, size: size / dpr, off: o };
    }

    function buildSprites() {
      var set = {};
      Object.keys(COLORS).forEach(function (key) {
        set[key] = COIN_SEEDS.map(function (seed, i) {
          return state.coinImgs
            ? makeImageSprite(state.r, state.dpr, key, i)
            : makeSprite(state.r, state.dpr, COLORS[key], seed, i >= BLOOD_FROM);
        });
      });
      state.sprites = set;
    }

    function loadCoinImages() {
      var left = COIN_SRC.length;
      var imgs = COIN_SRC.map(function (name) {
        var img = new Image();
        img.onload = function () {
          if (--left) return;
          state.coinImgs = imgs;
          if (state.sprites) { buildSprites(); render(); }
        };
        img.src = 'images/s01/coin_' + name + '.png';
        return img;
      });
    }

    /* ---------- 동전이 쌓일 자리: 가운데가 높은 동전 산 ---------- */
    function pileSlots(width, floorY, r, n, mound) {
      var stepX = r * 2;
      var stepY = r * Math.sqrt(3);
      var inset = 3;                         // 수조 테두리 두께
      var cols = Math.max(1, Math.floor((width - inset * 2 - r * 2) / stepX) + 1);
      var rows = Math.ceil(n / Math.max(1, cols - 1)) + Math.ceil(mound) + 2;
      var half = width / 2;
      var slots = [];
      for (var row = 0; row < rows; row++) {
        var shift = row % 2 ? r : 0;
        for (var c = 0; c < cols; c++) {
          var x = inset + r + shift + c * stepX;
          if (x + r > width - inset) continue;
          var t = Math.abs(x - half) / half;
          slots.push({
            x: x,
            y: floorY - r - row * stepY,
            row: row,
            // 큰 수조는 살짝 불규칙하게, 작은 수조는 왼쪽부터 붙여서 쌓는다 (시안)
            score: row + mound * t * t + (mound > 0.5 ? ((c * 7 + row * 3) % 5) * 0.06 : c * 0.001)
          });
        }
      }
      slots.sort(function (a, b) { return a.score - b.score; });
      slots = slots.slice(0, n);
      slots.sort(function (a, b) { return a.row - b.row || a.x - b.x; });  // 아래 줄부터 떨어지도록
      return slots;
    }

    /* ---------- 크기 계산 ---------- */
    function measure() {
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      tanks.forEach(function (t) {
        t.w = t.body.clientWidth;
        t.h = t.body.clientHeight;
        t.boxH = t.box.offsetHeight;
        t.canvas.width = Math.round(t.w * state.dpr);
        t.canvas.height = Math.round(t.h * state.dpr);
      });
      // CSS 전환에서 쓰는 거리 (transform 영향을 받지 않는 offset 값으로 잰다)
      var fieldOffset = el.stage.clientWidth / 2 - (field.node.offsetLeft + field.node.offsetWidth / 2);
      var controlSpace = el.stage.offsetTop - (el.headlines.offsetTop + el.headlines.offsetHeight);
      root.style.setProperty('--s01-field-offset', fieldOffset.toFixed(1) + 'px');
      root.style.setProperty('--s01-shift', (controlSpace / 2).toFixed(1) + 'px');
    }

    /* 동전 크기는 86% 수조가 목표 높이(fill)만큼 차도록 정한다.
       화면이 낮아 동전 산 위에 배지 자리가 없으면 동전을 조금씩 줄여 자리를 만든다. */
    function computeRadius() {
      if (!field.count) return;
      // 1만 원(86개)일 때 시안처럼 한 줄에 12개 남짓, 금액이 크면 수조에 맞게 줄인다
      var r = u.clamp((field.w - 6) / (2 * COINS_PER_ROW), 4, 34);
      var room = field.boxH - el.badge.offsetHeight - 24;   // 동전 산이 차지할 수 있는 높이
      for (var i = 0; i < 12 && r > 4; i++) {
        var slots = pileSlots(field.w, field.h, r, field.count, 0.6);
        var top = field.h;
        slots.forEach(function (s) { top = Math.min(top, s.y - r); });
        if (field.h - top <= room) break;
        r = Math.max(4, r * 0.94);
      }
      state.r = r;
      buildSprites();
    }

    function placeTargets(snap) {
      tanks.forEach(function (t) {
        var mound = t.isField ? 0.6 : 0.4;   // 시안: 평평하게 쌓이고 맨 윗줄만 일부
        var slots = pileSlots(t.w, t.h, state.r, t.count, mound);
        t.coins.forEach(function (coin, i) {
          var s = slots[i] || slots[slots.length - 1];
          coin.tx = s.x;
          coin.ty = s.y;
          if (snap || coin.state === 2) { coin.x = s.x; coin.y = s.y; }
        });
      });
      placeBadge();
    }

    function placeBadge() {
      if (!field.coins.length) return;
      var top = field.h;
      field.coins.forEach(function (c) { top = Math.min(top, c.ty - state.r); });
      // 동전 산 바로 위에 두되, 수조 틀 위로 넘어가 비율(86%)과 겹치지 않게 제한한다
      var bottom = field.h - top + 14;
      var max = field.boxH - el.badge.offsetHeight - 10;
      el.badge.style.bottom = Math.max(0, Math.min(bottom, max)) + 'px';
    }

    /* ---------- STATE 01 → 02 : 후원하기 ----------
       mode: 'click' 버튼, 'auto' 스크롤 자동 후원, 'instant' 애니메이션 없이 */
    function donate(mode) {
      var amount = parseInt(el.amount.value, 10);
      var k = amount / 10000;                       // 1 ~ 10
      var n = Math.round(100 + (k - 1) * 20);         // 동전 개수 100 ~ 280
      var counts = [Math.round(n * 0.86), Math.round(n * 0.10)];
      counts.push(Math.max(1, n - counts[0] - counts[1]));

      state.amount = amount;
      state.fill = 0.45 + 0.2 * (k - 1) / 9;         // 금액이 클수록 높이 쌓인다 (가운데 봉우리가 수조를 넘지 않게)
      state.donated = true;
      state.dropStart = performance.now();

      tanks.forEach(function (t, i) {
        t.count = counts[i];
        t.coins = [];
      });
      computeRadius();

      var dropMs = mode === 'auto' ? AUTO_DROP_MS : DROP_MS;
      tanks.forEach(function (t) {
        for (var i = 0; i < t.count; i++) {
          t.coins.push({
            tx: 0, ty: 0, x: 0, y: 0, vy: 0,
            delay: (i / t.count) * dropMs + Math.random() * dropMs * 0.1,
            v: Math.floor(Math.random() * COIN_KINDS),   // 무늬 번호 (일부는 핏자국)
            state: 0                                   // 0 대기, 1 낙하, 2 정지
          });
        }
      });
      placeTargets(false);

      tanks.forEach(function (t) {
        t.coins.forEach(function (coin) {
          coin.x = u.clamp(coin.tx + (Math.random() - 0.5) * t.w * 0.4, state.r, t.w - state.r);
          coin.y = -state.r - Math.random() * t.h * 0.25;
        });
      });

      updateTexts();

      if (mode === 'instant' || u.reducedMotion) {
        tanks.forEach(function (t) {
          t.coins.forEach(function (c) { c.x = c.tx; c.y = c.ty; c.state = 2; });
        });
        settle();
        render();
      } else {
        state.dropping = true;
        root.classList.add('is-dropping');
        el.donate.disabled = true;
        run();
      }
    }

    function updateTexts() {
      var fieldWon = u.won(state.amount * 0.86);
      el.total.textContent = u.won(state.amount);
      el.fieldAmounts.forEach(function (n) { n.textContent = fieldWon; });
      el.badge.textContent = fieldWon;
      el.live.textContent = u.won(state.amount) + ' 중 ' + fieldWon + '이 현장 의료 물자로 갑니다.';
    }

    function settle() {
      state.dropping = false;
      root.classList.remove('is-dropping');
      el.donate.disabled = false;
      el.donate.textContent = '다시 후원하기';
    }

    /* ---------- 애니메이션 루프: 동전 낙하 + 동전 색 전환 ---------- */
    function stepCoins(dt, elapsed) {
      var moving = false;
      tanks.forEach(function (t) {
        t.coins.forEach(function (c) {
          if (c.state === 2) return;
          moving = true;
          if (c.state === 0) {
            if (elapsed < c.delay) return;
            c.state = 1;
          }
          c.vy += GRAVITY * dt;
          c.y += c.vy * dt;
          c.x += (c.tx - c.x) * Math.min(1, dt * 7);
          if (c.y >= c.ty) {
            c.y = c.ty;
            if (c.vy > 260) {
              c.vy = -c.vy * 0.28;                     // 바닥에 닿으면 살짝 튕긴다
            } else {
              c.vy = 0; c.x = c.tx; c.state = 2;
            }
          }
        });
      });
      return moving;
    }

    function stepMix(now) {
      if (state.mix === state.mixTo) return false;
      var t = u.reducedMotion ? 1 : u.clamp((now - state.mixStart) / MIX_MS, 0, 1);
      state.mix = u.lerp(state.mixFrom, state.mixTo, u.easeInOut(t));
      if (t >= 1) state.mix = state.mixTo;
      return state.mix !== state.mixTo;
    }

    function loop(now) {
      var dt = Math.min((now - state.last) / 1000, 1 / 30);
      state.last = now;
      var dropping = state.dropping && stepCoins(dt, now - state.dropStart);
      var mixing = stepMix(now);
      render();
      if (state.dropping && !dropping) settle();
      if (dropping || mixing) {
        state.raf = window.requestAnimationFrame(loop);
      } else {
        state.raf = 0;
      }
    }

    function run() {
      if (state.raf) return;
      state.last = performance.now();
      state.raf = window.requestAnimationFrame(loop);
    }

    /* 떨어지는 동전 위의 가는 선 (시안) */
    function drawTrail(ctx, c) {
      var len = Math.min(state.r * 2, 18 + c.vy * 0.03);
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = '#8a6d3e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - state.r - 2);
      ctx.lineTo(c.x, c.y - state.r - 2 - len);
      ctx.stroke();
    }

    function render() {
      if (!state.sprites) return;
      var s = state.sprites;
      var size = s.gold[0].size;
      var off = s.gold[0].off;
      tanks.forEach(function (t) {
        var ctx = t.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, t.canvas.width, t.canvas.height);
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
        var over = s[t.target];
        t.coins.forEach(function (c) {
          if (c.state === 0) return;
          if (c.state === 1 && c.vy > 120) drawTrail(ctx, c);
          ctx.globalAlpha = 1;
          ctx.drawImage(s.gold[c.v].img, c.x - off, c.y - off, size, size);
          if (state.mix > 0.01) {
            ctx.globalAlpha = state.mix;
            ctx.drawImage(over[c.v].img, c.x - off, c.y - off, size, size);
          }
        });
        ctx.globalAlpha = 1;
      });
    }

    /* ---------- 상태가 바뀔 때 (CSS 로 할 수 없는 부분만 처리) ---------- */
    function onStep(step) {
      state.step = step;

      // 버튼을 누르지 않고 분배 확인 상태로 오면 자동 후원
      if (step >= 1 && !state.donated) donate('auto');

      // 동전 색: STATE 03 부터 86% 금빛, 10%·4% 회색
      var mixTo = step >= 1 ? 1 : 0;
      if (mixTo !== state.mixTo) {
        state.mixFrom = state.mix;
        state.mixTo = mixTo;
        state.mixStart = performance.now();
        run();
      }

      // 화면에서 숨은 제목과 컨트롤은 보조기기와 키보드 탐색에서도 숨긴다
      var active = step >= 2 ? 2 : step === 1 ? 1 : 0;
      el.titles.forEach(function (t, i) { t.setAttribute('aria-hidden', i === active ? 'false' : 'true'); });
      el.form.inert = step >= 1;
    }

    function resize() {
      measure();
      if (state.donated) {
        computeRadius();
        placeTargets(false);
      }
      render();
    }

    /* ---------- 사용자 입력 ---------- */
    /* 슬라이더 채움과 값 위치 (CSS 변수 --p) */
    function syncRange() {
      var min = parseFloat(el.amount.min), max = parseFloat(el.amount.max);
      el.range.style.setProperty('--p', ((parseFloat(el.amount.value) - min) / (max - min)).toFixed(4));
    }
    syncRange();

    el.amount.addEventListener('input', function () {
      var amount = parseInt(el.amount.value, 10);
      syncRange();
      el.amountValue.textContent = u.won(amount);
    });

    loadCoinImages();

    el.form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!state.dropping) donate('click');
    });

    return {
      steps: STEPS,
      onStep: onStep,
      resize: resize
    };
  });
})();
