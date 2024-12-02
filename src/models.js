const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    username: { type: String, unique: true },
    password: { type: String },
    email: { type: String, unique: true },
    mobile: { type: Number, unique: true },
    admin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const bookSchema = new mongoose.Schema(
  {
    name: { type: String },
    author: { type: String },
    genre: { type: String },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const borrowSchema = new mongoose.Schema(
  {
    username: { type: String },
    bookid: {
      type: mongoose.Schema.Types.ObjectId,
      unique: true,
      ref: "Book",
    },
    duedate: {
      type: Date,
      default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      required: true,
    },
  },
  { timestamps: true }
);

const returnSchema = new mongoose.Schema(
  {
    username: { type: String },
    bookid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
    },
    duedate: { type: Date, ref: "BorrowerRecord" },
    fine: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Book = mongoose.model("Book", bookSchema);
const BorrowerRecord = mongoose.model("BorrowerRecord", borrowSchema);
const Return = mongoose.model("Return", returnSchema);

module.exports = {
  User,
  Book,
  BorrowerRecord,
  Return,
};
