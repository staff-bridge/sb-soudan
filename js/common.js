/* 全ページ共通の小さな処理 */
(function () {
  // どこから来たか（?from=insta など）を覚えておく。QRコードごとにURL末尾を変えると集計できる
  var FROM_KEY = "sb-soudan-from";
  var params = new URLSearchParams(location.search);
  var from = params.get("from");
  try {
    if (from) sessionStorage.setItem(FROM_KEY, from.slice(0, 60));
  } catch (e) { /* 保存できない環境でも動くようにする */ }

  // 日本語を言葉の切れ目で改行させる（iPhoneのSafari対策）。BudouX の <budoux-ja> で包む
  function phrase(el) {
    if (!el || el.querySelector("budoux-ja") || el.closest("budoux-ja")) return;
    var bx = document.createElement("budoux-ja");
    while (el.firstChild) bx.appendChild(el.firstChild);
    el.appendChild(bx);
  }

  window.SB = {
    // 文字を入れて、言葉の切れ目で改行されるようにする
    setText: function (el, text) {
      el.textContent = "";
      var bx = document.createElement("budoux-ja");
      bx.textContent = text;
      el.appendChild(bx);
    },
    phrase: phrase,
    getFrom: function () {
      var v = params.get("from");
      if (v) return v.slice(0, 60);
      try { return sessionStorage.getItem(FROM_KEY) || ""; } catch (e) { return ""; }
    },
    // イラスト枠に画像を入れる。画像がまだ無いときは淡い丸を表示
    setIllust: function (el, file) {
      el.innerHTML = "";
      el.classList.remove("loaded");
      el.classList.add("empty");
      if (!file) return;
      var img = new Image();
      img.alt = "";
      img.decoding = "async";
      img.onload = function () { el.classList.remove("empty"); el.classList.add("loaded"); el.appendChild(img); };
      img.src = "img/" + file;
    }
  };

  // 最初から書いてある見出し・文章も、言葉の切れ目で改行させる
  document.querySelectorAll("h1, h2, h3, p, legend, .points strong, .points span, .hint").forEach(phrase);

  document.querySelectorAll("[data-img]").forEach(function (el) {
    window.SB.setIllust(el, el.getAttribute("data-img"));
  });
})();
