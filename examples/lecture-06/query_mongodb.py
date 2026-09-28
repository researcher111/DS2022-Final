"""Read books by an author from the lecture's MongoDB demo database.

Install: uv pip install pymongo
Setup: run bookstore.mongosh.js once against empty demo collections.
Run: python query_mongodb.py --author author_001
Reads MONGODB_URI from the environment; never writes to the database.
Source: https://www.mongodb.com/docs/languages/python/pymongo-driver/current/get-started/
"""
import argparse
import json
import os
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--author", default="author_001", help="Exact author ID")
    args = parser.parse_args()
    uri = os.environ.get("MONGODB_URI")
    if not uri:
        parser.error("Set MONGODB_URI to your course connection URI first.")
    try:
        from pymongo import MongoClient
        from pymongo.errors import PyMongoError
    except ImportError:
        parser.error("Install the driver in this environment: uv pip install pymongo")

    try:
        with MongoClient(uri, serverSelectionTimeoutMS=5000) as client:
            client.admin.command("ping")
            books = client["ds2022_lecture06"]["books"]
            # Equality on an array field matches documents containing this value.
            query = {"author_ids": args.author}
            fields = {"_id": 1, "title": 1, "published_year": 1}
            results = list(books.find(query, fields).sort("_id", 1).limit(20))
            print(json.dumps(results, indent=2, ensure_ascii=False, default=str))
            if not results:
                print("No matching books. Check the author ID and demo setup.", file=sys.stderr)
    except PyMongoError as error:
        # Exception messages can include connection details; show only the type.
        print(f"MongoDB request failed ({type(error).__name__}). "
              "Check the URI, database user, and network access.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
