/* =========================================================
   공통 스크립트: 스크롤 기반 장면 관리
   ---------------------------------------------------------
   구조
     <section class="scene" data-scene="s01">   ← 스크롤 기준 부모
       <div class="sticky-screen"> … </div>      ← 고정 화면
     </section>

   장면 스크립트(js/scenes/sXX.js)는 아래처럼 등록한다.
     Story.register('s01', function (root) {
       // root = 해당 <section> 요소. 이 안의 요소만 다룬다.
       return {
         update: function (progress) { … },   // 0~1 스크롤 진행률
         resize: function () { … }            // (선택) 화면 크기 변경 시
       };
     });

   진행률은 섹션 윗변이 화면 위에 닿을 때 0,
   섹션 아랫변이 화면 아래에 닿을 때 1 이다.
   위로 스크롤하면 진행률이 줄어들어 모든 변화가 거꾸로 돌아간다.
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

  /* 섹션의 스크롤 진행률 0~1 */
  function progressOf(el) {
    var rect = el.getBoundingClientRect();
    var total = el.offsetHeight - window.innerHeight;
    if (total <= 0) return rect.top <= 0 ? 1 : 0;
    return util.clamp(-rect.top / total, 0, 1);
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
        var fill = i < index ? 1 : i === index ? active.progress : 0;
        step.style.setProperty('--fill', fill.toFixed(3));
      });
    }
  };

  /* ---------- 스크롤·리사이즈 처리 ----------
     스크롤 위치로 구한 진행률(target)을 화면에 바로 쓰지 않고,
     화면용 진행률(progress)이 매 프레임 target 을 조금씩 따라가게 한다.
     휠 한 칸에 진행률이 몇 %씩 건너뛰어도 변화가 끊기지 않고 이어진다. */
  var SMOOTH = 0.14;        // 1프레임(60fps)에 남은 거리의 14%를 따라간다
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
      var p = s.dirty ? s.target : s.progress + (s.target - s.progress) * k;
      if (Math.abs(s.target - p) < 0.0005) p = s.target;
      else moving = true;
      if (p === s.progress && !s.dirty) return;
      s.progress = p;
      s.dirty = false;
      s.api.update(p);
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

  function onResize() {
    scenes.forEach(function (s) {
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
      if (!api.update) api.update = function () {};
      scenes.push({ el: el, api: api, progress: -1, dirty: true });
    });
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', onResize);
    onResize();
  }

  window.Story = { register: register, util: util, progressOf: progressOf };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    // 장면 스크립트가 모두 등록된 뒤 시작한다
    window.setTimeout(start, 0);
  }
})(window, document);
