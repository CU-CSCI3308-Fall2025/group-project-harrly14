require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const handlebars = require('express-handlebars');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const auth = require('./middleware/auth');

const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Validate SESSION_SECRET: require it in non-development environments
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Warning: SESSION_SECRET is not set. Using insecure fallback for development.');
    sessionSecret = 'dev_insecure_secret_' + Math.random().toString(36).slice(2);
  } else {
    throw new Error('SESSION_SECRET environment variable is required for secure sessions.');
  }
}

app.use(session({
  secret: sessionSecret,
  saveUninitialized: false,
  resave: false,
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', authRoutes);

// Welcome route for testing
app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

app.get('/', (req, res) => {
  res.render('pages/register');
});

// routes/auth handles registration
// app.post('/register', async (req, res) => {
//     try {
//       const hash = await bcrypt.hash(req.body.password, 10);
//       const username = req.body.username;
//       const email = req.body.email;
//       var query = `INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '${hash}')`;
      
//       await db.none(query)
//       res.json({status: 200, message: 'Success'});
//       res.redirect('/login');
    
//     } catch(err) {
//       console.log(err);

//       if (err.code === '23505') {
//         res.render('ProjectSourceCode\src\views\pages\register', { message: 'Username already exists. Please choose another one.' });
//       } else {
//         res.render('ProjectSourceCode\src\views\pages\register', { message: 'Error registering user. Please try again.' });
//       }
//     };
// });

app.use(auth);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = server;