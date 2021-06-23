// ====================事前準備処理=======================
// ライブラリインポート
const express = require("express");
const mysql = require("mysql");
const session = require("express-session");
const bcrypt = require("bcrypt");
const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

// ポート3000番でローカルホストサーバ起動
app.listen(3000);


// ====================各ルーティング処理=======================


// todos = require("./routes/todos");
// app.use("/",todos());

app.use("/browse", require("./routes/browse.js")());
app.use("/admin", require("./routes/admin.js")());
app.use("/cs", require("./routes/cs.js")());