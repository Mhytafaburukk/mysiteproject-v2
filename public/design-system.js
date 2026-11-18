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

/* ==========================================================================
   MİKRO ETKİLEŞİM KATMANI
   - Kaydırdıkça belirginleşen cam navbar (.ds-scrolled)
   - Hatalı form alanlarında yumuşak titreşim (.ds-shake)
   - Görsellerde yumuşak netleşme (.ds-img / .ds-img--loaded)
   Mevcut fonksiyonlara ve ID'lere dokunmaz; yalnızca yeni davranış ekler.
   ========================================================================== */
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* --- 0. Medya cilası: style.css yüklemeyen sayfalar için stil köprüsü -- */

    function injectMediaPolishStyles() {
        if (document.querySelector("style[data-ds-media-polish]")) return;
        var style = document.createElement("style");
        style.setAttribute("data-ds-media-polish", "1");
        style.textContent =
            /* Medya: yumuşak yakınlaşma + netleşme */
            ".target-box img,.header-avatar,.profile-pic,.profile-img,.hero-image{transition:transform 700ms cubic-bezier(.22,1,.36,1),opacity 640ms ease,filter 640ms ease}" +
            "img.ds-img{opacity:0;filter:blur(10px);transition:opacity 640ms ease,filter 640ms ease,transform 700ms cubic-bezier(.22,1,.36,1)}" +
            "img.ds-img.ds-img--loaded{opacity:1;filter:blur(0)}" +
            "@media (hover:hover) and (pointer:fine){.target-box:hover img,.profile-pic-container:hover .profile-pic,.profile-pic:hover,.profile-img:hover,.header-avatar:hover,.hero-image:hover{transform:scale(1.035)}}" +
            /* Formlar: odak halkası, etiket yükselmesi, hata titreşimi */
            ":is(.ai-input,.input-box,.form-input,.form-select,.secure-input,.text-input,.drawer-input,.search-box):focus,#langPreferenceModal select:focus{outline:none;border-color:#7c6cf0;box-shadow:0 0 0 3px rgba(108,92,231,.18),0 10px 30px -18px rgba(108,92,231,.6)}" +
            "@keyframes ds-shake{0%,100%{transform:translateX(0)}18%{transform:translateX(-5px)}36%{transform:translateX(4px)}54%{transform:translateX(-3px)}72%{transform:translateX(2px)}88%{transform:translateX(-1px)}}" +
            ".ds-shake{animation:ds-shake 440ms cubic-bezier(.36,.07,.19,.97) both}" +
            ":is(.ai-input,.input-box,.form-input,.form-select,.secure-input,.text-input,.drawer-input,.search-box):user-invalid{animation:ds-shake 440ms cubic-bezier(.36,.07,.19,.97) both;border-color:#ef4444}" +
            ".input-group,.ds-field{position:relative}" +
            ".input-group>label,.ds-label,.form-label{transform-origin:left center;transition:transform 280ms cubic-bezier(.22,1,.36,1),color 200ms ease}" +
            ".input-group:focus-within>label,.ds-field:focus-within>.ds-label,.form-group:focus-within>.form-label{transform:translateY(-2px);color:#8b7cf5}" +
            /* Modal & toast geçişleri */
            ".modal-overlay,.notif-dropdown{opacity:0;transition:opacity 280ms cubic-bezier(.22,.8,.24,1),backdrop-filter 280ms ease,-webkit-backdrop-filter 280ms ease,display 280ms allow-discrete}" +
            ".modal-overlay[style*='display: flex'],.modal-overlay[style*='display:flex'],.modal-overlay[style*='display: block'],.modal-overlay[style*='display:block'],.notif-dropdown.show{opacity:1}" +
            ".modal-overlay[style*='display: flex'],.modal-overlay[style*='display:flex'],.modal-overlay[style*='display: block'],.modal-overlay[style*='display:block']{backdrop-filter:blur(16px) saturate(140%);-webkit-backdrop-filter:blur(16px) saturate(140%)}" +
            "@starting-style{.modal-overlay[style*='display: flex'],.modal-overlay[style*='display:flex'],.modal-overlay[style*='display: block'],.modal-overlay[style*='display:block'],.notif-dropdown.show{opacity:0}}" +
            "@keyframes ds-modal-pop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}" +
            ".modal-overlay>.modal-card{animation:ds-modal-pop 340ms cubic-bezier(.22,1,.36,1) both}" +
            "#langPreferenceModal{opacity:0;transition:opacity 280ms cubic-bezier(.22,.8,.24,1),backdrop-filter 280ms ease,-webkit-backdrop-filter 280ms ease,display 280ms allow-discrete}" +
            "#langPreferenceModal[style*='display: flex'],#langPreferenceModal[style*='display:flex']{opacity:1;backdrop-filter:blur(16px) saturate(140%)!important;-webkit-backdrop-filter:blur(16px) saturate(140%)!important}" +
            "@starting-style{#langPreferenceModal[style*='display: flex'],#langPreferenceModal[style*='display:flex']{opacity:0}}" +
            "#langPreferenceModal>div{animation:ds-modal-pop 340ms cubic-bezier(.22,1,.36,1) both}" +
            "@keyframes ds-toast-in{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}" +
            ".notif-dropdown.show{animation:ds-toast-in 320ms cubic-bezier(.22,1,.36,1) both}" +
            "@media (prefers-reduced-motion:reduce){img.ds-img{opacity:1!important;filter:none!important;transition:none!important}.ds-shake{animation:none!important;transition:none!important}.modal-overlay,.notif-dropdown,.modal-overlay>.modal-card,#langPreferenceModal,#langPreferenceModal>div{animation:none!important;transition:none!important}}";
        document.head.appendChild(style);
    }

    injectMediaPolishStyles();

    /* --- 0a. Global Obsidian ambient katmanı (aurora + parçacıklar) ------- */

    function injectAmbientStyles() {
        if (document.querySelector("style[data-ds-ambient]")) return;
        var style = document.createElement("style");
        style.setAttribute("data-ds-ambient", "1");
        style.textContent =
            "body{isolation:isolate}" +
            ".ds-ambient{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none}" +
            ".ds-aurora{position:absolute;border-radius:50%;opacity:.55;will-change:transform;animation:ds-aurora-drift 26s ease-in-out infinite alternate}" +
            ".ds-aurora--indigo{width:56vmax;height:56vmax;left:-14%;top:-20%;background:radial-gradient(circle at 50% 50%,rgba(124,92,255,.34) 0%,rgba(124,92,255,.12) 38%,transparent 70%);animation-duration:28s}" +
            ".ds-aurora--violet{width:48vmax;height:48vmax;right:-12%;top:8%;background:radial-gradient(circle,rgba(168,85,247,.26) 0%,transparent 68%);animation-duration:34s;animation-delay:-8s}" +
            ".ds-aurora--cyan{width:44vmax;height:44vmax;left:18%;bottom:-18%;background:radial-gradient(circle,rgba(34,211,238,.22) 0%,transparent 70%);animation-duration:30s;animation-delay:-14s}" +
            "@keyframes ds-aurora-drift{0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(4vw,3vh,0) scale(1.07)}100%{transform:translate3d(-3vw,5vh,0) scale(.97)}}" +
            ".ds-particle-field{position:absolute;inset:-4%;will-change:transform;transition:transform 520ms cubic-bezier(.22,1,.36,1)}" +
            ".ds-particle{position:absolute;font-family:'Plus Jakarta Sans','Poppins',sans-serif;font-weight:600;font-size:clamp(10px,1.2vw,15px);letter-spacing:.14em;color:#C4B5FF;opacity:.07;text-shadow:0 0 14px rgba(124,92,255,.45);animation:ds-particle-drift var(--dur,26s) ease-in-out infinite alternate;animation-delay:var(--delay,0s);user-select:none;white-space:nowrap}" +
            ".ds-particle--line{height:1px;width:var(--len,120px);border-radius:1px;background:linear-gradient(90deg,transparent,rgba(124,92,255,.55),transparent);opacity:.08;animation:none}" +
            "@keyframes ds-particle-drift{0%{transform:translate3d(0,0,0)}50%{transform:translate3d(7px,-16px,0)}100%{transform:translate3d(-6px,10px,0)}}" +
            "body>.call-room{background:radial-gradient(circle at 50% 30%,rgba(25,20,48,.88) 0%,rgba(7,8,11,.96) 70%)}" +
            "@media (prefers-reduced-motion:reduce){.ds-aurora,.ds-particle{animation:none!important}.ds-particle-field{transition:none!important}}";
        document.head.appendChild(style);
    }

    function mountAmbientScene() {
        if (!document.body || document.querySelector(".ds-ambient")) return;

        var layer = document.createElement("div");
        layer.className = "ds-ambient";
        layer.setAttribute("aria-hidden", "true");

        var tokens = ["Aa", "B2", "C1", "Speak", "AI", "listen", "talk", "hello", "word", "fluent", "grammar", "B1", "C2", "think", "say"];
        var spots = [
            [7, 18], [22, 70], [34, 12], [47, 82], [59, 24], [71, 62], [84, 14], [14, 46],
            [90, 40], [29, 54], [54, 66], [67, 8], [41, 36], [78, 86], [11, 86], [87, 66]
        ];
        var html = '<span class="ds-aurora ds-aurora--indigo"></span>' +
            '<span class="ds-aurora ds-aurora--violet"></span>' +
            '<span class="ds-aurora ds-aurora--cyan"></span>' +
            '<div class="ds-particle-field">';

        for (var i = 0; i < spots.length; i++) {
            html += '<span class="ds-particle" style="left:' + spots[i][0] + '%;top:' + spots[i][1] +
                '%;--dur:' + (20 + (i % 6) * 3) + 's;--delay:-' + (i * 1.8).toFixed(1) + 's;">' +
                tokens[i % tokens.length] + '</span>';
        }

        var lines = [
            [18, 30, -24, 120], [63, 18, 18, 150], [36, 76, 12, 100], [75, 72, -14, 130], [8, 62, 28, 90]
        ];
        for (var j = 0; j < lines.length; j++) {
            html += '<span class="ds-particle ds-particle--line" style="left:' + lines[j][0] + '%;top:' +
                lines[j][1] + '%;--len:' + lines[j][3] + 'px;transform:rotate(' + lines[j][2] + 'deg);"></span>';
        }
        html += "</div>";
        layer.innerHTML = html;

        document.body.insertBefore(layer, document.body.firstChild);

        // Hafif fare parallax'ı — yalnızca hassas işaretçi ve hareket azaltma kapalıysa
        var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        var field = layer.querySelector(".ds-particle-field");
        if (field && finePointer && !reduceMotion) {
            var scheduled = false;
            var targetX = 0;
            var targetY = 0;
            document.addEventListener("pointermove", function (event) {
                targetX = ((event.clientX / window.innerWidth) - 0.5) * 18;
                targetY = ((event.clientY / window.innerHeight) - 0.5) * 14;
                if (scheduled) return;
                scheduled = true;
                window.requestAnimationFrame(function () {
                    field.style.transform = "translate3d(" + targetX.toFixed(2) + "px," + targetY.toFixed(2) + "px,0)";
                    scheduled = false;
                });
            }, { passive: true });
        }
    }

    injectAmbientStyles();
    if (document.body) {
        mountAmbientScene();
    } else {
        document.addEventListener("DOMContentLoaded", mountAmbientScene);
    }

    /* --- 0b. Bento spotlight: fareyi takip eden iç ışık ------------------- */

    var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    function bindSpotlight(el) {
        if (!el || el.dataset.dsSpot === "1") return;
        el.dataset.dsSpot = "1";

        el.addEventListener("pointermove", function (event) {
            var rect = el.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            var px = (event.clientX - rect.left) / rect.width;
            var py = (event.clientY - rect.top) / rect.height;
            el.style.setProperty("--ds-mx", (px * 100).toFixed(2) + "%");
            el.style.setProperty("--ds-my", (py * 100).toFixed(2) + "%");
        }, { passive: true });

        el.addEventListener("pointerleave", function () {
            el.style.setProperty("--ds-mx", "50%");
            el.style.setProperty("--ds-my", "50%");
        });
    }

    function scanSpotlights() {
        var tiles = document.querySelectorAll(".ds-tile");
        for (var i = 0; i < tiles.length; i++) bindSpotlight(tiles[i]);
    }

    if (!reduceMotion && finePointer) {
        scanSpotlights();
    }

    /* --- 1. Cam navbar: sayfa kaydırıldıkça camlaşır ---------------------- */

    var barSelector = ".ds-topbar, .nav-container";
    var bars = [];
    var scrollTicking = false;

    function collectBars() {
        bars = Array.prototype.slice.call(document.querySelectorAll(barSelector));
    }

    function updateBars() {
        var scrolled = (window.pageYOffset || document.documentElement.scrollTop || 0) > 8;
        for (var i = 0; i < bars.length; i++) {
            bars[i].classList.toggle("ds-scrolled", scrolled);
        }
        scrollTicking = false;
    }

    function onScroll() {
        if (scrollTicking) return;
        scrollTicking = true;
        window.requestAnimationFrame(updateBars);
    }

    collectBars();
    updateBars();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    /* --- 2. Hatalı girişlerde yumuşak titreşim ---------------------------- */

    var SHAKE_CLASS = "ds-shake";

    function shakeField(field) {
        if (!field || reduceMotion) return;
        field.classList.remove(SHAKE_CLASS);
        void field.offsetWidth; // animasyonu yeniden başlat
        field.classList.add(SHAKE_CLASS);
        window.setTimeout(function () {
            field.classList.remove(SHAKE_CLASS);
        }, 520);
    }

    document.addEventListener("invalid", function (event) {
        var target = event.target;
        if (!target || !target.matches || !target.matches("input, select, textarea")) return;
        var field = target.closest(".input-group, .ds-field, .form-group") || target;
        shakeField(field);
    }, true);

    document.addEventListener("input", function (event) {
        var target = event.target;
        if (!target || !target.matches) return;
        var field = target.closest(".ds-shake");
        if (field) field.classList.remove(SHAKE_CLASS);
    }, true);

    /* Sunucudan dönen hata mesajlarında form alanlarını titreştir */
    function isErrorStatus(el) {
        var text = (el.textContent || "").trim();
        if (!text) return false;
        var color = window.getComputedStyle(el).color || "";
        // Kırmızı tonlu hata rengi (ör. #dc3545 → rgb(220, 53, 69))
        var rgb = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (rgb && +rgb[1] > 150 && +rgb[2] < 120 && +rgb[3] < 120) return true;
        return /(hata|hatalı|başarısız|geçersiz|yanlış|ulaşılamıyor)/i.test(text);
    }

    function watchStatusMessage(el) {
        if (!el || el.dataset.dsStatusWatch === "1") return;
        el.dataset.dsStatusWatch = "1";
        new MutationObserver(function () {
            if (!isErrorStatus(el)) return;
            var scope = el.closest("form") || document.querySelector(".login-form") || document;
            var fields = scope.querySelectorAll(".input-group, .ds-field");
            for (var i = 0; i < fields.length; i++) {
                (function (field, delay) {
                    window.setTimeout(function () { shakeField(field); }, delay);
                })(fields[i], i * 65);
            }
        }).observe(el, {
            childList: true,
            characterData: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["style", "class"]
        });
    }

    function scanStatusMessages(root) {
        var scope = root || document;
        if (!scope.querySelectorAll) return;
        var nodes = scope.querySelectorAll(".status-message, .test-result-box");
        for (var i = 0; i < nodes.length; i++) watchStatusMessage(nodes[i]);
    }

    scanStatusMessages(document);

    /* --- 3. Görsellerde pürüzsüz netleşme --------------------------------- */

    var imgTicking = false;

    function prepareImage(img) {
        if (!img || img.dataset.dsImgReady === "1") return;
        img.dataset.dsImgReady = "1";
        img.classList.add("ds-img");

        if (img.complete) {
            img.classList.add("ds-img--loaded");
            return;
        }

        var reveal = function () {
            img.classList.add("ds-img--loaded");
        };
        img.addEventListener("load", reveal, { once: true });
        img.addEventListener("error", reveal, { once: true });
    }

    function scanImages(root) {
        var scope = root || document;
        if (scope.nodeType === 1 && scope.tagName === "IMG") prepareImage(scope);
        if (!scope.querySelectorAll) return;
        var images = scope.querySelectorAll("img");
        for (var i = 0; i < images.length; i++) prepareImage(images[i]);
    }

    function scheduleImageScan() {
        if (imgTicking) return;
        imgTicking = true;
        window.requestAnimationFrame(function () {
            scanImages(document);
            imgTicking = false;
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", scheduleImageScan);
    } else {
        scheduleImageScan();
    }

    /* --- 4. Sonradan eklenen navbar/görseller ----------------------------- */

    if (window.MutationObserver) {
        new MutationObserver(function (records) {
            var hasAdded = false;
            for (var i = 0; i < records.length; i++) {
                if (records[i].addedNodes && records[i].addedNodes.length) {
                    hasAdded = true;
                    break;
                }
            }
            if (!hasAdded) return;
            collectBars();
            updateBars();
            if (!reduceMotion && finePointer) scanSpotlights();
            scanStatusMessages(document);
            scheduleImageScan();
        }).observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }
})();
