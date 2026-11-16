/* 申し込みフォームの動き（入力チェック → Googleフォームへ送信） */
(function () {
  var C = window.SB_CONTENT;
  var CFG = window.SB_CONFIG;
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);

  // ── 診断結果を受け取る（URLの ?type=t3&stage=2&style=1） ──
  var typeId = params.get("type");
  var result = C.results[typeId] || null;
  var stageIdx = parseInt(params.get("stage"), 10);
  var styleIdx = parseInt(params.get("style"), 10);
  var stage = C.questions.q4.options[stageIdx];
  var style = C.questions.q5.options[styleIdx];
  var from = window.SB.getFrom();

  if (result) {
    $("summary").hidden = false;
    $("sum-type").textContent = "診断結果：" + result.no + " " + result.name;
    $("sum-detail").textContent = [stage && stage.label, style && style.label].filter(Boolean).join(" ／ ");
  }
  if (!CFG.formAction) $("testmode").hidden = false;
  $("privacy-link").href = CFG.privacyUrl;

  // ── 希望日時の選択肢 ──
  var TIMES = ["午前（10〜12時）", "午後（13〜17時）", "夕方以降（17時〜）"];
  var today = new Date();
  var pad = function (n) { return ("0" + n).slice(-2); };
  var minDate = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());
  [1, 2, 3].forEach(function (n) {
    var sel = $("wish" + n + "-time");
    sel.innerHTML = '<option value="">時間帯</option>' + TIMES.map(function (t) { return "<option>" + t + "</option>"; }).join("");
    $("wish" + n + "-date").min = minDate;
  });

  function wishText(n) {
    var d = $("wish" + n + "-date").value;
    var t = $("wish" + n + "-time").value;
    if (!d && !t) return "";
    var label = d;
    if (d) {
      var p = d.split("-");
      var dt = new Date(+p[0], +p[1] - 1, +p[2]);
      label = (+p[1]) + "/" + (+p[2]) + "（" + "日月火水木金土"[dt.getDay()] + "）";
    }
    return [label, t].filter(Boolean).join(" ");
  }

  // ── 入力チェック ──
  function mark(el, bad) { el.classList.toggle("invalid", bad); el.setAttribute("aria-invalid", bad ? "true" : "false"); }

  function validate() {
    var errors = [];
    function need(id, msg, ok) {
      var el = $(id);
      var good = ok ? ok(el.value.trim()) : el.value.trim() !== "";
      mark(el, !good);
      if (!good) errors.push({ el: el, msg: msg });
    }
    need("name", "お名前を入力してください");
    need("kana", "ふりがなを入力してください");
    need("email", "メールアドレスを正しく入力してください", function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); });
    need("tel", "電話番号を入力してください", function (v) { return v.replace(/[^0-9０-９]/g, "").length >= 10; });
    need("school", "学校名を入力してください");
    need("grad", "卒業予定を選んでください");
    need("wish1-date", "第1希望の日付を選んでください");
    need("wish1-time", "第1希望の時間帯を選んでください");

    var method = document.querySelector('input[name="method"]:checked');
    $("method-box").classList.toggle("invalid", !method);
    if (!method) errors.push({ el: $("method-box").querySelector("input"), msg: "参加方法を選んでください" });

    if (!$("agree").checked) errors.push({ el: $("agree"), msg: "プライバシーポリシーへの同意が必要です" });
    return errors;
  }

  // 入力し直したら赤枠を消す
  document.querySelectorAll("#entry input, #entry select, #entry textarea").forEach(function (el) {
    el.addEventListener("input", function () { mark(el, false); $("form-err").hidden = true; });
    el.addEventListener("change", function () {
      mark(el, false);
      if (el.name === "method") $("method-box").classList.remove("invalid");
    });
  });

  // ── 送信 ──
  $("entry").addEventListener("submit", function (e) {
    e.preventDefault();
    var errors = validate();
    if (errors.length) {
      $("form-err").textContent = errors.map(function (x) { return "・" + x.msg; }).join("\n");
      $("form-err").style.whiteSpace = "pre-line";
      $("form-err").hidden = false;
      errors[0].el.focus();
      errors[0].el.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    var values = {
      name: $("name").value.trim(),
      kana: $("kana").value.trim(),
      email: $("email").value.trim(),
      tel: $("tel").value.trim(),
      school: $("school").value.trim(),
      grad: $("grad").value,
      wish1: wishText(1),
      wish2: wishText(2),
      wish3: wishText(3),
      method: document.querySelector('input[name="method"]:checked').value,
      message: $("message").value.trim(),
      type: result ? result.no + " " + result.name : "診断なし",
      stage: stage ? stage.label : "",
      style: style ? style.label : "",
      from: from || "（なし）"
    };

    var btn = $("submit");
    btn.disabled = true;
    btn.textContent = "送信中…";

    send(values).then(done, function () {
      btn.disabled = false;
      btn.textContent = "この内容で申し込む";
      $("form-err").textContent = "送信できませんでした。通信状況を確認して、もう一度お試しください。";
      $("form-err").hidden = false;
    });
  });

  function send(values) {
    if (!CFG.formAction) {
      console.info("[テストモード] 送信内容", values);
      return new Promise(function (r) { setTimeout(r, 500); });
    }
    var body = new URLSearchParams();
    Object.keys(values).forEach(function (k) {
      var id = CFG.entry[k];
      if (id && values[k] !== "") body.append("entry." + id, values[k]);
    });
    // Googleフォームは返事の中身を読めない送り方（no-cors）で送る。通信自体が失敗したときだけエラーになる
    return fetch(CFG.formAction, { method: "POST", mode: "no-cors", body: body });
  }

  function done() {
    $("form-view").hidden = true;
    $("thanks-view").hidden = false;
    window.SB_riseChildren($("thanks-view"), 0.05, 0.12);
    window.SB.setText($("thanks-msg"), "お申し込みを受け付けました。" + CFG.replyDays +
      "営業日以内に、担当者からメールまたはお電話で日程のご連絡をします。当日お話しできるのを楽しみにしています。");
    window.scrollTo(0, 0);
  }
})();
