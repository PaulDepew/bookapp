'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const superagent = require('superagent');
const pg = require('pg');

app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));
const dbClient = new pg.Client(process.env.DATABASE_URL);
dbClient.connect(error => {
  if (error) {
    console.error('This was an Error', error.stack);
  } else {
    console.log('Were connected');
  }
});

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
  let matchSQL = "SELECT * FROM books";

  dbClient.query(matchSQL).then(queryResults => {
    if (queryResults.rowcount === 0) {
      response.render('searches/new');
    } else {
      response.render('pages/index', {queryResults});
    }
  }).catch(error => handleError('Database Error', request, response));
}

function renderNewSearch(request, response){
  response.render('searches/new');
}

// call dbClient to bring back all SQL results
// like calling API
// convert array into constructed books
// display on ejs partial

function callAPI(request, response){
  let query = request.body.query;
  let searchTerm = request.body.filter;
  // Take Search Query Parameters
  const url = `https://www.googleapis.com/books/v1/volumes?q=+${searchTerm}:${query}`;
  // Query Book API
  superagent.get(url)
    .then(response => {
      const data = response.body.items;
      return data.map( element => new Book(element))})
    .then(results => {
      response.render('./searches/show', { results })})
    .catch(error => handleError('this is bad', request, response));
}

function Book(element) {
  this.title = element.volumeInfo.title ? element.volumeInfo.title : 'No Title Found.';
  this.author = element.volumeInfo.authors ? element.volumeInfo.authors[0] : 'No Author Found.';
  this.description = element.volumeInfo.description ? element.volumeInfo.description : 'No Description Found.';
  this.image_url = element.volumeInfo.imageLinks ? element.volumeInfo.imageLinks.thumbnail : 'No Image Found.';
  this.isbn = element.volumeInfo.industryIdentifiers ? element.volumeInfo.industryIdentifiers[0].type : 'No ISBN Found.';
  this.id = element.volumeInfo.industryIdentifiers ? element.volumeInfo.industryIdentifiers[0].identifier : 'No ID Found.';
}

