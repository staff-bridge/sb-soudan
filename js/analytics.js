/*
 * Googleアナリティクス（GA4）
 * ─────────────────────────────────────────
 * ・名前・メール・電話などの個人情報は絶対に送らない（送るのは「どの質問でどれを選んだか」などだけ）
 * ・手元の確認用（localhost）では送らず、送る予定の内容を画面の裏（コンソール）に出すだけにする
 * ・どこから来たか（?from=）は、GA4の「参照元」として記録する
 */
(function () {
  var CFG = window.SB_CONFIG || {};
  var id = CFG.gaId;
  var host = location.hostname;
  var isLocal = host === "localhost" || host === "127.0.0.1" || host === "";

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  // どこから来たか（QRコードの ?from= など）
  var from = "";
  try {
    from = new URLSearchParams(location.search).get("from") || sessionStorage.getItem("sb-soudan-from") || "";
  } catch (e) { /* 使えない環境でも動くように */ }
  from = from.slice(0, 60);

  // 記録用の関数。ほかのファイルからは SB_track("イベント名", {...}) で呼ぶ
  window.SB_track = function (name, params) {
    params = params || {};
    if (from) params.entry_from = from;
    if (isLocal || !id) { if (window.console) console.info("[GA4 送信予定]", name, params); return; }
    gtag("event", name, params);
  };

  if (!id || isLocal) return;

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
  document.head.appendChild(s);

  gtag("js", new Date());
  var conf = {};
  // QRコードは参照元が残らないので、?from= を参照元（utm_source）としてGA4に渡す。
  // 実際のアドレスは変えず、GA4に伝えるページのアドレスにだけ utm を付ける
  if (from) {
    try {
      var u = new URL(location.href);
      if (!u.searchParams.get("utm_source")) {
        u.searchParams.set("utm_source", from);
        u.searchParams.set("utm_medium", "sb-from");
        u.searchParams.set("utm_campaign", "sb-soudan");
      }
      conf.page_location = u.toString();
    } catch (e) { /* 古いブラウザではそのまま */ }
  }
  gtag("config", id, conf);
})();
