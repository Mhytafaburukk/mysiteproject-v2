/* ==========================================================================
   design-system.js — mikro etkileşimler
   - Fareyi takip eden yumuşak eğilme (data-tilt taşıyan kartlar)
   - Kartın içinde gezen hafif ışık (--ds-mx / --ds-my)
   - Sadece hassas fare olan cihazlarda ve hareket azaltma kapalıyken çalışır.
   Mevcut hiçbir fonksiyona veya ID'ye dokunmaz.
   ========================================================================== */
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (reduceMotion || !finePointer) return;

    var TILT_STRENGTH = 6; // derece (maksimum ±3°)

    function onPointerMove(event) {
        var el = event.currentTarget;
        var rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        var px = (event.clientX - rect.left) / rect.width;
        var py = (event.clientY - rect.top) / rect.height;

        el.style.setProperty("--ds-mx", (px * 100).toFixed(2) + "%");
        el.style.setProperty("--ds-my", (py * 100).toFixed(2) + "%");

        if (!el.hasAttribute("data-tilt")) return;

        el.style.setProperty("--ds-rx", ((py - 0.5) * TILT_STRENGTH).toFixed(2) + "deg");
        el.style.setProperty("--ds-ry", ((px - 0.5) * -TILT_STRENGTH).toFixed(2) + "deg");
        el.style.setProperty("--ds-ty", "-3px");
    }

    function onPointerLeave(event) {
        var el = event.currentTarget;
        el.style.setProperty("--ds-rx", "0deg");
        el.style.setProperty("--ds-ry", "0deg");
        el.style.setProperty("--ds-ty", "0px");
        el.style.setProperty("--ds-mx", "50%");
        el.style.setProperty("--ds-my", "50%");
    }

    function bind(el) {
        if (el.dataset.dsMotion === "1") return;
        el.dataset.dsMotion = "1";
        el.addEventListener("pointermove", onPointerMove, { passive: true });
        el.addEventListener("pointerleave", onPointerLeave);
    }

    function scan() {
        var targets = document.querySelectorAll(".ds-tile[data-tilt], .menu-card");
        for (var i = 0; i < targets.length; i++) bind(targets[i]);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", scan);
    } else {
        scan();
    }

    // Sonradan basılan kartlar (ör. admin kartı) için yeniden tara
    new MutationObserver(scan).observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
