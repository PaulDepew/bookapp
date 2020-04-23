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

app.post('/books', (request, response)=> {
  const {title, author, description, image_url, isbn, bookshelf} = request.body;

  let insertSql = `INSERT INTO books (author, title, isbn, image_url, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6);`;
  let sequelValues = [author, title, isbn, image_url, description, bookshelf];

  dbClient.query(insertSql, sequelValues)
    .then(data => {
      console.log(data.rows);
      response.render('pages/index', {queryResults: data});
    })
    .catch(error => handleError(error, request, response));

  response.send({title, author, description, image_url, isbn, bookshelf});
});

app.get('/books/:id', (request, response) => {
  console.log(request);
  const bookId = parseInt(request.params.id);
  let selectQuery = `SELECT * FROM books WHERE id =$1;`;
  let selectValues = [bookId];

  dbClient.query(selectQuery, selectValues)
    .then( data => {
      console.log(data.rows);
      // response.send('in Progress');
      response.render('pages/details', {queryResults: data.rows[0]});
    })
    .catch(error => handleError(error, request, response));

});

app.listen(process.env.PORT || 3000, (request, response) => {
  console.log('app is up on port: ' + process.env.PORT);
});


function handleError (error, request, response) {
  console.log('This is another error');
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

