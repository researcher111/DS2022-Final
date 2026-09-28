// Run with mongosh, not Node.js:
//   mongosh --nodb --file bookstore.mongosh.js
// Set MONGODB_URI in your shell first. The URI is never printed by this script.
// This creates only the lecture's demo records; it does not drop any database.
// Documentation: https://www.mongodb.com/docs/mongodb-shell/write-scripts/

if (!process.env.MONGODB_URI) {
  throw new Error("Set MONGODB_URI to your course MongoDB connection URI first.");
}
const connection = new Mongo(process.env.MONGODB_URI);
const bookstore = connection.getDB("ds2022_lecture06");
for (const name of ["authors", "books", "reviews"]) {
  if (bookstore.getCollection(name).countDocuments({}, {limit: 1}) !== 0) {
    throw new Error("Demo collections must be empty. Existing documents were left unchanged.");
  }
}

// Readable string IDs are deliberate. MongoDB also supports other _id types.
bookstore.authors.insertOne({
  _id: "author_001",
  name: "Jane Austen",
  bio: {short: "English novelist", country: "England"}
});
bookstore.books.insertMany([
  {_id: "book_001", title: "Pride and Prejudice", published_year: 1813,
    author_ids: ["author_001"], stock: 4},
  {_id: "book_002", title: "Emma", published_year: 1815,
    author_ids: ["author_001"], stock: 2}
]);
// Reviews are synthetic teaching data. book_id is an application-level reference.
bookstore.reviews.insertOne({
  _id: "review_001", book_id: "book_001", user: "Alice",
  rating: 5, comment: "I enjoyed the characters."
});

print("Created demo records in ds2022_lecture06.");
print("Books referencing author_001:");
printjson(bookstore.books.find({author_ids: "author_001"}).sort({_id: 1}).toArray());
// These inserts are separate operations, not one multi-document transaction.
// If an operation fails, inspect this demo database before rerunning.
