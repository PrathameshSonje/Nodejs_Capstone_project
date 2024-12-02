const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { connectDB } = require("./db");
const { authenticate } = require("./jwt");
const { User, Book, BorrowerRecord, Return } = require("./models");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
connectDB();
app.use(express.json());

app.post("/register", async (req, res) => {
  try {
    const { name, username, password, email, mobile, admin } = req.body;

    if (!name || !username || !password || !email || !mobile) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newUser = await User.create({
      name,
      username,
      password,
      email,
      mobile,
      admin,
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, admin: user.admin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/books", async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/users", authenticate, async (req, res) => {
  try {
    if (!req.user.admin) {
      return res
        .status(403)
        .json({ error: "You must be an admin to update a book" });
    }
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/book", authenticate, async (req, res) => {
  try {
    const { name, author, genre, available } = req.body;

    if (!req.user.admin) {
      return res
        .status(403)
        .json({ error: "You must be an admin to create a book" });
    }

    if (!name || !author || !genre) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newBook = await Book.create({
      name,
      author,
      genre,
      available,
    });
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/borrow", authenticate, async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = await Book.findById(bookId);

    if (!book || !book.available) {
      return res.status(404).json({ message: "Book not available" });
    }

    await BorrowerRecord.create({
      username: req.user.username,
      bookid: book._id,
    });

    book.available = false;
    await book.save();

    res.status(200).json({ message: "Book borrowed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/return", authenticate, async (req, res) => {
  try {
    const { bookId, fine } = req.body;
    const { userId, username } = req.user;
    const borrowRecord = await BorrowerRecord.findOneAndDelete({
      bookid: bookId,
      username: req.user.username,
    });

    if (!borrowRecord) {
      return res
        .status(404)
        .json({ message: "No record of borrowed book found" });
    }

    const book = await Book.findById(bookId);
    if (book) {
      book.available = true;
      await book.save();
    }

    const returnRecord = await Return.create({
      username: username,
      bookid: bookId,
      fine: fine,
      duedate: book.duedate,
    });

    res
      .status(200)
      .json({ message: "Book returned successfully", returnRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/books/:id", authenticate, async (req, res) => {
  try {
    if (!req.user.admin) {
      return res
        .status(403)
        .json({ error: "You must be an admin to update a book" });
    }

    const { id } = req.params;
    const { name, author, genre, available } = req.body;

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    book.name = name || book.name;
    book.author = author || book.author;
    book.genre = genre || book.genre;
    book.available = available !== undefined ? available : book.available;

    await book.save();

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
