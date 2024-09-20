"use strict"

import db from "../db/db";

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */
export const cleanup = async () => {
    await new Promise<void>((resolve) => {
        db.serialize(() => {
            // Delete all data from the database.
            db.run("DELETE FROM users")

            db.run("DELETE FROM products")

            db.run("DELETE FROM reviews");

            db.run("DELETE FROM products_in_cart");

            db.run("DELETE FROM carts");

        })
        return resolve()
    });
};

