'use strict';

require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));

app.set('view engine', 'ejs');


app.get ('/', renderHome);

app.listen(process.env.PORT || 3000, (request, response) => {
  console.log('app is up on port: ' + process.env.PORT);
});

function renderHome(request, response){
  response.render('pages/index');
};