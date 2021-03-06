// ====================事前準備処理=======================
// ライブラリインポート
const express = require('express');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();

// 自作モジュール
// const mysqlReader = require("./my_modules/mysql-reader.js");


app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

// mysqlへの接続
const connection = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"Pandaman@2600",
    database:"NextPD"
});

// mysqlに接続時のエラー処理
connection.connect((err)=>{
    if(err){
        console.log("error connecting:"+err.stack);
        return;
    }
    console.log("success");
})


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



// ============ログイン関連処理=======================
  app.get("/", (req,res)=>{
    res.render("login.ejs");
  })

  // ログイン画面の表示
  app.get('/login', (req, res) => {
    res.render('login.ejs');
  });
  
  // ログインリクエストをポストしたときの処理
  app.post('/login', (req, res) => {
    const email = req.body.email;
    connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if (results.length > 0) {
          const plain = req.body.password;
          const hash = results[0].password;

          bcrypt.compare(plain, hash,(error, isEqual) => {
            if(isEqual){
              req.session.userId = results[0].id;
              req.session.username = results[0].username;
              req.session.email = results[0].email;
              req.session.status = results[0].status;
              res.redirect('/top');
            } else {
              console.log("false");
              res.redirect('/login');
            }
          });
      
        } else {
          res.redirect('/login');

          console.log("false2");
        }
      }
    );
  });



// パスワードを忘れたら画面の表示
  app.get("/forgetpassword",(req,res)=>{
    res.render('forgetpassword.ejs');
  });
  
// 新規登録画面の表示
  app.get('/signup', (req, res) => {
    res.render('signup.ejs', { errors: [] });
  });

  // ポスト時の処理
  app.post('/signup', 
    // 入力値の空チェック
    (req, res, next) => {
      console.log('入力値の空チェック');
      const username = req.body.username;
      const email = req.body.email;
      const password = req.body.password;
      const errors = [];
  
      if (username === '') {
        errors.push('ユーザー名が空です');
      }
  
      if (email === '') {
        errors.push('メールアドレスが空です');
      }
  
      if (password === '') {
        errors.push('パスワードが空です');
      }
  
      if (errors.length > 0) {
        res.render('signup.ejs', { errors: errors });
      } else {
        next();
      }
    },
    // すでに登録してあるかチェック
    (req, res, next) => {
      console.log('メールアドレスの重複チェック');
      const email = req.body.email;
      const errors = [];
      connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (error, results) => {
          if (results.length > 0) {
            errors.push('ユーザー登録に失敗しました');
            res.render('signup.ejs', { errors: errors });
          } else {
            next();
          }
        }
      );
    },
    // ユーザー登録処理
    (req, res) => {
      console.log('ユーザー登録');
      const username = req.body.username;
      const email = req.body.email;
      const password = req.body.password;
      const status = 0;
      bcrypt.hash(password, 10, (error, hash) => {
        connection.query(
          'INSERT INTO users (username, email, password, status) VALUES (?, ?, ?, ?)',
          [username, email, hash, status],
          (error, results) => {
            req.session.userId = results.insertId;
            req.session.username = username;
            req.session.email = email;
            res.redirect('/top');
          }
        );
      });
    }
  );
  


//ログアウト時の処理
  app.get('/logout', (req, res) => {
    const email = req.session.email;
    connection.query(
      "UPDATE users SET status=0 WHERE email = ?",
      [email]
      );
    req.session.destroy(error => {
      res.redirect('/login');
    });
  });
  


// ============トップ画面以降の処理=======================
  //ログイン情報に応じたトップ画面の表示処理
  app.get('/top', (req, res) => {
    res.render('top.ejs');
  });


  app.get("/friends-list",(req,res)=>{
    email = req.session.email;
    connection.query(
      'SELECT * FROM users WHERE email <> ?',
      [email],
      (error, results) => {
        res.render('friends-list.ejs', { friends: results });
      }
    );
  });


  // 友達の詳細表示
  app.get('/article/:id', (req, res) => {
    const id = req.params.id;
    connection.query(
      'SELECT * FROM articles WHERE id = ?',
      [id],
      (error, results) => {
        res.render('article.ejs', { article: results[0] });
      }
    );
  });




// 自分のプロフィール表示
  app.get("/profile-main",(req,res)=>{
    const email = req.session.email;
    connection.query(
      'SELECT status FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if(results[0].status===1){
          res.locals.status = "暇や";  
        }else{
          res.locals.status = "暇やない";
        }
        res.render('profile-main.ejs');
      });
  });


  // ステータスチェンジボタン
  app.post('/change-status', (req, res) => {
    const email = req.session.email;
    connection.query(
      'SELECT status FROM users WHERE email = ?',
      [email],
      (error, results) => {
        if(results[0].status===0){
          connection.query(
            "UPDATE users SET status=1 WHERE email = ?",
            [email]
          );
        }else{
          connection.query(
            "UPDATE users SET status=0 WHERE email = ?",
            [email]
          );
        }
      }
    );
    res.redirect("/profile-main");
  });



// マッチング機能
app.get("/matching-main",(req,res)=>{
  email = req.session.email;
  connection.query(
    'SELECT * FROM users WHERE status=1 AND email <> ?',
    [email],
    (error, results) => {
      res.render('matching-main.ejs', { freeFriends : results });
    }
  );
})




  