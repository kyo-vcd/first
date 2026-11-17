/* =========================================================
   SCENE 01 — 1만 원의 경로 (후원금 흐름)
   ---------------------------------------------------------
   적용 범위
     부모 영역 : .scene-01        (스크롤 구간, 진행률 0~1 계산 기준)
     고정 화면 : .sticky-screen   (구간 동안 화면에 고정)
   변경 대상
     .s01-title--ask / --split / --result  제목 3개 (같은 자리에서 교체)
     .s01-control                           후원 금액 슬라이더 + 후원하기 버튼
     .s01-tank (--field / --fund / --ops)   86% · 10% · 4% 수조
     .s01-coins                             수조마다 동전을 그리는 canvas
     .s01-tank-badge                        86% 동전 산 위 금액 배지
     .s01-next                              다음 장면으로 잇는 질문

   상태 변화
     STATE 01 후원 금액 설정   (클릭)      슬라이더로 금액 선택, 빈 수조 3개
     STATE 02 코인 드롭·누적   (클릭)      후원하기 → 동전이 떨어져 86% 수조에 압도적으로 쌓임
     STATE 03 분배 확인       0.22~0.48   첫 제목이 빠진 뒤 둘째 제목 등장, 86% 금빛 강조, 10%·4% 어둡게, 배지
     STATE 04 결과 확인       0.52~0.70   옆 수조가 먼저 사라지고, 86% 수조가 가운데로, 결과 제목 등장
     다음 장면 연결           0.78~0.88   수조가 아래로 빠지고 "8,600원은 어떤 물품이 될까요?" 질문
     장면 끝                  0.93~1.00   화면이 어두워진다
   버튼을 누르지 않고 스크롤하면 0.08 지점에서 기본 금액으로 빠르게 자동 후원한다.
   화면에 쓰는 진행률은 js/script.js 가 부드럽게 보간해 넘겨준다.
   위로 스크롤하면 STATE 03·04 변화가 그대로 거꾸로 돌아간다.
   ========================================================= */

