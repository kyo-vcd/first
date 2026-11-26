/* =========================================================
   SCENE 04 — 하루 10번 (의료 공격 지도)
   방식: 스크롤 연동형 + 상태 단계형
   ---------------------------------------------------------
   부모 영역 : .scene-04          고정 화면 : .sticky-screen
   변경 대상 : .s04-timeline (--t, 시각 핀), .s04-hit / .s04-tag / .s04-mark (공격 10건),
               .s04-count (오늘의 의료 공격 N건), .s04-year (1년 3,623건), .s04-question
   실행 조건
     연동  진행률 0 ~ 0.66 = 하루 00:00 ~ 24:00. 시각이 공격 시각을 지나면 지점이 터지고 건수가 오른다.
           위로 스크롤하면 시각 · 건수가 되돌아간다. 24:00 → "하루 평균 10번, 병원이 공격받습니다"
     step 1 (0.72~)  지도가 물러나고 3,623건이 0부터 올라간다
     step 2 (0.86~)  "이 수많은 공격은 전쟁 중 우발적 사고였을까요?"
   유지 조건 : 하루의 공격 10건은 연간 통계를 하루로 나눈 예시 (장소는 2024년 주요 분쟁 지역)
   ========================================================= */
(function () {
  'use strict';

  var u = Story.util;
  var DAY_END = 0.66;
  // 시각(분), 지도 위치(%), 꼬리표 문구
  var HITS = [
    { m: 155,  x: 53.8, y: 46.4, t: '02:35 야전 클리닉 피격' },
    { m: 262,  x: 55.0, y: 22.5, t: '04:22 구급차 포격' },
    { m: 410,  x: 54.4, y: 35.3, t: '06:50 병원 공습' },
    { m: 545,  x: 52.8, y: 58.4, t: '09:05 보건소 무장 습격' },
    { m: 680,  x: 73.3, y: 43.3, t: '11:20 산부인과 병동 폭격' },
    { m: 800,  x: 55.3, y: 32.1, t: '13:20 외상센터 포격' },
    { m: 935,  x: 21.7, y: 44.4, t: '15:35 의료진 납치' },
    { m: 1060, x: 57.4, y: 46.5, t: '17:40 약품 창고 공습' },
    { m: 1215, x: 43.4, y: 48.6, t: '20:15 진료소 방화' },
    { m: 1420, x: 65.0, y: 31.7, t: '23:40 외상 병원 피격' }
  ];

  function hhmm(min) {
    min = Math.min(1440, Math.max(0, Math.round(min)));
    var h = Math.floor(min / 60), m = min % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  Story.register('s04', function (root) {
    var $ = function (s) { return root.querySelector(s); };
    var map = $('.s04-map');
    var timeline = $('.s04-timeline');
    var clock = $('.s04-clock');
    var countBox = $('.s04-count');
    var countNum = $('.s04-count-num b');
    var live = $('.s04-live');
    var yearNum = $('.s04-year-num b');

    // 공격 지점 · 꼬리표 · 타임라인 눈금 만들기
    var nodes = HITS.map(function (h) {
      var hit = document.createElement('span');
      hit.className = 's04-hit';
      hit.style.setProperty('--x', h.x + '%');
      hit.style.setProperty('--y', h.y + '%');
      hit.appendChild(document.createElement('i'));
      var tag = document.createElement('span');
      tag.className = 's04-tag mono' + (h.x > 62 ? ' is-left' : '');
      tag.style.setProperty('--x', h.x + '%');
      tag.style.setProperty('--y', h.y + '%');
      tag.textContent = h.t;
      var mark = document.createElement('span');
      mark.className = 's04-mark';
      mark.style.left = (h.m / 1440 * 100) + '%';
      map.appendChild(hit); map.appendChild(tag); timeline.appendChild(mark);
      return { hit: hit, tag: tag, mark: mark, m: h.m, on: false };
    });

    var count = -1, dayDone = false;

    function update(p) {
      var t = u.clamp(p / DAY_END, 0, 1);
      var min = t * 1440;
      timeline.style.setProperty('--t', t.toFixed(4));
      clock.textContent = hhmm(min);
      var n = 0, newest = -1;
      nodes.forEach(function (o, i) {
        var on = min >= o.m;
        if (on) { n++; newest = i; }
        if (on !== o.on) {
          o.on = on;
          o.hit.classList.toggle('is-on', on);
          o.mark.classList.toggle('is-on', on);
          if (on) {
            o.hit.classList.add('is-new');
            setTimeout(function () { o.hit.classList.remove('is-new'); }, 900);
          }
        }
      });
      nodes.forEach(function (o, i) { o.tag.classList.toggle('is-show', i === newest && t < 1); });
      if (n !== count) {
        if (n > count && count >= 0) {
          countNum.classList.remove('is-bump'); void countNum.offsetWidth; countNum.classList.add('is-bump');
        }
        count = n;
        countNum.textContent = n;
        countBox.classList.toggle('is-red', n > 0);
        live.textContent = '오늘의 의료 공격 ' + n + '건';
      }
      var done = t >= 1;
      if (done !== dayDone) { dayDone = done; root.classList.toggle('is-day-done', done); }
    }

    return {
      steps: [0.72, 0.86],
      snaps: [0, 0.066, 0.132, 0.198, 0.264, 0.33, 0.396, 0.462, 0.528, 0.594, 0.68, 0.79, 0.93],
      update: update,
      onStep: function (step, prev) {
        if (step >= 1 && prev < 1) u.countUp(yearNum, 3623, 1800);
        if (step < 1) yearNum.textContent = '0';
      },
      visible: function (on) { root.classList.toggle('is-paused', !on); }
    };
  });
})();
