/* =========================================================
   SCENE 03 — 최후의 안전지대 (병원과 제네바협약)
   방식: 상태 단계형
   ---------------------------------------------------------
   부모 영역 : .scene-03          고정 화면 : .sticky-screen
   변경 대상 : .s03-title (문장 3개), .s03-zone (보호 구역), .s03-beam (빛),
               .s03-hospital-lit (불 켜진 병원), .s03-card (협약), .s03-question
   실행 조건
     step 1 (0.20~)  적십자에서 빛이 내려오고 보호 구역 타원이 그려진다
     step 2 (0.45~)  창문 · 문에 불이 켜지고 "병원은 어떤 상황에서도 공격 대상이 아니다"
     step 3 (0.70~)  화면이 어두워지고 협약 카드가 떨어져 붙는다 → 질문
   반복 모션(연기 · 불빛 · 불씨)은 장면이 보일 때만 돈다
   ========================================================= */
(function () {
  'use strict';

  Story.register('s03', function (root) {
    var embers = Story.util.embers(root.querySelector('.s03-embers'), {
      rate: 26, speed: 60,
      area: function (w, h) {
        var spots = [0.05, 0.21, 0.91, 0.98];
        var x = spots[(Math.random() * spots.length) | 0];
        return { x: w * (x + (Math.random() - 0.5) * 0.06), y: h * (0.68 + Math.random() * 0.05) };
      }
    });
    var titles = root.querySelectorAll('.s03-title');

    return {
      steps: [0.2, 0.45, 0.7],
      onStep: function (step) {
        var active = step >= 3 ? -1 : step >= 2 ? 2 : step >= 1 ? 1 : 0;
        Array.prototype.forEach.call(titles, function (t, i) { t.setAttribute('aria-hidden', i === active ? 'false' : 'true'); });
      },
      resize: function () { embers.resize(); },
      visible: function (on) {
        root.classList.toggle('is-paused', !on);
        if (on) embers.start(); else embers.stop();
      }
    };
  });
})();
