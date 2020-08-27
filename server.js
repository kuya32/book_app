'use strict';

//Packages
require('dotenv').config();
const pg = require('pg');
const express = require('express');
const superagent = require('superagent');
const methodOverride = require('method-override');

//Global Vars
const app = express();
const PORT = process.env.PORT || 3001;
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(methodOverride('_method'));
app.use(express.urlencoded({extended: true}));

const client = new pg.Client(process.env.DATABASE_URL);
client.on ('error', console.error);

app.delete('/:id', deleteBook);
app.get('/', getAllBooks);
app.get('/books/:id', showSingleBook);
app.get('/searches/new', bookSearches);
app.put('/books/:id', updateBookData);
app.post('/books', saveNewBook);
app.post('/searches', sendBookData);

function deleteBook (req, res) {
  const id = req.params.id;
  const sql = 'DELETE FROM books WHERE id=$1';
  client.query(sql, [id])
    .then(() => {
      res.redirect('/');
    });
}

function getAllBooks (req, res) {
  //Where we have to make a client request for the database
  client.query('SELECT * FROM books')
    .then(result => {
      console.log(result);
      res.render('pages/index', {books: result.rows});
    })
    .catch(error => handleError(error, res));
}

function showSingleBook (req, res) {
  client.query('SELECT * FROM books WHERE id=$1;', [req.params.id])
    .then(result => {
      res.render('pages/books/detail', {books : result.rows[0]});
    });
}

function bookSearches (req, res) {
  res.render('pages/searches/new');
}

function updateBookData (req, res) {
  const id = req.params.id;
  const sql = `UPDATE books SET
                image_url=$1,
                title=$2,
                author=$3,
                isbn=$4,
                bookshelf=$5,
                description=$6 WHERE id=$7`;
  const values = [req.body.image_url, req.body.title, req.body.author, req.body.isbn, req.body.bookshelf, req.body.description, req.params.id];
  client.query(sql, values)
    .then((result) => {
      console.log(result);
      res.redirect(`/books/${id}`);
    })
    .catch(error => handleError(error, res));
}

function saveNewBook (req, res) {
  const {image_url, title, author, isbn, bookshelf, description} = req.body;

  const sql = `INSERT INTO books (image_url, title, author, isbn, bookshelf, description) VALUES($1, $2, $3, $4, $5, $6) RETURNING id`;
  const valueArray = [image_url, title, author, isbn, bookshelf, description];

  client.query(sql, valueArray)
    .then((dBResult) => {
      console.log(dBResult.rows);
      const newId = dBResult.rows[0].id;
      res.redirect(`/books/${newId}`);
    })
    .catch(error => handleError(error, res));
}

function sendBookData (req, res) {
  const title = req.body.title;
  const urlToSearch = `https://www.googleapis.com/books/v1/volumes?q=+intitle:${title}`;

  superagent.get(urlToSearch)
    .then(googleApiResults => {
      console.log(googleApiResults.body.items);
      const googleBookData = googleApiResults.body.items.map(data => new Book(data));
      console.log(googleBookData);
      res.render('pages/searches/show', {
        bookArrayKuya : googleBookData
      });
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
  this.isbn = vInfo.industryIdentifiers[1] ?
    vInfo.industryIdentifiers[1].identifier :
    '';
  this.bookshelf = vInfo.categories;
  this.description = vInfo.description;
  this.avg_rating = vInfo.averageRating;
  this.page_count = vInfo.pageCount;
  this.publisher = vInfo.publisher;
  this.published_date = vInfo.publishedDate;
}

client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`The server is running on PORT : ${PORT}!`));
  });
