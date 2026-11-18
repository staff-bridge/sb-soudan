/* 診断の動き（質問の表示 → 枝分かれ → 結果） */
(function () {
  var C = window.SB_CONTENT;
  var $ = function (id) { return document.getElementById(id); };
  var views = { top: $("view-top"), quiz: $("view-quiz"), result: $("view-result") };
  // GA4への記録（個人情報は送らない）。analytics.js が無くても動くようにする
  var track = function (name, params) { if (window.SB_track) window.SB_track(name, params); };

  // 回答の記録。history は「戻る」用
  var state;
  function reset() {
    state = { current: "q1", history: [], type: null, stage: null, style: null };
  }

  // スマホ・ブラウザの「戻る」ボタンでも1問ずつ戻れるように、質問や結果を出すたびにブラウザの履歴に1つ積む。
  // depth は「トップ＝0、1問目＝1、2問目＝2 … 結果」の段階
  function depth() { return views.top.hidden ? state.history.length + 1 : 0; }
  function pushStep() {
    try { history.pushState({ sb: depth() }, "", location.href); } catch (e) { /* 履歴が使えない環境でも動くようにする */ }
  }
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  function show(name) {
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== name; });
    window.scrollTo(0, 0);
  }

  // 全部で何問になるかの見込み（Q3を通るかどうかで4問か5問）
  function estimateTotal() {
    var ids = state.history.map(function (h) { return h.id; }).concat(state.current);
    var passedQ3 = ids.some(function (id) { return id.indexOf("q3") === 0; });
    var decidedAtQ2 = state.type && !passedQ3;
    return decidedAtQ2 ? 4 : 5;
  }

  function renderQuestion() {
    var q = C.questions[state.current];
    var n = state.history.length + 1;
    var total = estimateTotal();
    $("qno").textContent = "Q." + n;
    $("bar").style.width = Math.round(((n - 1) / total) * 100) + "%";
    $("back").style.visibility = state.history.length ? "visible" : "hidden";

    var body = $("qbody");
    body.classList.remove("fade"); void body.offsetWidth; body.classList.add("fade");
    window.SB.setText($("qtitle"), q.title);

    var ul = $("options");
    ul.innerHTML = "";
    q.options.forEach(function (opt, i) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "option" + (state.current === "q1" ? " feeling" : "");
      b.innerHTML = '<span class="mark">' + "ABCD"[i] + '</span><span class="txt"><span class="label"></span>' +
        (opt.sub ? '<span class="sub"></span>' : "") + "</span>";
      window.SB.setText(b.querySelector(".label"), opt.label);
      if (opt.sub) window.SB.setText(b.querySelector(".sub"), opt.sub);
      b.addEventListener("click", function () { choose(i, b); });
      li.className = "rise";
      li.style.setProperty("--d", (0.12 + i * 0.07).toFixed(2) + "s");
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  var busy = false;
  function choose(i, btn) {
    if (busy) return;
    busy = true;
    btn.classList.add("chosen");
    setTimeout(function () { busy = false; next(i); }, 180);
  }

  function next(i) {
    var id = state.current;
    var opt = C.questions[id].options[i];
    state.history.push({ id: id, choice: i, type: state.type });
    track("quiz_answer", { question_id: id, answer: "ABCD"[i], step: state.history.length });

    if (id === "q4") { state.stage = i; state.current = "q5"; renderQuestion(); return pushStep(); }
    if (id === "q5") { state.style = i; renderResult(); return pushStep(); }

    if (opt.next.charAt(0) === "t") {
      state.type = opt.next;
      state.current = "q4";
    } else {
      state.current = opt.next;
    }
    renderQuestion();
    pushStep();
  }

  function back() {
    var last = state.history.pop();
    if (!last) return;
    track("quiz_back", { question_id: last.id });
    state.current = last.id;
    state.type = last.type;
    if (last.id === "q4") state.stage = null;
    if (last.id === "q5") state.style = null;
    renderQuestion();
    if (views.quiz.hidden) show("quiz");
  }

  // ブラウザの「戻る」「進む」が押されたとき
  window.addEventListener("popstate", function (e) {
    var target = (e.state && typeof e.state.sb === "number") ? e.state.sb : 0;
    var cur = depth();
    if (target === cur) return;
    if (target === 0) { reset(); show("top"); return; }
    if (target > cur) { history.go(cur - target); return; } // 「進む」は使わない（答え直しになるため元の位置へ戻す）
    while (depth() > target && state.history.length) back();
  });

  function renderResult() {
    var r = C.results[state.type];
    $("r-tag").textContent = "あなたは " + r.no + " " + r.name;
    window.SB.setIllust($("r-illust"), r.image);
    var set = window.SB.setText;
    set($("r-title"), r.title);
    set($("r-lead"), r.lead);
    var ul = $("r-can");
    ul.innerHTML = "";
    r.can.forEach(function (t) {
      var li = document.createElement("li"); set(li, t); ul.appendChild(li);
    });
    set($("r-style"), C.questions.q5.options[state.style].message);
    set($("r-stage"), "あなたの今の状況：" + C.questions.q4.options[state.stage].label);

    var q = new URLSearchParams({ type: state.type, stage: String(state.stage), style: String(state.style) });
    var from = window.SB.getFrom();
    if (from) q.set("from", from);
    $("r-entry").href = "entry.html?" + q.toString();

    show("result");
    window.SB_riseChildren(views.result, 0.05, 0.1);
    track("quiz_result", { result_type: state.type, result_name: r.name, stage: state.stage, style: state.style });
  }

  // 会社概要の写真の高さを、左の文字（見出し〜紹介文）の高さにそろえる。
  // 写真の列の幅を少しずつ広げて、「写真の高さ ≧ 文字の高さ」になる一番細い幅を探す（画面幅が変わったら計算し直す）
  var coIntro = document.querySelector(".co-intro");
  var coText = document.querySelector(".co-text");
  var coImg = document.querySelector(".co-photo img");
  if (coIntro && coText && coImg) {
    var RATIO = 307 / 630; // 写真の 横÷縦
    var fitPhoto = function () {
      var total = coIntro.getBoundingClientRect().width;
      if (!total) return;
      var maxW = Math.round(total * 0.42), w = 70, h = 0;
      for (; w <= maxW; w += 2) {
        coIntro.style.setProperty("--photo-w", w + "px");
        h = coText.getBoundingClientRect().height;
        if (w / RATIO >= h) break;
      }
      coImg.style.setProperty("--photo-h", Math.round(Math.min(h, w / RATIO)) + "px");
    };
    var timer;
    fitPhoto();
    window.addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(fitPhoto, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPhoto);
  }

  // 採用実績ブランドのロゴを横に流す（img/brands-color は正式な色のロゴ。面接対策ガイド用にピンクにしていた5つを正式な色に戻したもの）。同じ列を2回並べて途切れずに流れ続けるようにする（2回目は読み上げ対象外）
  var brandTrack = $("brandTrack");
  if (brandTrack && C.brands) {
    var one = C.brands.map(function (b) {
      return '<li><img src="img/brands-color/' + b[0] + '" alt="' + b[1] + '" width="160" height="100"></li>';
    }).join("");
    brandTrack.innerHTML = "<ul>" + one + '</ul><ul aria-hidden="true">' + one + "</ul>";

    // 1コマごとに少しずつ左へ動かし、1列ぶん進んだら最初に戻す（2列目が1列目と同じなので継ぎ目は見えない）。
    // 「視差効果を減らす」がオンの端末では、ゆっくり流す
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var speed = reduce ? 30 : 65; // 1秒あたりに進む距離（px）
    var firstList = brandTrack.firstChild, x = 0, last = 0;
    var step = function (now) {
      var dt = last ? Math.min(now - last, 100) : 0; // タブを離れて戻ったときに大きく飛ばないようにする
      last = now;
      var w = firstList.getBoundingClientRect().width;
      if (w) {
        x -= speed * dt / 1000;
        if (x <= -w) x += w;
        brandTrack.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
      }
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  $("start").addEventListener("click", function () { reset(); renderQuestion(); show("quiz"); pushStep(); track("quiz_start"); });
  $("back").addEventListener("click", function () { history.back(); });
  $("retry").addEventListener("click", function () {
    track("quiz_retry");
    var cur = depth();
    if (cur > 0) history.go(-cur); else { reset(); show("top"); }
  });
  $("r-entry").addEventListener("click", function () { track("entry_click", { result_type: state.type }); });
  reset();
  try { history.replaceState({ sb: 0 }, "", location.href); } catch (e) { /* 何もしない */ }
})();
