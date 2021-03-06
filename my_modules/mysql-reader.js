exports.findFreeFriends = () => {
  return (
  'SELECT username FROM users WEHRE status=1',
  (error, results) => {
    res.render('matching-main.ejs', { freeFriends: results[0] });
  }
  );
};