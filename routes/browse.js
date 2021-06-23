// ====================事前準備処理=======================
// ライブラリインポート
const express = require("express");
const mysql = require("mysql");
const session = require("express-session");
const bcrypt = require("bcrypt");
const http = require("http");

// DBへの接続
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Pandaman@2600",
  database: "NextPD"
});

// DBに接続時のエラー処理
connection.connect(err => {
  if (err) {
    console.log("error connecting:" + err.stack);
    return;
  }
});

// ************browse******************

// ============browseログイン関連処理=======================
// ログイン画面の表示

module.exports = () => {
  const router = express.Router();
  router.use(express.static("public"));

  // リクエスト時に毎回処理する内容
  // セッション確立
  router.use(
    session({
      secret: "my_secret_key",
      resave: false,
      saveUninitialized: false
    })
  );

  //ログイン中にユーザ名を表示する処理
  router.use((req, res, next) => {
    if (req.session.userId === undefined) {
      res.locals.username = "ゲスト";
      res.locals.isLoggedIn = false;
    } else {
      res.locals.username = req.session.username;
      res.locals.email = req.session.email;
      res.locals.isLoggedIn = true;
      if (req.session.status === 1) {
        res.locals.status = "暇や";
      } else {
        res.locals.status = "暇やない";
      }
    }
    next();
  });

  router.get("/", (req, res) => {
    res.render("./browse/login.ejs");
  });
  // ログインリクエストをポストしたときの処理
  router.post("/", (req, res) => {
    const email = req.body.email;
    connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      (error, results) => {
        if (results.length > 0) {
          const plain = req.body.password;
          const hash = results[0].password;

          bcrypt.compare(plain, hash, (error, isEqual) => {
            if (isEqual) {
              req.session.userId = results[0].id;
              req.session.username = results[0].username;
              req.session.email = results[0].email;
              req.session.status = results[0].status;
              res.redirect(req.baseUrl + "/home");
            } else {
              console.log("false");
              res.redirect(req.baseUrl);
            }
          });
        } else {
          res.redirect(req.baseUrl);

          console.log("false2");
        }
      }
    );
  });

  // パスワードを忘れたら画面の表示
  router.get("/forgetpassword", (req, res) => {
    res.render("./browse/forgetpassword.ejs");
  });

  //ログアウト時の処理
  router.get("/logout", (req, res) => {
    const email = req.session.email;
    connection.query("UPDATE users SET status=0 WHERE email = ?", [email]);
    req.session.destroy(error => {
      res.redirect(req.baseUrl);
    });
  });

  // ============トップ画面以降の処理=======================
  //ログイン情報に応じたトップ画面の表示処理
  router.get("/home", (req, res) => {
    res.render("./browse/home.ejs");
  });

  router.get("/friends-list", (req, res) => {
    email = req.session.email;
    connection.query(
      "SELECT * FROM users WHERE email <> ?",
      [email],
      (error, results) => {
        res.render("./browse/friends-list.ejs", {
          friends: results
        });
      }
    );
  });

  // 友達の詳細表示
  router.get("/article/:id", (req, res) => {
    const id = req.params.id;
    connection.query(
      "SELECT * FROM articles WHERE id = ?",
      [id],
      (error, results) => {
        res.render("./browse/article.ejs", { article: results[0] });
      }
    );
  });

  // 自分のプロフィール表示
  router.get("/profile-main", (req, res) => {
    const email = req.session.email;
    connection.query(
      "SELECT status FROM users WHERE email = ?",
      [email],
      (error, results) => {
        if (results[0].status === 1) {
          res.locals.status = "暇や";
        } else {
          res.locals.status = "暇やない";
        }
        res.render("./browse/profile-main.ejs");
      }
    );
  });

  // ステータスチェンジボタン
  router.post("/change-status", (req, res) => {
    const email = req.session.email;
    connection.query(
      "SELECT status FROM users WHERE email = ?",
      [email],
      (error, results) => {
        if (results[0].status === 0) {
          connection.query("UPDATE users SET status=1 WHERE email = ?", [
            email
          ]);
        } else {
          connection.query("UPDATE users SET status=0 WHERE email = ?", [
            email
          ]);
        }
      }
    );
    res.redirect(req.baseUrl + "/profile-main");
  });

  // マッチング機能
  router.get("/matching-main", (req, res) => {
    email = req.session.email;
    connection.query(
      "SELECT * FROM users WHERE status=1 AND email <> ?",
      [email],
      (error, results) => {
        res.render("./browse/matching-main.ejs", {
          freeFriends: results
        });
      }
    );
  });

  router.post("/api/download", (req, res) => {
    let url = "https://";
  });

  return router;
};
