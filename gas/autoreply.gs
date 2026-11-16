/**
 * 就活相談会 申し込み（サイト経由）── 自動返信メール＋社内通知
 * ─────────────────────────────────────────────
 * このコードは Googleフォームの「スクリプト エディタ」に貼り付けて使います。
 * 手順は README.md の「自動返信メールと社内通知」を見てください。
 *
 * ★ 下の「設定」だけ書き換えればOKです。
 *   ※ このファイルは公開リポジトリにあるので、実際のメールアドレスは
 *     GitHub側には書かず、スクリプト エディタに貼り付けたあとで書き入れてください。
 */

// ===== 設定 =====
var SETTINGS = {
  NOTIFY_TO: 'ここに通知を受け取るアドレス',      // 社内通知の送り先（複数なら「,」で区切る）
  REPLY_TO: '',                                   // 学生が返信したときの宛先（空なら送り主＝このフォームの持ち主）
  SENDER_NAME: 'スタッフブリッジ 就活相談会事務局', // メールの送り主として表示される名前
  REPLY_DAYS: 2,                                  // 「〇営業日以内にご連絡します」の日数
  SITE_URL: 'https://staff-bridge.github.io/sb-soudan/'
};
// ================

/** 最初に1回だけ実行する：フォームが送信されたら onSubmit が動くように登録する */
function setup() {
  var form = FormApp.getActiveForm();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onSubmit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onSubmit').forForm(form).onFormSubmit().create();
  Logger.log('設定できました。フォームが送信されると自動でメールが送られます。');
}

/** フォームが送信されるたびに動く */
function onSubmit(e) {
  var a = readAnswers(e.response);
  var email = (a['メールアドレス'] || '').trim();

  // 1) 社内通知（先に送る。学生へのメールが失敗しても、申し込みには必ず気づけるように）
  if (SETTINGS.NOTIFY_TO && SETTINGS.NOTIFY_TO.indexOf('@') > 0) {
    var notice = {
      to: SETTINGS.NOTIFY_TO,
      subject: '【就活相談会】新しい申し込み：' + (a['氏名'] || '(名前なし)') + '（' + (a['診断タイプ'] || '診断なし') + '）',
      body: notifyBody(a, e.response),
      name: '就活相談会 申し込み通知'
    };
    if (isEmail(email)) notice.replyTo = email;
    MailApp.sendEmail(notice);
  }

  // 2) 学生への自動返信（メールアドレスの形が正しいときだけ）
  if (isEmail(email) && !sentRecently(email)) {
    var mail = {
      to: email,
      subject: '【スタッフブリッジ】就活相談会のお申し込みを受け付けました',
      body: replyBody(a),
      name: SETTINGS.SENDER_NAME
    };
    if (SETTINGS.REPLY_TO) mail.replyTo = SETTINGS.REPLY_TO;
    MailApp.sendEmail(mail);
  }
}

/** フォームの答えを「質問の名前 → 答え」の形にする */
function readAnswers(response) {
  var out = {};
  response.getItemResponses().forEach(function (r) {
    out[r.getItem().getTitle().trim()] = String(r.getResponse() || '').trim();
  });
  return out;
}

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** 同じアドレスに10分以内に2通以上送らない（二重送信やいたずら対策） */
function sentRecently(email) {
  var cache = CacheService.getScriptCache();
  var key = 'sent:' + email.toLowerCase();
  if (cache.get(key)) return true;
  cache.put(key, '1', 600);
  return false;
}

function line(label, value) {
  return '■' + label + '：' + (value ? value : '（なし）');
}

/** 学生に届くメールの本文 */
function replyBody(a) {
  var wishes = [a['第1希望日時'], a['第2希望日時'], a['第3希望日時']].filter(String);
  return [
    (a['氏名'] || '') + ' さん',
    '',
    'スタッフブリッジの就活相談会にお申し込みいただき、ありがとうございます。',
    '以下の内容で受け付けました。',
    '',
    line('診断タイプ', a['診断タイプ']),
    line('ご希望の日時', wishes.join(' ／ ')),
    line('参加方法', a['参加方法']),
    '',
    SETTINGS.REPLY_DAYS + '営業日以内に、担当者からメールまたはお電話で日程確定のご連絡をします。',
    'もうしばらくお待ちください。',
    '',
    'うまく話せなくても、気持ちがまとまっていなくても大丈夫です。',
    '当日お話しできるのを楽しみにしています。',
    '',
    '※ このメールは自動で送信しています。',
    '※ お心当たりのない場合は、お手数ですがこのメールを破棄してください。',
    '',
    '────────────────',
    SETTINGS.SENDER_NAME,
    SETTINGS.SITE_URL,
    '────────────────'
  ].join('\n');
}

/** 社内に届く通知の本文 */
function notifyBody(a, response) {
  var sheetNote = '';
  try {
    var id = FormApp.getActiveForm().getDestinationId();
    if (id) sheetNote = '回答の一覧：https://docs.google.com/spreadsheets/d/' + id + '/edit';
  } catch (err) { /* スプレッドシート未連携でも通知は送る */ }

  return [
    '就活相談会に新しい申し込みがありました。',
    '学生には自動返信で「' + SETTINGS.REPLY_DAYS + '営業日以内に連絡」と伝えています。',
    '',
    '【診断】',
    line('診断タイプ', a['診断タイプ']),
    line('就活の進み具合', a['就活の進み具合']),
    line('話し方の希望', a['話し方の希望']),
    '',
    '【学生の情報】',
    line('氏名', a['氏名']),
    line('ふりがな', a['ふりがな']),
    line('メールアドレス', a['メールアドレス']),
    line('電話番号', a['電話番号']),
    line('学校名', a['学校名']),
    line('卒業予定', a['卒業予定']),
    '',
    '【希望日時・参加方法】',
    line('第1希望', a['第1希望日時']),
    line('第2希望', a['第2希望日時']),
    line('第3希望', a['第3希望日時']),
    line('参加方法', a['参加方法']),
    '',
    '【相談したいこと】',
    a['相談したいこと'] || '（なし）',
    '',
    line('流入元', a['流入元']),
    line('受付日時', Utilities.formatDate(response.getTimestamp(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm')),
    sheetNote,
    '',
    '※ このメールに返信すると、学生本人あてに返信できます。'
  ].join('\n');
}
