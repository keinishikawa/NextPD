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
});

// ============adminログイン関連処理=======================

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
    res.render("./admin/login.ejs");
  });

  // ログインリクエストをポストしたときの処理
  router.post("/", (req, res) => {
    const email = req.body.email;
    const corporateId = req.body.corporateId;
    connection.query(
      "SELECT * FROM users WHERE email = ? AND corporateId = ?",
      [email, corporateId],
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
              req.session.corporateId = results[0].corporateId;
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
    res.render("./admin/forgetpassword.ejs");
  });

  //ログアウト時の処理
  router.get("/logout", (req, res) => {
    const email = req.session.email;
    connection.query("UPDATE users SET status=0 WHERE email = ?", [email]);
    req.session.destroy(error => {
      res.redirect(req.baseUrl + "browse");
    });
  });

  // ============トップ画面以降の処理=======================
  //ログイン情報に応じたトップ画面の表示処理
  router.get("/home", (req, res) => {
    const corporateId = req.session.corporateId;
    connection.query(
      "SELECT * from users WHERE corporateId=?",
      [corporateId],
      (error, results) => {
        res.render("./admin/home.ejs", { corporateUsers: results });
      }
    );
  });

  // 新規登録画面の表示
  router.get("/signup", (req, res) => {
    res.render("./admin/signup.ejs", { errors: [] });
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
        res.render("./admin/signup.ejs", { errors: errors });
      } else {
        next();
      }
    },
    // すでに登録してあるかチェック
    (req, res, next) => {
      console.log("メールアドレスの重複チェック");
      const email = req.body.email;
      const corporateId = req.session.corporateId;
      const errors = [];
      connection.query(
        "SELECT * FROM users WHERE email = ? AND corporateId = ?",
        [email, corporateId],
        (error, results) => {
          if (results.length > 0) {
            errors.push("ユーザー登録に失敗しました");
            res.render("./admin/signup.ejs", { errors: errors });
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
      const corporateId = req.session.corporateId;
      bcrypt.hash(password, 10, (error, hash) => {
        connection.query(
          "INSERT INTO users (username, email, password, status, corporateId) VALUES (?, ?, ?, ?, ?)",
          [username, email, hash, status, corporateId],
          (error, results) => {
            res.redirect(req.baseUrl + "/home");
          }
        );
      });
    }
  );

  // router.get("/friends-list",(req,res)=>{
  //   email = req.session.email;
  //   connection.query(
  //     'SELECT * FROM users WHERE email <> ?',
  //     [email],
  //     (error, results) => {
  //       res.render('friends-list.ejs', { friends: results });
  //     }
  //   );
  // });

  // // 友達の詳細表示
  // router.get('/article/:id', (req, res) => {
  //   const id = req.params.id;
  //   connection.query(
  //     'SELECT * FROM articles WHERE id = ?',
  //     [id],
  //     (error, results) => {
  //       res.render('article.ejs', { article: results[0] });
  //     }
  //   );
  // });

  // // 自分のプロフィール表示
  // router.get("/profile-main",(req,res)=>{
  //   const email = req.session.email;
  //   connection.query(
  //     'SELECT status FROM users WHERE email = ?',
  //     [email],
  //     (error, results) => {
  //       if(results[0].status===1){
  //         res.locals.status = "暇や";
  //       }else{
  //         res.locals.status = "暇やない";
  //       }
  //       res.render('profile-main.ejs');
  //     });
  // });

  // // ステータスチェンジボタン
  // router.post('/change-status', (req, res) => {
  //   const email = req.session.email;
  //   connection.query(
  //     'SELECT status FROM users WHERE email = ?',
  //     [email],
  //     (error, results) => {
  //       if(results[0].status===0){
  //         connection.query(
  //           "UPDATE users SET status=1 WHERE email = ?",
  //           [email]
  //         );
  //       }else{
  //         connection.query(
  //           "UPDATE users SET status=0 WHERE email = ?",
  //           [email]
  //         );
  //       }
  //     }
  //   );
  //   res.redirect(req.baseUrl + "/profile-main");
  // });

  // // マッチング機能
  // router.get("/matching-main",(req,res)=>{
  // email = req.session.email;
  // connection.query(
  //   'SELECT * FROM users WHERE status=1 AND email <> ?',
  //   [email],
  //   (error, results) => {
  //     res.render('matching-main.ejs', { freeFriends : results });
  //   }
  // );
  // })

  return router;
};
