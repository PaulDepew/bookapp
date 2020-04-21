'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const superagent = require('superagent');

app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));

app.set('view engine', 'ejs');


app.get('/', renderHome);
app.get('/searches/new', renderNewSearch);


app.post('/searches', callAPI);

app.listen(process.env.PORT || 3000, (request, response) => {
  console.log('app is up on port: ' + process.env.PORT);
});

function handleError (error, request, response) {
  response.status(500).send(error);
}

function renderHome(request, response){
  response.render('pages/index');
}

function renderNewSearch(request, response){
  response.render('searches/new');
}
function callAPI(request, response){
  let query = request.body.query;
  let searchTerm = request.body.filter;
  // Take Search Query Parameters
  const url = `https://www.googleapis.com/books/v1/volumes?q=+${searchTerm}:${query}`;
  // Query Book API
  superagent.get(url).then(response => {
    console.log(response.body);
    const data =response.body.items;
    // Construct Book
    data.map( element => {
      return new Book(element);
    }).then(response.render('/searches/show'));
  }).catch(error => handleError('API Search error', request, response));
}

function Book(element) {
  this.title = element.volumeInfo.title;
  // this.author = element.volumeInfo.authors;
  // this.description = element.voluemInfo.description;
  // this.image = element.volumeInfo.imagelinks.thumbnail;
}
