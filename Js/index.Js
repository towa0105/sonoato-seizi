// Js/index.js
(() => {
    "use strict";

    const qs = (s, r = document) => r.querySelector(s);
    const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

    // vote.js から状態変化を通知するイベント名
    const STATE_EVENT = "sonoa:statechange";

    // localStorage keys（vote.jsと合わせる）
    const POLL_1 = "vote:first";
    const POLL_2 = "vote:second";
    const KEY_VOTED = (poll) => `voted:${poll}`;
    const KEY_AREA = "selectedArea";

    const hasVoted = (poll) => localStorage.getItem(KEY_VOTED(poll)) === "1";
    const hasArea = () => !!localStorage.getItem(KEY_AREA);

    // -----------------------------
    // ① 吹き出しテキスト切替
    // -----------------------------
    function initBubble() {
        const messages = [
            "政治に関心がないわけじゃない。",
            "どこで判断すればいいかわからない",
            "この政策が与える影響がわからない",
        ];

        const h2 = qs(".arrow_box h2");
        if (!h2) return;

        // 既に span が入ってたら二重生成しない
        let span = qs(".bubble-text", h2);
        if (!span) {
            span = document.createElement("span");
            span.className = "bubble-text";
            h2.appendChild(span);
        }

        let index = 0;
        const stayMs = 1800;
        const moveMs = 600;

        const showMessage = (i) => {
            span.textContent = messages[i];
            span.classList.remove("is-out");
            requestAnimationFrame(() => span.classList.add("is-in"));
        };

        showMessage(index);

        // 二重タイマー防止（data属性で管理）
        if (h2.dataset.bubbleTimer === "1") return;
        h2.dataset.bubbleTimer = "1";

        setInterval(() => {
            span.classList.remove("is-in");
            span.classList.add("is-out");

            setTimeout(() => {
                index = (index + 1) % messages.length;
                span.classList.remove("is-out");
                requestAnimationFrame(() => {
                    span.textContent = messages[index];
                    span.classList.add("is-in");
                });
            }, moveMs);
        }, stayMs + moveMs);
    }

    // -----------------------------
    // ② giji アコーディオン（委譲）
    // -----------------------------
    function initAccordion() {
        const topics = qsa(".article_giji.js-topic");
        if (!topics.length) return;

        const closeAll = () => {
            qsa(".topic-detail").forEach((d) => {
                d.classList.remove("is-open");
                d.setAttribute("aria-hidden", "true");
            });
            topics.forEach((t) => t.setAttribute("aria-expanded", "false"));
        };

        document.addEventListener("click", (e) => {
            const topic = e.target.closest(".article_giji.js-topic");
            if (topic) {
                const detail = topic.nextElementSibling;
                if (!detail || !detail.classList.contains("topic-detail")) return;

                const isOpen = detail.classList.contains("is-open");
                if (isOpen) {
                    detail.classList.remove("is-open");
                    detail.setAttribute("aria-hidden", "true");
                    topic.setAttribute("aria-expanded", "false");
                    return;
                }

                closeAll();
                detail.classList.add("is-open");
                detail.setAttribute("aria-hidden", "false");
                topic.setAttribute("aria-expanded", "true");

                const y = topic.getBoundingClientRect().top + window.scrollY - 12;
                window.scrollTo({ top: y, behavior: "smooth" });
                return;
            }

            const closeBtn = e.target.closest(".detailClose");
            if (closeBtn) {
                const detail = closeBtn.closest(".topic-detail");
                if (!detail) return;

                const prev = detail.previousElementSibling;
                detail.classList.remove("is-open");
                detail.setAttribute("aria-hidden", "true");
                if (prev && prev.classList.contains("article_giji")) {
                    prev.setAttribute("aria-expanded", "false");
                }
            }
        });
    }

    // -----------------------------
    // ③ 地域選択
    // -----------------------------
    function initAreaSelect() {
        const areaBtns = qsa(".area-btn");
        const confirmBtn = qs(".area-confirm");
        if (!areaBtns.length || !confirmBtn) return;

        let selectedArea = null;

        areaBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                areaBtns.forEach((b) => b.classList.remove("is-selected"));
                btn.classList.add("is-selected");
                selectedArea = (btn.dataset.area || "").trim();
                confirmBtn.classList.add("is-active");
                confirmBtn.disabled = false;
            });
        });

        confirmBtn.addEventListener("click", () => {
            if (!selectedArea) return;
            localStorage.setItem(KEY_AREA, selectedArea);
            document.dispatchEvent(new CustomEvent(STATE_EVENT));
            qs(".giji")?.scrollIntoView({ behavior: "smooth" });
        });
    }

    // -----------------------------
    // ④ 進行状況に応じて非表示制御
    // -----------------------------
    function applyProgressVisibility() {
        const areaSection = qs(".area-select");
        const gijiSection = qs(".giji");
        const reGijiTitle = qs(".re_giji");
        const reGijiCards = qsa(".person");

        // 地域選択が終わっていたら非表示
        if (hasArea() && areaSection) areaSection.classList.add("is-hidden");

        // 1回目投票が終わっていたら非表示
        if (hasVoted(POLL_1) && gijiSection) gijiSection.classList.add("is-hidden");

        // 2回目投票が終わっていたら非表示
        if (hasVoted(POLL_2)) {
            if (reGijiTitle) reGijiTitle.classList.add("is-hidden");
            reGijiCards.forEach((card) => card.classList.add("is-hidden"));
        }
    }

    // -----------------------------
    // ⑤ メニューバ「結果」リンク制御 & アイコン強調
    // -----------------------------
    function updateResultIconAndGate() {
        const link = qs(".js-result-link");
        if (!link) return;

        const done = hasArea() && hasVoted(POLL_1) && hasVoted(POLL_2);

        if (done) link.classList.add("result-ready");
        else link.classList.remove("result-ready");
    }

    function initResultLinkGate() {
        const link = qs(".js-result-link");
        if (!link) return;

        link.addEventListener("click", (e) => {
            const done = hasArea() && hasVoted(POLL_1) && hasVoted(POLL_2);
            if (!done) {
                e.preventDefault();
                alert("すべての投票が終わったあとに結果を見ることができます。");
            }
        });
    }

    // -----------------------------
    // ⑥ 展示会リセットボタン
    // -----------------------------
    function initResetAll() {
        const btn = qs("#resetAll");
        if (!btn) return;

        btn.addEventListener("click", () => {
            const keys = Object.keys(localStorage);
            keys.forEach((k) => {
                if (
                    k === KEY_AREA ||
                    k.startsWith("counts:vote:") ||
                    k.startsWith("voted:vote:") ||
                    k.startsWith("last:vote:")
                ) {
                    localStorage.removeItem(k);
                }
            });
            document.dispatchEvent(new CustomEvent(STATE_EVENT));
            location.reload();
        });
    }

    function applyAllUI() {
        applyProgressVisibility();
        updateResultIconAndGate();
    }

    document.addEventListener("DOMContentLoaded", () => {
        initBubble();
        initAccordion();
        initAreaSelect();
        initResultLinkGate();
        initResetAll();

        applyAllUI();

        // vote.js / area select などからの状態変化に追従
        document.addEventListener(STATE_EVENT, applyAllUI);

        // 別タブ更新にも追従
        window.addEventListener("storage", (e) => {
            if (!e.key) return;
            if (
                e.key === KEY_AREA ||
                e.key.startsWith("voted:vote:") ||
                e.key.startsWith("counts:vote:") ||
                e.key.startsWith("last:vote:")
            ) {
                applyAllUI();
            }
        });
    });
})();
