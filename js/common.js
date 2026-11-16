/* 全ページ共通の小さな処理 */
(function () {
  // どこから来たか（?from=insta など）を覚えておく。QRコードごとにURL末尾を変えると集計できる
  var FROM_KEY = "sb-soudan-from";
  var params = new URLSearchParams(location.search);
  var from = params.get("from");
  try {
    if (from) sessionStorage.setItem(FROM_KEY, from.slice(0, 60));
  } catch (e) { /* 保存できない環境でも動くようにする */ }

  window.SB = {
    getFrom: function () {
      var v = params.get("from");
      if (v) return v.slice(0, 60);
      try { return sessionStorage.getItem(FROM_KEY) || ""; } catch (e) { return ""; }
    },
    // イラスト枠に画像を入れる。画像がまだ無いときは淡い丸を表示
    setIllust: function (el, file) {
      el.innerHTML = "";
      el.classList.add("empty");
      if (!file) return;
      var img = new Image();
      img.alt = "";
      img.decoding = "async";
      img.onload = function () { el.classList.remove("empty"); el.appendChild(img); };
      img.src = "img/" + file;
    }
  };

  document.querySelectorAll("[data-img]").forEach(function (el) {
    window.SB.setIllust(el, el.getAttribute("data-img"));
  });
})();
