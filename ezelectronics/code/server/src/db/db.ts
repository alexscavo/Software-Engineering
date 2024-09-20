"use strict"

/**
 * Example of a database connection if using SQLite3.
 */

import { Database } from "sqlite3";

const sqlite = require("sqlite3")

// The environment variable is used to determine which database to use.
// If the environment variable is not set, the development database is used.
// A separate database needs to be used for testing to avoid corrupting the development database and ensuring a clean state for each test.

//The environment variable is set in the package.json file in the test script.
let env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "development"

// The database file path is determined based on the environment variable.
const dbFilePath = env === "test" ? "./src/db/testdb.db" : "./src/db/db.db"

// The database is created and the foreign keys are enabled.
const db: Database = new sqlite.Database(dbFilePath, (err: Error | null) => {
    if (err) throw err
    db.run("PRAGMA foreign_keys = ON")
})

db.serialize(() => {

    db.run(`CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY NOT NULL UNIQUE,
            name TEXT NOT NULL,
            surname TEXT NOT NULL,
            role TEXT NOT NULL,
            password TEXT,
            salt TEXT,
            address TEXT,
            birthdate TEXT
        )`, (err) => {
        if (err) {
            return console.error(err.message);
        }
        //console.log('Users table created.');
    });
    
    db.run(`CREATE TABLE IF NOT EXISTS products (
            model TEXT PRIMARY KEY,
            sellingPrice REAL NOT NULL,
            category TEXT NOT NULL,
            arrivalDate TEXT,
            details TEXT,
            quantity INTEGER NOT NULL
            )`, (err) => {
        if (err) {
            return console.error(err.message);
        }
        //console.log('Products table created.');
    });

    db.run(`CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer TEXT NOT NULL,
        paid BOOLEAN NOT NULL DEFAULT 0,
        paymentDate TEXT DEFAULT NULL,
        total REAL NOT NULL DEFAULT 0,
        FOREIGN KEY (customer) REFERENCES users (username) ON DELETE CASCADE
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS products_in_cart (
        cartId INTEGER NOT NULL,
        model TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        PRIMARY KEY (cartId, model),
        FOREIGN KEY (cartId) REFERENCES carts(id) ON DELETE CASCADE,
        FOREIGN KEY (model) REFERENCES products(model) ON DELETE CASCADE
        )`,(err) => {
        if (err) {
          return console.error(err.message);
        }
        //console.log('Reviews table created.');
    });

    db.run(`CREATE TABLE IF NOT EXISTS reviews(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT NOT NULL,
        user TEXT NOT NULL,
        score INTEGER NOT NULL,
        date TEXT NOT NULL,
        comment TEXT,
        FOREIGN KEY (model) REFERENCES products(model) ON DELETE CASCADE,
        FOREIGN KEY (user) REFERENCES users(username) ON DELETE CASCADE
      )`, (err) => {
        if (err) {
          return console.error(err.message);
        }
        //console.log('Reviews table created.');
    });

});





export default db;
