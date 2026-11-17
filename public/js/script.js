/* =========================================================
   공통 스크립트: 스크롤 기반 장면 관리
   ---------------------------------------------------------
   구조
     <section class="scene" data-scene="s01">   ← 스크롤 기준 부모
       <div class="sticky-screen"> … </div>      ← 고정 화면
     </section>

   스크롤 애니메이션은 두 가지 방식을 지원한다 (class11 38쪽).

   1) 상태 단계형 (스크롤 트리거 + 시간 고정 전환)
      스크롤 진행률은 "지금 몇 번째 상태인가"만 정한다.
      상태가 바뀌면 <section>에 data-step="2" 와 누적 클래스 is-step-1, is-step-2 가 붙고
      실제 전환은 CSS transition 이 항상 같은 시간으로 재생한다.
      → 스크롤 속도와 상관없이 글자·이미지가 같은 속도로 바뀐다.
      문장을 읽게 하는 장면, 단계가 넘어가는 장면에 쓴다.

   2) 스크롤 연동형
      update(progress) 로 진행률 0~1 을 매 프레임 받아 값을 비례해서 바꾼다.
      스크롤 위치 자체가 의미인 변화(타임라인, 수치 증가)에 쓴다.
      진행률은 실제 스크롤 값을 부드럽게 따라가도록 보간해서 넘겨준다.

   장면 스크립트(js/scenes/sXX.js) 등록 예
     Story.register('s01', function (root) {
       return {
         steps: [0.12, 0.40, 0.68],            // (단계형) 상태가 넘어가는 진행률
         onStep: function (step, prev) { … },  // (단계형) 상태가 바뀔 때 1번 호출
         update: function (progress) { … },    // (연동형) 매 프레임 호출
         resize: function () { … }             // (선택) 화면 크기 변경 시
       };
     });

   위로 스크롤하면 진행률이 줄어 이전 상태로 되돌아간다.
   ========================================================= */

