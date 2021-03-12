// ====================事前準備処理=======================
// ライブラリインポート
const express = require("express");
const mysql = require("mysql");
const session = require("express-session");
const bcrypt = require("bcrypt");

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
  console.log("success");
});

// ************cs******************

// ============csログイン関連処理=======================

module.exports = () => {
  const router = express.Router();
  // ログイン画面の表示
  router.get("/", (req, res) => {
    res.render("./components/cs/login.ejs");
  });

  // ログインリクエストをポストしたときの処理
  router.post("/", (req, res) => {
    const email = req.body.email;
    connection.query(
      "SELECT * FROM csusers WHERE email = ?",
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
    res.render("./components/cs/forgetpassword.ejs");
  });

  // 新規登録画面の表示
  router.get("/signup", (req, res) => {
    res.render("./components/cs/signup.ejs", { errors: [] });
  });

  // ポスト時の処理
  router.post(
    "/signup",
    // 入力値の空チェック
    (req, res, next) => {
      console.log("入力値の空チェック");
      const username = req.body.username;
      const email = req.body.email;
      const password = req.body.password;
      const errors = [];

      if (username === "") {
        errors.push("ユーザー名が空です");
      }

      if (email === "") {
        errors.push("メールアドレスが空です");
      }

      if (password === "") {
        errors.push("パスワードが空です");
      }

      if (errors.length > 0) {
        res.render("./components/cs/signup.ejs", { errors: errors });
      } else {
        next();
      }
    },
    // すでに登録してあるかチェック
    (req, res, next) => {
      console.log("メールアドレスの重複チェック");
      const email = req.body.email;
      const errors = [];
      connection.query(
        "SELECT * FROM csusers WHERE email = ?",
        [email],
        (error, results) => {
          if (results.length > 0) {
            errors.push("ユーザー登録に失敗しました");
            res.render("./components/cs/signup.ejs", { errors: errors });
          } else {
            next();
          }
        }
      );
    },
    // ユーザー登録処理
    (req, res) => {
      console.log("ユーザー登録");
      const username = req.body.username;
      const email = req.body.email;
      const password = req.body.password;
      const status = 0;
      bcrypt.hash(password, 10, (error, hash) => {
        connection.query(
          "INSERT INTO csusers (username, email, password, status) VALUES (?, ?, ?, ?)",
          [username, email, hash, status],
          (error, results) => {
            req.session.userId = results.insertId;
            req.session.username = username;
            req.session.email = email;
            res.redirect(req.baseUrl + "/home");
          }
        );
      });
    }
  );

  //ログアウト時の処理
  router.get("/logout", (req, res) => {
    const email = req.session.email;
    connection.query("UPDATE csusers SET status=0 WHERE email = ?", [email]);
    req.session.destroy(error => {
      res.redirect(req.baseUrl);
    });
  });

  // ============トップ画面以降の処理=======================
  //ログイン情報に応じたトップ画面の表示処理
  router.get("/home", (req, res) => {
    res.render("./components/cs/home.ejs");
  });

  // コーポレート登録処理
  router.post("/registerCorp", (req, res) => {
    const corporateType = req.body.corporateType;
    const corporateId = req.body.corporateId;
    const corporateName = req.body.corporateName;
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const status = 0;
    bcrypt.hash(password, 10, (error, hash) => {
      connection.query(
        "INSERT INTO users (username, email, password, status, corporateId) VALUES (?, ?, ?, ?, ?)",
        [username, email, hash, status, corporateId]
      );
      connection.query(
        "INSERT INTO corporate (corporateType, corporateId, corporateName, corporateAdmin) VALUES (?, ?, ?, ?)",
        [corporateType, corporateId, corporateName, email],
        (error, results) => {
          res.redirect(req.baseUrl + "/home");
        }
      );
    });
  });

  return router;
};
