require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', authRoutes);

app.use(auth);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});