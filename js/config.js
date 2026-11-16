/*
 * 設定（Googleフォームの送信先など）
 * ─────────────────────────────────────────
 * Googleフォームを作ったら、README.md の手順で
 * formAction と entry の番号をここに書き入れてください。
 * formAction が空のあいだは「テストモード」になり、送信しても実際には届きません。
 */
window.SB_CONFIG = {
  // 例: "https://docs.google.com/forms/d/e/1FAIpQLS.../formResponse"
  formAction: "",

  // Googleフォームの各質問の番号（entry.123456789 の数字の部分）
  entry: {
    name: "",      // 氏名
    kana: "",      // ふりがな
    email: "",     // メールアドレス
    tel: "",       // 電話番号
    school: "",    // 学校名
    grad: "",      // 卒業予定年
    wish1: "",     // 第1希望日時
    wish2: "",     // 第2希望日時
    wish3: "",     // 第3希望日時
    method: "",    // 参加方法
    message: "",   // 相談したいこと
    type: "",      // 診断タイプ（自動）
    stage: "",     // 就活の進み具合 Q4（自動）
    style: "",     // 話し方の希望 Q5（自動）
    from: ""       // どこから来たか（自動）
  },

  privacyUrl: "https://www.staff-b.com/privacy_reg/",
  replyDays: 2   // 「〇営業日以内にご連絡します」の日数
};
