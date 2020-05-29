const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var logger = require('morgan');
const helmet = require('helmet');

// Import API endpoint routes
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/email');

const app = express();

// Connect to the database before starting the application server.
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plataforma', {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log('Database connection ready!');
  })
  .catch(() => {
    console.log('Database Connection failed!');
    process.exit(1);
  });
mongoose.set('useCreateIndex', true);

// app.use(logger('dev'));
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', express.static(path.join(__dirname, 'angular')));
// For all GET requests, send back index.html
// so that PathLocationStrategy can be used
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, '/angular/index.html'));
});

// API endpoint routes
app.use('/api/auth', authRoutes);
app.use('/api/sendmail', emailRoutes);

module.exports = app;