(function (window, document) {
  'use strict';

  var factories = {};
  var scenes = [];
  var ticking = false;

  /* ---------- 장면 스크립트에서 쓰는 도구 ---------- */
  var util = {
    clamp: function (v, min, max) { return Math.min(max, Math.max(min, v)); },
    /** v 가 start~end 구간에서 0→1 로 변하는 값 */
    range: function (v, start, end) { return util.clamp((v - start) / (end - start), 0, 1); },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    easeInOut: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    easeOut: function (t) { return 1 - Math.pow(1 - t, 3); },
    won: function (n) { return Math.round(n).toLocaleString('ko-KR') + '원'; },
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  function register(id, factory) {
    factories[id] = factory;
  }

  /* 화면 높이: 모바일 주소창이 나타나거나 숨어도 변하지 않는 값(100lvh)을 쓴다.
     innerHeight 를 쓰면 주소창이 움직일 때마다 진행률이 밀려 상태가 저절로 바뀐다. */
  var probe = null;
  function viewH() {
    if (!probe) {
      probe = document.createElement('div');
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none;';
      document.body.appendChild(probe);
    }
    return probe.offsetHeight || window.innerHeight;
  }

  /* 섹션의 스크롤 진행률 0~1 */
  function progressOf(el) {
    var rect = el.getBoundingClientRect();
    var total = el.offsetHeight - viewH();
    if (total <= 0) return rect.top <= 0 ? 1 : 0;
    return util.clamp(-rect.top / total, 0, 1);
  }

  /* 진행률이 지나간 경계 수 = 현재 상태 번호 (0부터) */
  function stepOf(p, steps) {
    var n = 0;
    for (var i = 0; i < steps.length; i++) if (p >= steps[i]) n = i + 1;
    return n;
  }

  /* ---------- 단계형: 상태 클래스 적용 ---------- */
  function applyStep(s, step) {
    if (step === s.step) return;
    var prev = s.step;
    s.step = step;
    s.el.dataset.step = String(step);
    for (var i = 1; i <= s.api.steps.length; i++) {
      s.el.classList.toggle('is-step-' + i, i <= step);
    }
    if (s.api.onStep) s.api.onStep(step, prev);
  }

  /* ---------- 터치 화면용 멈춤 지점 ----------
     상태마다 한가운데 진행률 위치에 .snap-point 를 둔다 (CSS scroll-snap, 터치 화면에서만 동작).
     한 번 쓸면 다음 상태에서 멈춰 상태가 여러 개 연달아 넘어가지 않는다. */
  function placeSnapPoints(s) {
    var steps = s.api.steps;
    var rest = [0];
    for (var i = 0; i < steps.length; i++) {
      rest.push((steps[i] + (i + 1 < steps.length ? steps[i + 1] : 1)) / 2);
    }
    if (!s.snaps) {
      s.snaps = rest.map(function () {
        var m = document.createElement('div');
        m.className = 'snap-point';
        m.setAttribute('aria-hidden', 'true');
        s.el.appendChild(m);
        return m;
      });
    }
    var total = Math.max(0, s.el.offsetHeight - viewH());
    s.snaps.forEach(function (m, i) { m.style.top = Math.round(rest[i] * total) + 'px'; });
  }

  /* ---------- 공통 헤더 ---------- */
  var header = {
    no: null, title: null, steps: [],
    init: function () {
      this.no = document.querySelector('.story-scene-no');
      this.title = document.querySelector('.story-scene-title');
      this.steps = Array.prototype.slice.call(document.querySelectorAll('.story-step'));
    },
    update: function () {
      var mid = window.innerHeight / 2;
      var active = null;
      scenes.forEach(function (s) {
        var r = s.el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) active = s;
      });
      if (!active) return;
      if (this.no) this.no.textContent = active.el.dataset.no || '';
      if (this.title) this.title.textContent = active.el.dataset.title || '';
      var index = parseInt(active.el.dataset.no, 10) - 1;
      this.steps.forEach(function (step, i) {
        var fill = i < index ? 1 : i === index ? active.target : 0;
        step.style.setProperty('--fill', fill.toFixed(3));
      });
    }
  };

  /* ---------- 스크롤·리사이즈 처리 ---------- */
  var SMOOTH = 0.14;        // 연동형: 1프레임(60fps)에 남은 거리의 14%를 따라간다
  var STEP_GAP_MS = 500;    // 단계형: 상태가 연달아 넘어갈 때 최소 간격
  var lastTime = 0;

  function tick(now) {
    ticking = false;
    var dt = lastTime ? Math.min((now - lastTime) / 16.67, 4) : 1;
    lastTime = now;
    var k = util.reducedMotion ? 1 : 1 - Math.pow(1 - SMOOTH, dt);
    var vh = window.innerHeight;
    var moving = false;

    scenes.forEach(function (s) {
      var rect = s.el.getBoundingClientRect();
      // 화면 근처에 있는 장면만 갱신한다
      if (rect.bottom < -vh || rect.top > vh * 2) return;
      s.target = progressOf(s.el);

      // 단계형: 스크롤 위치가 정한 상태로 한 칸씩 간다 (전환 속도는 CSS 가 정함).
      // 빠르게 지나가도 상태 사이에 STEP_GAP_MS 를 두어 전환이 겹치거나 중간에 끊기지 않는다.
      if (s.api.steps) {
        var want = stepOf(s.target, s.api.steps);
        if (want !== s.step) {
          if (s.dirty || util.reducedMotion || s.step < 0) {
            applyStep(s, want);
          } else if (now - s.stepAt >= STEP_GAP_MS) {
            applyStep(s, s.step + (want > s.step ? 1 : -1));
            s.stepAt = now;
          }
          if (want !== s.step) moving = true;   // 아직 따라가는 중
        }
      }

      // 연동형: 보간한 진행률을 넘긴다
      if (s.api.update) {
        var p = s.dirty ? s.target : s.progress + (s.target - s.progress) * k;
        if (Math.abs(s.target - p) < 0.0005) p = s.target;
        else moving = true;
        if (p !== s.progress || s.dirty) {
          s.progress = p;
          s.api.update(p);
        }
      }
      s.dirty = false;
    });
    header.update();

    if (moving) requestTick();
    else lastTime = 0;
  }

  function requestTick() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(tick);
    }
  }

  /* 폭이나 기준 높이가 실제로 바뀔 때만 장면을 다시 계산한다
     (모바일 주소창이 움직일 때 생기는 resize 는 건너뛴다) */
  var lastSize = '';
  function onResize() {
    var size = document.documentElement.clientWidth + 'x' + viewH();
    if (size === lastSize) { requestTick(); return; }
    lastSize = size;
    scenes.forEach(function (s) {
      if (s.api.steps) placeSnapPoints(s);
      if (s.api.resize) s.api.resize();
      s.dirty = true;
    });
    requestTick();
  }

  function start() {
    header.init();
    var els = document.querySelectorAll('[data-scene]');
    Array.prototype.forEach.call(els, function (el) {
      var factory = factories[el.dataset.scene];
      if (!factory) return;
      var api = factory(el) || {};
      var s = { el: el, api: api, progress: -1, target: 0, step: -1, stepAt: 0, dirty: true };
      scenes.push(s);
      if (api.steps) applyStep(s, 0);
    });
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', onResize);
    onResize();
  }

  window.Story = {
    register: register,
    util: util,
    progressOf: progressOf
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    // 장면 스크립트가 모두 등록된 뒤 시작한다
    window.setTimeout(start, 0);
  }
})(window, document);
