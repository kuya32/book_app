'use strict';

//Packages
const express = require('express');
require('dotenv').config();
const superagent = require('superagent');

//Global Vars
const app = express();
const PORT = process.env.PORT || 3001;

//Express Configs
app.set('view engine', 'ejs');

app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));

app.get('/hello', (req, res) => {
  res.render('pages/index');
});

app.get('/searches/new', (req, res) => {
  res.render('pages/searches/new');
});

app.post('/searches', sendBookData);

function sendBookData (req, res) {
  const title = req.body.title;
  const urlToSearch = `https://www.googleapis.com/books/v1/volumes?q=+intitle:${title}`;

  superagent.get(urlToSearch)

    .then(resultsFromGoogleBooks => {
      const googleBookData = resultsFromGoogleBooks.body.items;
      let bookArray = googleBookData.map(objInJson => {
        const newBook = new Book(objInJson);
        return newBook;
      });
      res.send(bookArray);
    });
}

function Book (googleBookData) {
  let img_url = googleBookData.volumeInfo.imageLinks.thumbnail || 'https://i.imgur.com/J5LVHEL.jpg'
  img_url = img_url.replace(/^http:\/\//i, 'https://');
  this.img_url = img_url;
  this.title = googleBookData.volumeInfo.title;
  this.author = googleBookData.volumeInfo.authors;
  this.publisher = googleBookData.volumeInfo.publisher;
  this.published_date = googleBookData.volumeInfo.publishedDate;
  this.desc = googleBookData.volumeInfo.description;
  this.isbn = googleBookData.volumeInfo.industryIdentifiers[1].identifier;
  this.page_count = googleBookData.volumeInfo.pageCount;
  this.genre = googleBookData.volumeInfo.categories;
  this.avg_rating = googleBookData.volumeInfo.averageRating;
}

app.listen(PORT, () => console.log(`The server is running on PORT : ${PORT}!`));
