/* =========================================================
   구성 비교 (현재 / 개선1 / 개선2)
   ---------------------------------------------------------
   - 주소의 ?v= 값으로 구성을 고른다. 값이 없으면 현재(0).
   - <html data-variant="0|1|2"> 를 화면이 그려지기 전에 붙인다 (그래서 <head>에서 불러온다).
     구성별 차이는 CSS 의 [data-variant] 선택자와 장면 스크립트의 Story.variant 로 나눈다.
   - 상단 플로팅 영역(.compare)의 버튼을 누르면 해당 구성으로 다시 연다.
   비교가 끝나면 index.html 의 .compare 와 이 파일을 지우고, 고른 구성만 남긴다.
   ========================================================= */

(function (window, document) {
  'use strict';

  var VALID = ['0', '1', '2'];
  var v = new URLSearchParams(window.location.search).get('v');
  if (VALID.indexOf(v) < 0) v = '0';

  document.documentElement.dataset.variant = v;
  window.STORY_VARIANT = parseInt(v, 10);

  function init() {
    var nav = document.querySelector('.compare');
    if (!nav) return;
    var desc = nav.querySelector('.compare-desc');
    var buttons = Array.prototype.slice.call(nav.querySelectorAll('[data-v]'));

    buttons.forEach(function (btn) {
      var active = btn.dataset.v === v;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (active && desc) desc.textContent = btn.dataset.desc || '';

      btn.addEventListener('click', function () {
        if (btn.dataset.v === v) return;
        var url = new URL(window.location.href);
        if (btn.dataset.v === '0') url.searchParams.delete('v');
        else url.searchParams.set('v', btn.dataset.v);
        url.hash = '';
        window.location.href = url.toString();
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
