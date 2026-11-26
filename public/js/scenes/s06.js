/* =========================================================
   SCENE 06 — 쿤두즈, 2015년 10월 3일
   방식: 스크롤 연동형 (진행률 0~1 = 02:00 ~ 03:15, 타임라인을 끌면 그 위치로 스크롤)
   ---------------------------------------------------------
   부모 영역 : .scene-06          고정 화면 : .sticky-screen
   변경 대상 : data-phase (건물 정상 · 화재 · 잔해, 제목, 하늘 · 연기), .s06-meta (시각),
               .s06-log li / .s06-quote (기록), .s06-toll (사망 42명), .s06-plane · .s06-tracer
   실행 조건
     스크롤(또는 타임라인 끌기 · 키보드 ←→)로 시각이 흐르면
       02:00~  북동부 유일의 외상센터 (phase 0)
       02:08~  첫 포격: 비행기 통과 · 화면 흔들림 · 화재 (phase 1)
       02:19~  공격 계속: 연락 기록 · 중단 요청 · 인용 (phase 2)
       03:10~  본관 붕괴 · 사망 42명 (phase 3)
     포격 시각을 앞으로 지날 때마다 흔들림과 불씨가 터진다. 위로 스크롤하면 상태도 되돌아간다.
   유지 조건 : 시각과 수치는 국경없는의사회(MSF) 내부 조사 보고서 기준
   ========================================================= */
(function () {
  'use strict';

  var u = Story.util;
  var STRIKES = [8, 13, 21, 29, 37, 46, 55, 63];   // 포격 시각 (02:00 기준 분)
  var PHASES = [0, 8, 19, 70];

  function clock(min) {
    var t = 120 + min, h = Math.floor(t / 60), m = t % 60;
    return '0' + h + ':' + (m < 10 ? '0' : '') + m;
  }

  Story.register('s06', function (root) {
    var $ = function (s) { return root.querySelector(s); };
    var range = $('.s06-range');
    var track = $('.s06-track');
    var meta = $('.s06-meta');
    var now = $('.s06-now');
    var plane = $('.s06-plane');
    var tracer = $('.s06-tracer');
    var logs = root.querySelectorAll('.s06-log li, .s06-quote');
    var tollNum = $('.s06-toll-num b');
    var live = $('.s06-live');
    var embers = u.embers($('.s06-embers'), {
      rate: 0, speed: 90, size: 2,
      area: function (w, h) { return { x: w * (0.3 + Math.random() * 0.25), y: h * (0.75 + Math.random() * 0.2) }; }
    });

    var min = -1, phase = -1, visible = false;

    // 타임라인 눈금 (포격 시각)
    var marks = $('.s06-marks');
    STRIKES.forEach(function (m) {
      var i = document.createElement('i');
      i.style.left = (m / 75 * 100) + '%';
      marks.appendChild(i);
    });

    function shake() {
      if (u.reducedMotion) return;
      root.classList.remove('is-shake'); void root.offsetWidth; root.classList.add('is-shake');
      var c = $('.s06-embers');
      embers.burst(c.clientWidth * 0.42, c.clientHeight * 0.82, 50);
    }

    function setTime(m) {
      m = Math.round(u.clamp(m, 0, 75));
      if (m === min) return;
      var prev = min;
      min = m;
      range.value = m;
      track.style.setProperty('--p', (m / 75).toFixed(4));
      now.textContent = clock(m);
      var p = 0;
      for (var i = 0; i < PHASES.length; i++) if (m >= PHASES[i]) p = i;
      meta.textContent = '2015.10.03 ' + (p === 3 ? '03:10경 · 공습 종료' : clock(m) + ' · 아프가니스탄 쿤두즈');

      // 포격 시각을 앞으로 지나면 흔들림
      if (prev >= 0 && m > prev) {
        STRIKES.forEach(function (s, k) {
          if (prev < s && m >= s) {
            shake();
            if (k === 0) {                // 첫 포격: 비행기 통과 + 궤적
              plane.classList.remove('is-fly'); void plane.offsetWidth; plane.classList.add('is-fly');
              tracer.classList.remove('is-fire'); void tracer.offsetWidth; tracer.classList.add('is-fire');
            }
          }
        });
      }
      Array.prototype.forEach.call(logs, function (el) {
        el.classList.toggle('is-on', m >= parseInt(el.dataset.at, 10));
      });
      if (p !== phase) {
        phase = p;
        root.dataset.phase = String(p);
        embers.setRate([0, 30, 70, 8][p]);
        if (p === 3) u.countUp(tollNum, 42, 1200);
        live.textContent = $('.s06-t' + p).textContent;
      }
    }

    // 타임라인을 끌면 그 시각 위치로 페이지를 스크롤한다 (화면은 스크롤 진행률로 바뀐다)
    range.addEventListener('input', function () { Story.scrollToProgress(root, parseFloat(range.value) / 75); });

    setTime(0);

    return {
      update: function (p) { setTime(p * 75); },   // 스크롤 연동: 진행률 0~1 = 02:00~03:15
      snaps: [0, 0.12, 0.27, 0.4, 0.55, 0.7, 0.94],
      resize: function () { embers.resize(); },
      visible: function (on) {
        visible = on;
        root.classList.toggle('is-paused', !on);
        if (on) embers.start(); else embers.stop();
      }
    };
  });
})();
