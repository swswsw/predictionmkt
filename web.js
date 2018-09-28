let express = require('express');


//Peter: Express
const expressapp = express();
expressapp.set('view engine', 'pug');
expressapp.use(express.static(__dirname + '/public'));
expressapp.set('views', __dirname + '/public');
expressapp.engine('html', require('ejs').renderFile);
expressapp.set('view engine', 'html');

expressapp.get('/', (req, res) => {
  res.render('index.html');
});

expressapp.get('/login', (req, res) => {
  res.render('login.html');
});

expressapp.get('/market', (req, res) => {
  res.render('market.html');
});

expressapp.get('/create', (req, res) => {
  res.render('create.html');
});


expressapp.get('/profile', (req, res) => {
  res.render('profile.html');
});


expressapp.listen(80, () => {
  //console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});