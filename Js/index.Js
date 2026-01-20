
document.addEventListener("DOMContentLoaded", () => {
    const messages = [
        "政治に関心がないわけじゃない。",
        "どこで判断すればいいかわからない",
        "この政策が与える影響がわからない"
    ];

    const h2 = document.querySelector(".arrow_box h2");
    if (!h2) return;

    // span を作って中に差し込む（HTMLはそのままでOK）
    const span = document.createElement("span");
    span.className = "bubble-text";
    h2.appendChild(span);

    let index = 0;

    // タイミング調整（ここだけ触ればOK）
    const stayMs = 1800;   // 中央で止まってる時間
    const moveMs = 600;    // CSS transition と合わせる（0.6s）

    function showMessage(i) {
        span.textContent = messages[i];

        // 右外 → 中央（入る）
        span.classList.remove("is-out");
        // 次フレームで is-in を付ける（transitionを確実に発火させる）
        requestAnimationFrame(() => {
            span.classList.add("is-in");
        });
    }

    // 初回表示
    showMessage(index);

    setInterval(() => {
        // 中央 → 左（出る）
        span.classList.remove("is-in");
        span.classList.add("is-out");

        // 出切ったあとに文を差し替えて、右から入れる
        setTimeout(() => {
            index = (index + 1) % messages.length;

            // いったん右外に戻す（classだけで戻すため is-out を外す）
            span.classList.remove("is-out");

            // 右外状態を確定させてからテキスト更新→in
            requestAnimationFrame(() => {
                span.textContent = messages[index];
                span.classList.add("is-in");
            });
        }, moveMs);
    }, stayMs + moveMs);
});


