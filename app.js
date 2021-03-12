// ====================事前準備処理=======================
// ライブラリインポート
const express = require("express");
const mysql = require("mysql");
const session = require("express-session");
const bcrypt = require("bcrypt");
const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

// ポート3000番でローカルホストサーバ起動
app.listen(3000);


// ====================各ルーティング処理=======================

//　ユーザ一般とCP管理者どっちの画面か選ぶ画面の表示
app.get("/", (req, res) => {
  res.render("./components/select-page-type.ejs");
});

app.use("/browse", require("./routes/browse.js")());
app.use("/admin", require("./routes/admin.js")());
app.use("/cs", require("./routes/cs.js")());