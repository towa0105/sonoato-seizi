// Js/results.js
(() => {
    "use strict";

    const POLL_2 = "vote:second";
    const KEY_COUNTS = (poll) => `counts:${poll}`;
    const KEY_VOTED = (poll) => `voted:${poll}`;

    const $winnerName = document.getElementById("winnerName");
    const $winnerImg = document.getElementById("winnerImg");
    const $kpiGrid = document.getElementById("kpiGrid");
    const $achievements = document.getElementById("achievements");
    const $pledges = document.getElementById("pledges");

    const $countsWrap = document.getElementById("countsWrap");
    const $countsList = document.getElementById("countsList");
    const $showCountsBtn = document.getElementById("showCountsBtn");

    const $runnerUpCard = document.getElementById("runnerUpCard");
    const $runnerUpText = document.getElementById("runnerUpText");
    const $timeline = document.getElementById("timeline");

    const $resetAll = document.getElementById("resetAll"); // resultsにもあるなら動く

    // ---- 展示用データ ----
    const REPORTS = {
        "高橋さや": {
            img: "images/高橋.png",
            achievements: [
                "子育て世帯向けの相談窓口を増設（対応時間を拡大）",
                "学校・福祉・地域の連携会議を毎月開催",
                "現場ヒアリングを実施し、支援の導線を整理",
            ],
            pledges: [
                { name: "児童福祉の支援強化", rate: 72, status: "進行中" },
                { name: "教育費負担の軽減", rate: 55, status: "進行中" },
                { name: "相談窓口の拡充", rate: 86, status: "達成" },
            ],
            timeline: [
                { time: "09:00", title: "現場視察・ヒアリング", text: "学校・福祉現場の声を収集し、課題を具体化。" },
                { time: "11:00", title: "関係部署と調整", text: "予算・人員・法令の確認。実行可能な施策に落とし込む。" },
                { time: "14:00", title: "施策の実行", text: "相談窓口の増設、連携会議の設定などを段階導入。" },
                { time: "16:30", title: "進捗共有", text: "関係者へ共有し、ボトルネックを解消。" },
                { time: "18:00", title: "成果の公開", text: "実行率や改善点を可視化して透明性を確保。" },
            ],
        },
        "田辺光一": {
            img: "images/田辺.png",
            achievements: [
                "中小企業の補助制度を整理し、申請手順を簡略化",
                "地域の雇用支援イベントを増やし参加者を拡大",
                "税制・助成に関する説明会を定期開催",
            ],
            pledges: [
                { name: "減税政策の推進", rate: 60, status: "進行中" },
                { name: "雇用支援の強化", rate: 78, status: "進行中" },
                { name: "事業者支援の拡充", rate: 68, status: "進行中" },
            ],
            timeline: [
                { time: "09:30", title: "企業ヒアリング", text: "事業者の困りごとを聞き、支援策の改善点を洗い出す。" },
                { time: "12:00", title: "制度設計会議", text: "補助金・税制の整理と、申請の簡略化を検討。" },
                { time: "15:00", title: "選挙応援演説", text: "〇〇市◻️◻️通り前で応援演説" },
                { time: "17:30", title: "進捗確認", text: "利用状況を集計し、次の改善アクションを決める。" },
            ],
        },
    };

    function loadCounts(poll) {
        const raw = localStorage.getItem(KEY_COUNTS(poll));
        if (!raw) return {};
        try {
            return JSON.parse(raw);
        } catch {
            return {};
        }
    }

    function pickWinner(counts) {
        const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const winner = entries[0] ? { name: entries[0][0], votes: entries[0][1] } : null;
        const runnerUp = entries[1] ? { name: entries[1][0], votes: entries[1][1] } : null;
        return { winner, runnerUp, entries };
    }

    function makeKPI(report) {
        const done = report.pledges.filter((p) => p.status === "達成").length;
        const doing = report.pledges.filter((p) => p.status === "進行中").length;
        const not = report.pledges.filter((p) => p.status === "未着手").length;
        const avg = Math.round(report.pledges.reduce((a, p) => a + p.rate, 0) / report.pledges.length);

        return [
            { label: "公約 実行率（平均）", value: `${avg}%`, hint: "複数公約の平均" },
            { label: "達成", value: `${done}件`, hint: "完了した公約" },
            { label: "進行中", value: `${doing}件`, hint: "実施・調整中" },
            { label: "未着手", value: `${not}件`, hint: "これから着手" },
        ];
    }

    function renderKPI(kpis) {
        if (!$kpiGrid) return;
        $kpiGrid.innerHTML = "";
        kpis.forEach((k) => {
            const div = document.createElement("div");
            div.className = "kpi";
            div.innerHTML = `
        <p class="kpiLabel">${k.label}</p>
        <p class="kpiValue">${k.value}</p>
        <p class="kpiHint">${k.hint}</p>
      `;
            $kpiGrid.appendChild(div);
        });
    }

    function renderAchievements(items) {
        if (!$achievements) return;
        $achievements.innerHTML = "";
        items.forEach((t) => {
            const li = document.createElement("li");
            li.textContent = t;
            $achievements.appendChild(li);
        });
    }

    function renderPledges(pledges) {
        if (!$pledges) return;
        $pledges.innerHTML = "";
        pledges.forEach((p) => {
            const div = document.createElement("div");
            div.className = "pledge";
            div.innerHTML = `
        <div class="pledgeTop">
          <div class="pledgeName">${p.name}（${p.status}）</div>
          <div class="pledgePct">${p.rate}%</div>
        </div>
        <div class="bar"><div class="fill" style="width:${p.rate}%"></div></div>
      `;
            $pledges.appendChild(div);
        });
    }

    function renderCounts(entries) {
        if (!$countsList) return;
        $countsList.innerHTML = "";
        entries.forEach(([name, votes]) => {
            const row = document.createElement("div");
            row.className = "countRow";
            row.innerHTML = `<div>${name}</div><div>${votes}票</div>`;
            $countsList.appendChild(row);
        });
    }

    function renderRunnerUp(runnerUp) {
        if (!$runnerUpCard || !$runnerUpText) return;
        if (!runnerUp) {
            $runnerUpCard.classList.add("is-hidden");
            return;
        }
        $runnerUpCard.classList.remove("is-hidden");
        $runnerUpText.textContent = `${runnerUp.name}（${runnerUp.votes}票）`;
    }

    function renderTimeline(items) {
        if (!$timeline) return;
        $timeline.innerHTML = "";

        if (!items || items.length === 0) {
            $timeline.innerHTML = `<p class="muted">タイムラインデータがありません。</p>`;
            return;
        }

        items.forEach((i) => {
            const div = document.createElement("div");
            div.className = "tlItem";
            div.innerHTML = `
        <div class="tlTime">${i.time}</div>
        <div class="tlBody">
          <p class="tlTitle">${i.title}</p>
          <p class="tlText">${i.text}</p>
        </div>
      `;
            $timeline.appendChild(div);
        });
    }

    function render() {
        const votedSecond = localStorage.getItem(KEY_VOTED(POLL_2)) === "1";
        const counts = loadCounts(POLL_2);
        const { winner, runnerUp, entries } = pickWinner(counts);

        // 票数リストは常に描画
        renderCounts(entries);

        if (!votedSecond || !winner) {
            if ($winnerName) $winnerName.textContent = "まだ当選者が確定していません";
            if ($winnerImg) {
                $winnerImg.src = "";
                $winnerImg.alt = "";
            }
            if ($kpiGrid) $kpiGrid.innerHTML = "";
            if ($achievements) $achievements.innerHTML = `<li>再投票が完了すると、当選後レポートが表示されます。</li>`;
            if ($pledges) $pledges.innerHTML = "";
            if ($runnerUpCard) $runnerUpCard.classList.add("is-hidden");
            if ($timeline) $timeline.innerHTML = "";
            return;
        }

        const report = REPORTS[winner.name];
        if (!report) {
            if ($winnerName) $winnerName.textContent = winner.name;
            if ($achievements) {
                $achievements.innerHTML = `<li>展示用レポートデータが未登録です（REPORTSに候補者名を追加してください）。</li>`;
            }
            renderRunnerUp(runnerUp);
            renderTimeline(null);
            return;
        }

        if ($winnerName) $winnerName.textContent = winner.name;
        if ($winnerImg) {
            $winnerImg.src = report.img;
            $winnerImg.alt = `${winner.name}の写真`;
        }

        renderKPI(makeKPI(report));
        renderAchievements(report.achievements);
        renderPledges(report.pledges);
        renderRunnerUp(runnerUp);
        renderTimeline(report.timeline);
    }

    document.addEventListener("DOMContentLoaded", () => {
        // 票数（参考）の表示切替
        if ($showCountsBtn && $countsWrap) {
            $showCountsBtn.addEventListener("click", () => {
                const hidden = $countsWrap.classList.contains("is-hidden");
                if (hidden) {
                    $countsWrap.classList.remove("is-hidden");
                    $countsWrap.setAttribute("aria-hidden", "false");
                    $showCountsBtn.textContent = "票数（参考）を隠す";
                } else {
                    $countsWrap.classList.add("is-hidden");
                    $countsWrap.setAttribute("aria-hidden", "true");
                    $showCountsBtn.textContent = "票数（参考）を表示";
                }
            });
        }

        // // 展示リセット（resultsにもボタンがある場合）
        // if ($resetAll) {
        //     $resetAll.addEventListener("click", () => {
        //         const keys = Object.keys(localStorage);
        //         keys.forEach((k) => {
        //             if (
        //                 k === "selectedArea" ||
        //                 k.startsWith("counts:vote:") ||
        //                 k.startsWith("voted:vote:") ||
        //                 k.startsWith("last:vote:")
        //             ) {
        //                 localStorage.removeItem(k);
        //             }
        //         });
        //         location.href = "index.html";
        //     });
        // }

        render();
    });
})();
