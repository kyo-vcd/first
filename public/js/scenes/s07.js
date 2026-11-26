/* =========================================================
   SCENE 07 — 멈춘 수술실
   방식: 상태 단계형
   ---------------------------------------------------------
   부모 영역 : .scene-07          고정 화면 : .sticky-screen
   변경 대상 : .s07-lamp / .s07-glow (비상등, --lamp), .s07-ecg (심전도 canvas),
               .s07-kit (S02 의 구호 키트, --burn 경계), .s07-text (문장 3개)
   실행 조건
     step 0          "남은 것은 비상등 하나" — 비상등이 불규칙하게 깜빡인다
     step 1 (0.22~)  비상등이 꺼지고 암전
     step 2 (0.45~)  "03:10 외상센터의 수술실과 중환자실이 멈췄습니다" — 심전도가 뛰다 평평해진다
     step 3 (0.70~)  키트가 불타는 경계선에 반쯤 타 버린다 → "불타 사라졌습니다"
   ========================================================= */
(function () {
  'use strict';

  var u = Story.util;

  Story.register('s07', function (root) {
    var $ = function (s) { return root.querySelector(s); };
    var ruins = $('.s07-ruins');
    var canvas = $('.s07-ecg');
    var ctx = canvas.getContext('2d');
    var embers = u.embers($('.s07-embers'), {
      rate: 0, speed: 50, size: 1.6,
      area: function (w, h) {
        var kit = $('.s07-kit').getBoundingClientRect(), box = root.querySelector('.sticky-screen').getBoundingClientRect();
        var b = parseFloat(getComputedStyle($('.s07-kit')).getPropertyValue('--burn')) / 100 || 0.5;
        return { x: kit.left - box.left + kit.width * (b + 0.05 + Math.random() * 0.4), y: kit.top - box.top + kit.height * Math.random() };
      }
    });
    var step = 0, visible = false, flick = 0, ecgRaf = 0;

    /* ---------- 비상등: 불규칙한 깜빡임 ---------- */
    function flicker() {
      flick = 0;
      if (!visible || step >= 1) return;
      var v = Math.random() < 0.18 ? 0.15 + Math.random() * 0.3 : 0.85 + Math.random() * 0.15;
      ruins.style.setProperty('--lamp', v.toFixed(2));
      flick = setTimeout(flicker, 60 + Math.random() * (v < 0.5 ? 120 : 900));
    }

    /* ---------- 심전도: 뛰다가 평평해진다 ---------- */
    function drawEcg() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      var mid = h * 0.6, t0 = performance.now(), dur = u.reducedMotion ? 1 : 3200;
      function y(x) {
        var beatW = w * 0.16, k = x / w;
        if (k > 0.62) return mid;                        // 멈춤
        var amp = 1 - k * 1.2;                          // 점점 약해짐
        var p = (x % beatW) / beatW;
        if (p > 0.40 && p < 0.44) return mid - (p - 0.40) / 0.04 * h * 0.12 * amp;
        if (p >= 0.44 && p < 0.48) return mid - h * 0.12 * amp + (p - 0.44) / 0.04 * h * 0.62 * amp;
        if (p >= 0.48 && p < 0.52) return mid + h * 0.5 * amp - (p - 0.48) / 0.04 * h * 0.8 * amp;
        if (p >= 0.52 && p < 0.56) return mid - h * 0.3 * amp + (p - 0.52) / 0.04 * h * 0.3 * amp;
        if (p > 0.66 && p < 0.78) return mid - Math.sin((p - 0.66) / 0.12 * Math.PI) * h * 0.08 * amp;
        return mid;
      }
      cancelAnimationFrame(ecgRaf);
      (function frame(now) {
        var k = u.clamp((now - t0) / dur, 0, 1), head = k * w;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 2; ctx.lineJoin = 'round';
        // 지나온 선: 붉은색 → 멈춘 뒤는 흐린 회색
        ctx.beginPath();
        for (var x = 0; x <= Math.min(head, w * 0.62); x += 2) { if (x === 0) ctx.moveTo(x, y(x)); else ctx.lineTo(x, y(x)); }
        ctx.strokeStyle = '#e5262b'; ctx.shadowColor = 'rgba(229,38,43,0.8)'; ctx.shadowBlur = 8; ctx.stroke();
        if (head > w * 0.62) {
          ctx.beginPath(); ctx.moveTo(w * 0.62, mid); ctx.lineTo(head, mid);
          ctx.strokeStyle = 'rgba(239,230,214,0.55)'; ctx.shadowBlur = 0; ctx.stroke();
        }
        // 선 끝의 밝은 점
        ctx.beginPath(); ctx.arc(head, y(head), 3, 0, Math.PI * 2);
        ctx.fillStyle = head > w * 0.62 ? '#efe6d6' : '#ff6a5f'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
        if (k < 1) ecgRaf = requestAnimationFrame(frame);
      })(t0);
    }

    return {
      steps: [0.22, 0.45, 0.7],
      onStep: function (s, prev) {
        step = s;
        if (s === 0 && visible && !flick) flicker();
        if (s >= 1) ruins.style.setProperty('--lamp', '0');
        if (s === 2 && prev !== 2) drawEcg();
        embers.setRate(s >= 3 ? 34 : 0);
      },
      resize: function () { embers.resize(); },
      visible: function (on) {
        visible = on;
        root.classList.toggle('is-paused', !on);
        if (on) { embers.start(); if (step === 0) flicker(); }
        else { embers.stop(); clearTimeout(flick); flick = 0; }
      }
    };
  });
})();
