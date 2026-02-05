document.addEventListener("DOMContentLoaded", () => {
    const POLL_1 = "vote:first";
    const POLL_2 = "vote:second";

    const KEY_COUNTS = (poll) => `counts:${poll}`;

    const $sum1 = document.getElementById("sum1");
    const $sum2 = document.getElementById("sum2");
    const $list1 = document.getElementById("list1");
    const $list2 = document.getElementById("list2");
    const $resetAll = document.getElementById("resetAll");

    function loadCounts(poll) {
        const raw = localStorage.getItem(KEY_COUNTS(poll));
        if (!raw) return {};
        try { return JSON.parse(raw); } catch { return {}; }
    }

    function total(counts) {
        return Object.values(counts).reduce((a, b) => a + b, 0);
    }

    function renderList(container, counts) {
        const t = total(counts);
        const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

        container.innerHTML = "";

        if (entries.length === 0) {
            container.innerHTML = `<p style="margin:0;color:rgba(0,0,0,.65);font-size:12px;">まだ投票がありません。</p>`;
            return;
        }

        for (const [name, n] of entries) {
            const pct = t === 0 ? 0 : Math.round((n / t) * 100);
            const row = document.createElement("div");
            row.className = "r-row";
            row.innerHTML = `
        <div class="r-top">
          <div class="r-name">${name}</div>
          <div class="r-meta">${n}票 / ${pct}%</div>
        </div>
        <div class="r-bar"><div class="r-fill" style="width:${pct}%"></div></div>
      `;
            container.appendChild(row);
        }
    }

    function render() {
        const c1 = loadCounts(POLL_1);
        const c2 = loadCounts(POLL_2);

        $sum1.textContent = `総投票数：${total(c1)}`;
        $sum2.textContent = `総投票数：${total(c2)}`;

        renderList($list1, c1);
        renderList($list2, c2);
    }

    $resetAll.addEventListener("click", () => {
        // 関連キーだけ掃除（雑に全部消すと他機能に影響するので絞る）
        const keys = Object.keys(localStorage);
        keys.forEach(k => {
            if (k.startsWith("counts:vote:") || k.startsWith("voted:vote:") || k.startsWith("last:vote:")) {
                localStorage.removeItem(k);
            }
        });
        render();
    });

    render();
});
