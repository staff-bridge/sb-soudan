/*
 * 設定（Googleフォームの送信先など）
 * ─────────────────────────────────────────
 * Googleフォームを作ったら、README.md の手順で
 * formAction と entry の番号をここに書き入れてください。
 * formAction が空のあいだは「テストモード」になり、送信しても実際には届きません。
 */
window.SB_CONFIG = {
  // 例: "https://docs.google.com/forms/d/e/1FAIpQLS.../formResponse"
  formAction: "https://docs.google.com/forms/d/e/1FAIpQLSfXUflPfJT7dpaBsmrJRoqY5FK93_i5AV8C_ilJgUZG5QlKZg/formResponse",

  // Googleフォームの各質問の番号（entry.123456789 の数字の部分）
  entry: {
    name: "847739004",      // 氏名
    kana: "978230938",      // ふりがな
    email: "1131106018",    // メールアドレス
    tel: "1946801187",      // 電話番号
    school: "161910763",    // 学校名
    grad: "1916524841",     // 卒業予定年
    wish1: "549340621",     // 第1希望日時
    wish2: "193953656",     // 第2希望日時
    wish3: "2040285757",    // 第3希望日時
    method: "133592403",    // 参加方法
    message: "770006932",   // 相談したいこと
    type: "1007723345",     // 診断タイプ（自動）
    stage: "1381540879",    // 就活の進み具合 Q4（自動）
    style: "475939776",     // 話し方の希望 Q5（自動）
    from: "1427566714"      // どこから来たか（自動）
  },

  // Googleアナリティクス（GA4）の測定ID。空にすると計測しない
  gaId: "G-C0NHPCZW0E",

  privacyUrl: "https://www.staff-b.com/privacy_reg/",
  replyDays: 2   // 「〇営業日以内にご連絡します」の日数
};
