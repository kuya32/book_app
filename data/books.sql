DROP TABLE IF EXISTS books;

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  image_url VARCHAR (255),
  title VARCHAR (255),
  author VARCHAR(255),
  isbn VARCHAR (255),
  bookshelf VARCHAR (255),
  description TEXT
);