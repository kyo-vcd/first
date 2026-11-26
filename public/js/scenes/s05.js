/* =========================================================
   SCENE 05 — 보호 좌표 = 공습 좌표
   방식: 클릭(시점 전환) + 상태 단계형
   ---------------------------------------------------------
   부모 영역 : .scene-05          고정 화면 : .sticky-screen
   변경 대상 : .s05-toggle (공식 보호 좌표 / 실제 공습 타깃), .s05-panel (좌표 패널),
               .s05-scope (조준경), .s05-brackets (잠금), .s05-callout, .s05-stat (81%)
   실행 조건
     클릭   두 버튼으로 같은 지도를 두 시점으로 전환 (.is-view-target). 선택한 버튼만 활성.
     step 0         공식 보호 좌표 시점 (초록 핀 · 보호 원)
     step 1 (0.22~) 실제 공습 타깃 시점으로 바뀌고 조준경이 핀으로 다가온다
     step 2 (0.48~) 조준경이 핀에 잠기고 두 좌표가 100% 일치
     step 3 (0.74~) 81% 패널, "쿤두즈 외상센터" 버튼 → SCENE 06
   유지 조건 : 스크롤로 상태가 바뀌면 그 상태의 기본 시점으로 맞추고, 버튼은 언제든 시점을 바꾼다
   ========================================================= */
(function () {
  'use strict';

  var u = Story.util;

  Story.register('s05', function (root) {
    var $ = function (s) { return root.querySelector(s); };
    var btnOfficial = $('.s05-view-official');
    var btnTarget = $('.s05-view-target');
    var statNum = $('.s05-stat-num b');
    var live = $('.s05-live');

    function setView(target, announce) {
      root.classList.toggle('is-view-target', target);
      btnOfficial.setAttribute('aria-pressed', target ? 'false' : 'true');
      btnTarget.setAttribute('aria-pressed', target ? 'true' : 'false');
      if (announce) live.textContent = target ? '실제 공습 타깃 시점: 같은 좌표가 조준경 안에 있습니다.' : '공식 보호 좌표 시점: 군 당국에 통보된 보호 구역입니다.';
    }

    btnOfficial.addEventListener('click', function () { setView(false, true); });
    btnTarget.addEventListener('click', function () { setView(true, true); });

    $('.s05-next').addEventListener('click', function () {
      var next = document.getElementById('scene-06');
      if (next) next.scrollIntoView({ behavior: u.reducedMotion ? 'auto' : 'smooth' });
    });

    setView(false);

    return {
      steps: [0.22, 0.48, 0.74],
      onStep: function (step, prev) {
        setView(step >= 1);                 // 단계가 바뀌면 그 단계의 기본 시점으로
        if (step >= 3 && prev < 3) u.countUp(statNum, 81, 1400);
        if (step < 3) statNum.textContent = '0';
      },
      visible: function (on) { root.classList.toggle('is-paused', !on); }
    };
  });
})();
