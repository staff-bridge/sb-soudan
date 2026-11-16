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

    if (id === "q4") { state.stage = i; state.current = "q5"; return renderQuestion(); }
    if (id === "q5") { state.style = i; return renderResult(); }

    if (opt.next.charAt(0) === "t") {
      state.type = opt.next;
      state.current = "q4";
    } else {
      state.current = opt.next;
    }
    renderQuestion();
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
  }

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

  // 採用実績ブランドのロゴを横に流す。同じ列を2回並べて途切れずに流れ続けるようにする（2回目は読み上げ対象外）
  var brandTrack = $("brandTrack");
  if (brandTrack && C.brands) {
    var one = C.brands.map(function (b) {
      return '<li><img src="img/brands/' + b[0] + '" alt="' + b[1] + '" width="160" height="100" decoding="async"></li>';
    }).join("");
    brandTrack.innerHTML = "<ul>" + one + '</ul><ul aria-hidden="true">' + one + "</ul>";
  }

  $("start").addEventListener("click", function () { reset(); renderQuestion(); show("quiz"); track("quiz_start"); });
  $("back").addEventListener("click", back);
  $("retry").addEventListener("click", function () { reset(); show("top"); track("quiz_retry"); });
  $("r-entry").addEventListener("click", function () { track("entry_click", { result_type: state.type }); });
  reset();
})();
