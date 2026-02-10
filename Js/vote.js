// Js/vote.js
(() => {
    "use strict";

    const POLL_1 = "vote:first";
    const POLL_2 = "vote:second";

    const KEY_COUNTS = (poll) => `counts:${poll}`;
    const KEY_VOTED = (poll) => `voted:${poll}`;
    const KEY_LAST = (poll) => `last:${poll}`;

    const STATE_EVENT = "sonoa:statechange";

    // ---- 集計の読み書き ----
    function loadCounts(poll) {
        const raw = localStorage.getItem(KEY_COUNTS(poll));
        if (!raw) return {};
        try {
            return JSON.parse(raw);
        } catch {
            return {};
        }
    }
    function saveCounts(poll, counts) {
        localStorage.setItem(KEY_COUNTS(poll), JSON.stringify(counts));
    }
    function hasVoted(poll) {
        return localStorage.getItem(KEY_VOTED(poll)) === "1";
    }
    function setVoted(poll) {
        localStorage.setItem(KEY_VOTED(poll), "1");
    }
    function setLast(poll, candidateName) {
        localStorage.setItem(
            KEY_LAST(poll),
            JSON.stringify({ name: candidateName, at: new Date().toISOString() })
        );
    }

    // ---- ruby を含む名前の取得（rt/rpを除外してベース文字だけ取る）----
    function normalizeName(str) {
        return (str || "").replace(/\s+/g, "").replace(/　/g, "").trim();
    }

    function getRubyBaseText(h2) {
        const ruby = h2.querySelector("ruby");
        if (!ruby) return normalizeName(h2.textContent);

        let out = "";
        ruby.childNodes.forEach((n) => {
            if (n.nodeType === 1) {
                const tag = n.tagName;
                if (tag === "RT" || tag === "RP") return;
            }
            out += n.textContent || "";
        });
        return normalizeName(out);
    }

    function getCandidateNameFromVoteBtn(btn) {
        const profile = btn.closest(".profile");
        if (!profile) return "（不明）";
        const h2 = profile.querySelector(".profile_name h2");
        return h2 ? getRubyBaseText(h2) : "（不明）";
    }

    function getCandidateNameFromReVoteBtn(btn) {
        const candidate = btn.closest(".candidate");
        if (!candidate) return "（不明）";
        const h2 = candidate.querySelector(".person_name h2");
        return h2 ? getRubyBaseText(h2) : "（不明）";
    }

    // ---- 投票加算 ----
    function addVote(poll, candidateName) {
        const counts = loadCounts(poll);
        counts[candidateName] = (counts[candidateName] ?? 0) + 1;
        saveCounts(poll, counts);
        setVoted(poll);
        setLast(poll, candidateName);

        // index.js などへ状態変化通知
        document.dispatchEvent(new CustomEvent(STATE_EVENT));
    }

    // ---- トースト ----
    function toast(text) {
        const t = document.createElement("div");
        t.className = "voteToast";
        t.textContent = text;
        document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.add("is-show"));
        setTimeout(() => {
            t.classList.remove("is-show");
            setTimeout(() => t.remove(), 250);
        }, 1400);
    }

    // ---- モーダル ----
    function createModal() {
        const el = document.createElement("div");
        el.className = "voteModal";
        el.innerHTML = `
      <div class="voteModal__backdrop" data-close="1"></div>
      <div class="voteModal__card" role="dialog" aria-modal="true">
        <h2 class="voteModal__title"></h2>
        <p class="voteModal__text"></p>
        <div class="voteModal__pick"></div>
        <div class="voteModal__actions">
          <button class="voteModal__btn voteModal__btn--ghost" data-close="1">キャンセル</button>
          <button class="voteModal__btn voteModal__btn--primary" data-ok="1">はい、投票する</button>
        </div>
      </div>
    `;

        const $title = el.querySelector(".voteModal__title");
        const $text = el.querySelector(".voteModal__text");
        const $pick = el.querySelector(".voteModal__pick");
        const $ok = el.querySelector('[data-ok="1"]');
        const $ghost = el.querySelector(".voteModal__btn--ghost");
        const closeBtns = el.querySelectorAll('[data-close="1"]');

        let okHandler = null;

        const open = () => {
            el.classList.add("is-open");
            $ghost.focus();
        };

        const close = () => {
            el.classList.remove("is-open");
            okHandler = null;
            $ok.onclick = null;
        };

        const setContent = ({ title, text, pick, mode }) => {
            $title.textContent = title;
            $text.textContent = text;
            $pick.textContent = pick;

            if (mode === "info") {
                $ok.style.display = "none";
                $ghost.textContent = "閉じる";
            } else {
                $ok.style.display = "";
                $ghost.textContent = "キャンセル";
            }
        };

        const onOk = (fn) => {
            okHandler = fn;
            $ok.onclick = () => okHandler?.();
        };

        closeBtns.forEach((b) => b.addEventListener("click", close));

        window.addEventListener("keydown", (e) => {
            if (!el.classList.contains("is-open")) return;
            if (e.key === "Escape") close();
        });

        return { el, open, close, setContent, onOk };
    }

    function getLastPickText(poll) {
        const raw = localStorage.getItem(KEY_LAST(poll));
        if (!raw) return "（記録なし）";
        try {
            const obj = JSON.parse(raw);
            return obj?.name ?? "（記録なし）";
        } catch {
            return "（記録なし）";
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        // モーダル注入
        const modal = createModal();
        document.body.appendChild(modal.el);

        function openConfirm(poll, candidateName) {
            if (hasVoted(poll)) {
                modal.setContent({
                    title: "投票済みです",
                    text: "この投票は、この端末では1回だけ投票できます。",
                    pick: `前回の投票：${getLastPickText(poll)}`,
                    mode: "info",
                });
                modal.open();
                return;
            }

            modal.setContent({
                title: "本当に投票しますか？",
                text: "この操作は取り消せません。",
                pick: candidateName,
                mode: "confirm",
            });

            modal.onOk(() => {
                addVote(poll, candidateName);
                modal.close();
                toast(`投票しました：${candidateName}`);
            });

            modal.open();
        }

        // クリック委譲：1回目
        document.addEventListener("click", (e) => {
            const btn = e.target.closest(".voteBtn");
            if (!btn) return;
            openConfirm(POLL_1, getCandidateNameFromVoteBtn(btn));
        });

        // クリック委譲：2回目
        document.addEventListener("click", (e) => {
            const btn = e.target.closest(".re_giji_btn");
            if (!btn) return;
            openConfirm(POLL_2, getCandidateNameFromReVoteBtn(btn));
        });
    });
})();
