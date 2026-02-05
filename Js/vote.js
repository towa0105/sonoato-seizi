/* Js/vote.js */
document.addEventListener("DOMContentLoaded", () => {
    // ---- 設定（ローカル保存キー）----
    const POLL_1 = "vote:first";   // 1回目投票
    const POLL_2 = "vote:second";  // 2回目投票

    const KEY_COUNTS = (poll) => `counts:${poll}`;
    const KEY_VOTED = (poll) => `voted:${poll}`;
    const KEY_LAST = (poll) => `last:${poll}`;

    // ---- 集計の読み書き ----
    function loadCounts(poll) {
        const raw = localStorage.getItem(KEY_COUNTS(poll));
        if (!raw) return {};
        try { return JSON.parse(raw); } catch { return {}; }
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
        localStorage.setItem(KEY_LAST(poll), JSON.stringify({
            name: candidateName,
            at: new Date().toISOString()
        }));
    }

    // ---- 候補者名をDOMから取る（レイアウト変更しないため）----
    function getCandidateNameFromVoteBtn(btn) {
        // 1回目：.voteBtn は .profile の中にある
        const profile = btn.closest(".profile");
        if (!profile) return "（不明）";
        const h2 = profile.querySelector(".profile_name h2");
        return h2 ? h2.textContent.replace(/\s+/g, "").trim() : "（不明）";
    }

    function getCandidateNameFromReVoteBtn(btn) {
        // 2回目：.re_giji_btn は .candidate の中にある
        const candidate = btn.closest(".candidate");
        if (!candidate) return "（不明）";
        const h2 = candidate.querySelector(".person_name h2");
        return h2 ? h2.textContent.replace(/\s+/g, "").trim() : "（不明）";
    }

    // ---- クリック時の投票処理（確認モーダル → 確定で加算）----
    function addVote(poll, candidateName) {
        const counts = loadCounts(poll);
        counts[candidateName] = (counts[candidateName] ?? 0) + 1;
        saveCounts(poll, counts);
        setVoted(poll);
        setLast(poll, candidateName);
    }

    // ---- モーダル（HTMLに書かずJSで注入＝レイアウトを汚さない）----
    const modal = createModal();
    document.body.appendChild(modal.el);

    function openConfirm(poll, candidateName) {
        if (hasVoted(poll)) {
            modal.setContent({
                title: "投票済みです",
                text: "この投票は、この端末では1回だけ投票できます。",
                pick: `前回の投票：${getLastPickText(poll)}`,
                mode: "info"
            });
            modal.open();
            return;
        }

        modal.setContent({
            title: "本当に投票しますか？",
            text: "この操作は取り消せません。",
            pick: candidateName,
            mode: "confirm"
        });

        modal.onOk(() => {
            addVote(poll, candidateName);
            modal.close();
            // ちょい通知（必要なら消してOK）
            toast(`投票しました：${candidateName}`);
        });

        modal.open();
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

    // ---- イベント付与（既存ボタンにロジックを差し込む）----
    // 1回目
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".voteBtn");
        if (!btn) return;

        const name = getCandidateNameFromVoteBtn(btn);
        openConfirm(POLL_1, name);
    });

    // 2回目
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".re_giji_btn");
        if (!btn) return;

        const name = getCandidateNameFromReVoteBtn(btn);
        openConfirm(POLL_2, name);
    });

    // ---- トースト（超軽量）----
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

    // ---- モーダル生成 ----
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

        const title = el.querySelector(".voteModal__title");
        const text = el.querySelector(".voteModal__text");
        const pick = el.querySelector(".voteModal__pick");
        const okBtn = el.querySelector('[data-ok="1"]');
        const closeBtns = el.querySelectorAll('[data-close="1"]');

        let okHandler = null;

        function open() {
            el.classList.add("is-open");
            okBtn.focus();
        }
        function close() {
            el.classList.remove("is-open");
            okHandler = null;
            // okボタンの挙動を戻す
            okBtn.onclick = null;
        }

        function setContent({ title: t, text: tx, pick: pk, mode }) {
            title.textContent = t;
            text.textContent = tx;
            pick.textContent = pk;

            // confirm / info でボタン表示を切替
            if (mode === "info") {
                okBtn.style.display = "none";
                el.querySelector(".voteModal__btn--ghost").textContent = "閉じる";
            } else {
                okBtn.style.display = "";
                el.querySelector(".voteModal__btn--ghost").textContent = "キャンセル";
            }
        }

        function onOk(fn) {
            okHandler = fn;
            okBtn.onclick = () => okHandler?.();
        }

        // close
        closeBtns.forEach(b => b.addEventListener("click", close));

        // Escで閉じる
        window.addEventListener("keydown", (e) => {
            if (!el.classList.contains("is-open")) return;
            if (e.key === "Escape") close();
        });

        return { el, open, close, setContent, onOk };
    }
});
