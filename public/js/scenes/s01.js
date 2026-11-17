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
     STATE 03 분배 확인       0.24~0.40   86% 수조 금빛 강조, 10%·4% 어둡게, 제목 교체
     STATE 04 결과 확인       0.54~0.70   86% 수조만 중앙에 남고 "10,000원 중 8,600원" 강조
     다음 장면 연결           0.80~0.92   "8,600원은 어떤 물품이 될까요?" 질문
   버튼을 누르지 않고 스크롤하면 0.18 지점에서 기본 금액으로 자동 후원한다.
   위로 스크롤하면 STATE 03·04 변화가 그대로 거꾸로 돌아간다.
   ========================================================= */

(function () {
  'use strict';

  var u = Story.util;

  /* 스크롤 진행률 구간 */
  var STEP = {
    autoDonate: 0.18,
    control: [0.14, 0.24],
    split: [0.24, 0.40],
    badge: [0.36, 0.46],
    result: [0.54, 0.70],
    next: [0.80, 0.92]
  };

  var DROP_MS = 1600;   // 동전이 모두 떨어지기까지 걸리는 시간
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
    function donate(instant) {
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

      tanks.forEach(function (t) {
        for (var i = 0; i < t.count; i++) {
          t.coins.push({
            tx: 0, ty: 0, x: 0, y: 0, vy: 0,
            delay: (i / t.count) * DROP_MS + Math.random() * 160,
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

      if (instant || u.reducedMotion) {
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

    function update(p) {
      state.progress = p;
      if (!state.donated && p > STEP.autoDonate) donate(true);

      var ctrl = u.range(p, STEP.control[0], STEP.control[1]);
      var s3 = u.easeInOut(u.range(p, STEP.split[0], STEP.split[1]));
      var bd = u.easeOut(u.range(p, STEP.badge[0], STEP.badge[1]));
      var s4 = u.easeInOut(u.range(p, STEP.result[0], STEP.result[1]));
      var nx = u.easeOut(u.range(p, STEP.next[0], STEP.next[1]));

      // 제목 교체
      fade(el.titles[0], 1 - s3, -24 * s3);
      fade(el.titles[1], s3 * (1 - s4), 24 * (1 - s3) - 24 * s4);
      fade(el.titles[2], s4, 24 * (1 - s4));
      var active = s4 > 0.5 ? 2 : s3 > 0.5 ? 1 : 0;
      if (active !== state.activeTitle) {
        state.activeTitle = active;
        el.titles.forEach(function (t, i) { t.setAttribute('aria-hidden', i === active ? 'false' : 'true'); });
      }

      // 후원 컨트롤은 분배 확인 전에 사라진다
      fade(el.form, 1 - ctrl, -12 * ctrl);
      el.form.style.visibility = ctrl >= 1 ? 'hidden' : '';

      // 수조 강조
      var mixChanged = false;
      tanks.forEach(function (t) {
        if (Math.abs(t.mix - s3) > 0.001) mixChanged = true;
        t.mix = s3;
        if (t.isField) {
          t.node.style.setProperty('--hl', s3.toFixed(3));
          t.rateLabel.style.opacity = s3.toFixed(3);
          t.node.style.transform =
            'translateX(' + (state.fieldOffset * s4).toFixed(1) + 'px) scale(' + (1 + 0.06 * s4).toFixed(3) + ')';
        } else {
          t.rateLabel.style.opacity = (s3 * (1 - s4)).toFixed(3);
          t.node.style.opacity = (1 - s4).toFixed(3);
        }
      });
      if (mixChanged && !state.raf) render();

      // 금액 배지
      el.badge.style.opacity = bd.toFixed(3);
      el.badge.style.transform = 'translate(-50%, ' + (8 * (1 - bd)).toFixed(1) + 'px)';

      // 다음 장면 질문: 수조는 물러나고 질문이 떠오른다
      el.stage.style.opacity = (1 - 0.75 * nx).toFixed(3);
      fade(el.next, nx, 16 * (1 - nx));

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
      if (!state.dropping) donate(false);
    });

    el.titles.forEach(function (t, i) { t.setAttribute('aria-hidden', i === 0 ? 'false' : 'true'); });

    return { update: update, resize: resize };
  });
})();