(function () {
  'use strict';

  var u = Story.util;

  /* 스크롤 진행률 구간
     사라지는 요소와 나타나는 요소가 같은 순간에 겹치지 않도록 구간을 순서대로 나눈다. */
  var STEP = {
    autoDonate: 0.08,              // 버튼을 안 눌렀으면 여기서 빠르게 자동 후원
    control: [0.10, 0.20],         // 컨트롤이 사라지고, 제목·수조가 빈자리를 채운다
    askOut: [0.22, 0.30],          // STATE 03: 첫 제목이 위로 빠진다
    highlight: [0.26, 0.40],       //           86% 금빛 강조, 10%·4% 어둡게
    splitIn: [0.32, 0.40],         //           두 번째 제목이 아래에서 올라온다
    badge: [0.40, 0.48],           //           금액 배지
    splitOut: [0.52, 0.58],        // STATE 04: 두 번째 제목이 빠진다
    sideOut: [0.52, 0.58],         //           10%·4% 수조가 먼저 사라진다
    fieldMove: [0.57, 0.70],       //           그다음 86% 수조가 가운데로
    resultIn: [0.62, 0.70],        //           결과 제목이 올라온다
    next: [0.78, 0.88],            // 다음 장면 질문: 수조는 아래로 빠지고 질문 등장
    curtain: [0.93, 1.00]          // 장면 끝: 화면이 어두워진다
  };

  var DROP_MS = 1600;   // 동전이 모두 떨어지기까지 걸리는 시간
  var AUTO_DROP_MS = 700; // 스크롤로 자동 후원할 때는 더 빠르게
  var GRAVITY = 2600;   // px/s²

  var COLORS = {
    gold: { face: '#F2B84B', edge: '#B98424', ring: '#D49B35', shine: 'rgba(255,255,255,0.35)' },
    bright: { face: '#FFD06A', edge: '#D49B35', ring: '#F2B84B', shine: 'rgba(255,255,255,0.55)' },
    dim: { face: '#353535', edge: '#262626', ring: '#2E2E2E', shine: null }
  };

  Story.register('s01', function (root) {
    function $(sel) { return root.querySelector(sel); }
    function $$(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }

    var el = {
      titles: [$('.s01-title--ask'), $('.s01-title--split'), $('.s01-title--result')],
      form: $('.s01-control'),
      amount: $('.s01-amount'),
      amountValue: $('.s01-amount-value'),
      donate: $('.s01-donate'),
      stage: $('.s01-stage'),
      badge: $('.s01-tank-badge'),
      next: $('.s01-next'),
      hint: $('.s01-hint'),
      headlines: $('.s01-headlines'),
      curtain: $('.scene-curtain'),
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
        rate: parseFloat(node.dataset.rate),
        body: node.querySelector('.s01-tank-body'),
        box: node.querySelector('.s01-tank-box'),
        rateLabel: node.querySelector('.s01-tank-rate'),
        canvas: canvas,
        ctx: canvas.getContext('2d'),
        target: isField ? 'bright' : 'dim',  // 강조 단계에서 바뀌는 색
        mix: 0,
        count: 0,
        coins: [],
        w: 0, h: 0, boxH: 0
      };
    });
    var field = tanks[0];

    var state = {
      donated: false,
      dropping: false,
      amount: 10000,
      fill: 0.5,
      r: 10,
      dpr: 1,
      sprites: null,
      fieldOffset: 0,
      controlSpace: 0,
      progress: 0,
      activeTitle: 0,
      raf: 0,
      last: 0,
      dropStart: 0
    };

    /* ---------- 동전 모양 (미리 그려 두고 재사용) ---------- */
    function makeSprite(r, dpr, c) {
      var size = Math.ceil((r * 2 + 2) * dpr);
      var cv = document.createElement('canvas');
      cv.width = cv.height = size;
      var g = cv.getContext('2d');
      g.scale(dpr, dpr);
      var o = r + 1;
      g.beginPath(); g.arc(o, o, r, 0, Math.PI * 2); g.fillStyle = c.edge; g.fill();
      g.beginPath(); g.arc(o, o, r * 0.84, 0, Math.PI * 2); g.fillStyle = c.face; g.fill();
      g.beginPath(); g.arc(o, o, r * 0.58, 0, Math.PI * 2);
      g.lineWidth = Math.max(1, r * 0.12); g.strokeStyle = c.ring; g.stroke();
      if (c.shine) {
        g.beginPath(); g.arc(o - r * 0.32, o - r * 0.32, r * 0.2, 0, Math.PI * 2);
        g.fillStyle = c.shine; g.fill();
      }
      return { img: cv, size: size / dpr };
    }

    function buildSprites() {
      state.sprites = {
        gold: makeSprite(state.r, state.dpr, COLORS.gold),
        bright: makeSprite(state.r, state.dpr, COLORS.bright),
        dim: makeSprite(state.r, state.dpr, COLORS.dim)
      };
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
            score: row + mound * t * t + ((c * 7 + row * 3) % 5) * 0.06
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
      // STATE 04 에서 86% 수조를 화면 가운데로 옮길 거리 (transform 영향 없는 offset 값 사용)
      state.fieldOffset = el.stage.clientWidth / 2 - (field.node.offsetLeft + field.node.offsetWidth / 2);
      // 컨트롤이 사라진 뒤 제목과 수조가 나눠서 채울 공간 (컨트롤 높이 + 위아래 간격)
      state.controlSpace = el.stage.offsetTop - (el.headlines.offsetTop + el.headlines.offsetHeight);
    }

    /* 동전 크기는 86% 수조가 목표 높이(fill)만큼 차도록 정한다 */
    function computeRadius() {
      if (!field.count) return;
      var area = field.w * field.boxH * state.fill;
      var r = Math.sqrt(area / (field.count * 3.46));
      state.r = u.clamp(r, 4, 18);
      buildSprites();
    }

    function placeTargets(snap) {
      tanks.forEach(function (t) {
        var mound = t.isField ? 5 : 1.5;
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
      el.badge.style.bottom = (field.h - top + 14) + 'px';
    }

    /* ---------- STATE 01 → 02 : 후원하기 ---------- */
    /* mode: 'click' 버튼, 'auto' 스크롤 자동 후원, 'instant' 애니메이션 없이 */
    function donate(mode) {
      var amount = parseInt(el.amount.value, 10);
      var k = amount / 10000;                       // 1 ~ 10
      var n = Math.round(100 + (k - 1) * 20);         // 동전 개수 100 ~ 280
      var counts = [Math.round(n * 0.86), Math.round(n * 0.10)];
      counts.push(Math.max(1, n - counts[0] - counts[1]));

      state.amount = amount;
      state.fill = 0.5 + 0.38 * (k - 1) / 9;         // 금액이 클수록 높이 쌓인다
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
      el.donate.disabled = false;
      el.donate.textContent = '다시 후원하기';
      applyHint();
    }

    /* ---------- 낙하 애니메이션 ---------- */
    function step(dt, elapsed) {
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

    function loop(now) {
      var dt = Math.min((now - state.last) / 1000, 1 / 30);
      state.last = now;
      var moving = step(dt, now - state.dropStart);
      render();
      if (moving) {
        state.raf = window.requestAnimationFrame(loop);
      } else {
        state.raf = 0;
        settle();
      }
    }

    function run() {
      if (state.raf) return;
      state.last = performance.now();
      state.raf = window.requestAnimationFrame(loop);
    }

    function render() {
      if (!state.sprites) return;
      var s = state.sprites;
      var size = s.gold.size;
      var off = state.r + 1;
      tanks.forEach(function (t) {
        var ctx = t.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, t.canvas.width, t.canvas.height);
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
        var over = s[t.target];
        t.coins.forEach(function (c) {
          if (c.state === 0) return;
          ctx.globalAlpha = 1;
          ctx.drawImage(s.gold.img, c.x - off, c.y - off, size, size);
          if (t.mix > 0.01) {
            ctx.globalAlpha = t.mix;
            ctx.drawImage(over.img, c.x - off, c.y - off, size, size);
          }
        });
        ctx.globalAlpha = 1;
      });
    }

    /* ---------- 스크롤 상태 (STATE 03 · 04) ---------- */
    function fade(node, opacity, y) {
      node.style.opacity = opacity.toFixed(3);
      node.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
    }

    function applyHint() {
      el.hint.style.opacity = state.progress < 0.08 && !state.dropping ? 1 : 0;
    }

    function seg(p, key, ease) {
      var t = u.range(p, STEP[key][0], STEP[key][1]);
      return (ease || u.easeInOut)(t);
    }

    function update(p) {
      state.progress = p;
      if (!state.donated && p > STEP.autoDonate) donate('auto');

      var ctrl = seg(p, 'control');
      var askOut = seg(p, 'askOut');
      var hl = seg(p, 'highlight');
      var splitIn = seg(p, 'splitIn', u.easeOut);
      var bd = seg(p, 'badge', u.easeOut);
      var splitOut = seg(p, 'splitOut');
      var sideOut = seg(p, 'sideOut');
      var move = seg(p, 'fieldMove');
      var resultIn = seg(p, 'resultIn', u.easeOut);
      var nx = seg(p, 'next');
      var curtain = seg(p, 'curtain');

      // 제목 교체: 앞 제목이 위로 빠진 뒤에 다음 제목이 아래에서 올라온다
      fade(el.titles[0], 1 - askOut, -32 * askOut);
      fade(el.titles[1], splitIn * (1 - splitOut), 32 * (1 - splitIn) - 32 * splitOut);
      fade(el.titles[2], resultIn, 32 * (1 - resultIn));
      var active = resultIn > 0.5 ? 2 : splitIn > 0.5 && splitOut < 0.5 ? 1 : askOut < 0.5 ? 0 : state.activeTitle;
      if (active !== state.activeTitle) {
        state.activeTitle = active;
        el.titles.forEach(function (t, i) { t.setAttribute('aria-hidden', i === active ? 'false' : 'true'); });
      }

      // 후원 컨트롤이 사라지면 제목은 아래로, 수조는 위로 와서 빈자리를 나눠 채운다
      var half = state.controlSpace / 2 * ctrl;
      fade(el.form, 1 - ctrl, -12 * ctrl);
      el.form.style.visibility = ctrl >= 1 ? 'hidden' : '';
      el.headlines.style.transform = 'translateY(' + half.toFixed(1) + 'px)';

      // 수조 강조
      var mixChanged = false;
      tanks.forEach(function (t) {
        if (Math.abs(t.mix - hl) > 0.001) mixChanged = true;
        t.mix = hl;
        if (t.isField) {
          t.node.style.setProperty('--hl', hl.toFixed(3));
          t.rateLabel.style.opacity = (hl * (1 - nx)).toFixed(3);
          t.node.style.transform =
            'translateX(' + (state.fieldOffset * move).toFixed(1) + 'px) scale(' + (1 + 0.06 * move).toFixed(3) + ')';
        } else {
          // 옆 수조는 86% 수조가 움직이기 전에 먼저 사라진다
          t.rateLabel.style.opacity = (hl * (1 - sideOut)).toFixed(3);
          t.node.style.opacity = (1 - sideOut).toFixed(3);
          t.node.style.transform = 'translateY(' + (24 * sideOut).toFixed(1) + 'px)';
        }
      });
      if (mixChanged && !state.raf) render();

      // 금액 배지
      el.badge.style.opacity = (bd * (1 - nx)).toFixed(3);
      el.badge.style.transform = 'translate(-50%, ' + (8 * (1 - bd)).toFixed(1) + 'px)';

      // 다음 장면 질문: 수조가 아래로 빠지며 어두워진 뒤 질문이 가운데 떠오른다
      el.stage.style.transform = 'translateY(' + (-half + el.stage.clientHeight * 0.4 * nx).toFixed(1) + 'px)';
      el.stage.style.opacity = (1 - 0.88 * nx).toFixed(3);
      fade(el.next, u.range(nx, 0.35, 1), 24 * (1 - nx));

      // 장면 끝: 화면 전체가 어두워진다
      el.curtain.style.opacity = curtain.toFixed(3);

      applyHint();
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
    el.amount.addEventListener('input', function () {
      el.amountValue.textContent = u.won(parseInt(el.amount.value, 10));
    });

    el.form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!state.dropping) donate('click');
    });

    el.titles.forEach(function (t, i) { t.setAttribute('aria-hidden', i === 0 ? 'false' : 'true'); });

    return { update: update, resize: resize };
  });
})();
