// ====================事前準備処理=======================
// ライブラリインポート
const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

// ポート3000番でローカルホストサーバ起動
app.listen(3000);

// ====================共通処理=======================

// リクエスト時に毎回処理する内容
  // セッション確立
app.use(
    session({
      secret: 'my_secret_key',
      resave: false,
      saveUninitialized: false,
    })
  );

  //ログイン中にユーザ名を表示する処理
  app.use((req, res, next) => {
    if (req.session.userId === undefined) {
      res.locals.username = 'ゲスト';
      res.locals.isLoggedIn = false;
    } else {
      res.locals.username = req.session.username;
      res.locals.email = req.session.email;
      res.locals.isLoggedIn = true;
      if(req.session.status===1){
        res.locals.status = "暇や";  
      }else{
        res.locals.status = "暇やない";
      }
    }
    next();
  });

// ====================各ルーティング処理=======================

//　ユーザ一般とCP管理者どっちの画面か選ぶ画面の表示
app.get("/", (req,res)=>{
  res.render("./components/select-page-type.ejs");
})

app.use("/browse",require("./routes/browse.js")());
app.use("/admin",require("./routes/admin.js")());
app.use("/cs",require("./routes/cs.js")());