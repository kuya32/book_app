'use strict';

//Packages
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const { response } = require('express');

//Global Vars
const app = express();
const PORT = process.env.PORT || 3001;
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));

const client = new pg.Client(process.env.DATABASE_URL);
client.on ('error', console.error);


app.get('/', getAllBooks);
app.get('/searches/new', bookSearches);
app.post('/searches', sendBookData);
app.get('/books/:id', showSingleBook);
app.post('/books', pickNewBook);

function getAllBooks (req, res) {
  //Where we have to make a client request for the database
  client.query('SELECT * FROM books')
    .then(result => {
      console.log(result);
      res.render('pages/index', {books: result.rows});
    })
    .catch(error => handleError(error, res));
}

function bookSearches (req, res) {
  res.render('pages/searches/new');
}

function sendBookData (req, res) {
  const title = req.body.title;
  const urlToSearch = `https://www.googleapis.com/books/v1/volumes?q=+intitle:${title}`;

  superagent.get(urlToSearch)
    .then(googleApiResults => {
      const googleBookData = googleApiResults.body.items.map(data => new Book(data));
      console.log(googleBookData);
      res.render('pages/searches/show', {
        bookArrayKuya : googleBookData
      });
    })
    .catch(error => handleError(error, res));
}

function showSingleBook (req, res) {
  client.query('SELECT * FROM books WHERE id=$1;', [req.params.id])
    .then(result => {
      res.render('pages/books/detail', {books : result.rows[0]});
    });
}

function pickNewBook (req, res) {
  const {author, title, isbn, image_url, description} = JSON.parse(req.body.bookList);
  console.log(req.body.bookList);

  const sql = `INSERT INTO books (author, title, isbn, image_url, description) VALUES($1, $2, $3, $4, $5)`;
  const valueArray = [author, title, isbn, image_url, description];

  client.query(sql, valueArray)
    .then(() => {
      res.redirect('/');
    })
    .catch(error => handleError(error, res));
}

function handleError(error, res){
  console.error(error);
  res.render('pages/error', {error});
}

function Book (googleBookData) {
  const vInfo = googleBookData.volumeInfo;
  let img_url = vInfo.imageLinks && vInfo.imageLinks.thumbnail ?
    vInfo.imageLinks.thumbnail :
    'https://i.imgur.com/J5LVHEL.jpg';
  img_url = img_url.replace(/^http:\/\//i, 'https://');
  this.image_url = img_url;
  this.title = vInfo.title;
  this.author = vInfo.authors;
  this.publisher = vInfo.publisher;
  this.published_date = vInfo.publishedDate;
  this.description = vInfo.description;
  this.isbn = vInfo.industryIdentifiers[1] ?
    vInfo.industryIdentifiers[1].identifier :
    '';
  this.page_count = vInfo.pageCount;
  this.genre = vInfo.categories;
  this.avg_rating = vInfo.averageRating;
}

client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`The server is running on PORT : ${PORT}!`));
  });
