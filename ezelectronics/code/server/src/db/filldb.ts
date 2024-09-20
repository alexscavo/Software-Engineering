"use strict"

import { Category, Product } from "../components/product";
import db from "../db/db";

export function fillProductDB() {
    db.serialize(() => {
        const sql = `INSERT INTO products (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(sql, [999, 'iPhone 13', 'Smartphone', '2024-05-01', 'Latest iPhone model', 100]);
        db.run(sql, [799, 'Galaxy S21', 'Smartphone', '2024-04-15', 'Latest Samsung Galaxy model', 150]);
        db.run(sql, [1200, 'MacBook Pro', 'Laptop', '2024-05-10', 'Latest MacBook Pro model', 50]);
        db.run(sql, [900, 'Dell XPS', 'Laptop', '2024-05-05', 'Latest Dell XPS model', 75]);
        db.run(sql, [500, 'Samsung Refrigerator', 'Appliance', '2024-04-20', 'Latest Samsung Refrigerator model', 30]);
        db.run(sql, [400, 'LG Washing Machine', 'Appliance', '2024-04-25', 'Latest LG Washing Machine model', 40]);
        db.run(sql, [1100, 'Pixel 6', 'Smartphone', '2024-05-15', 'Latest Google Pixel model', 120]);
        db.run(sql, [1300, 'Lenovo ThinkPad', 'Laptop', '2024-05-12', 'Latest Lenovo ThinkPad model', 60]);
        db.run(sql, [600, 'Bosch Dishwasher', 'Appliance', '2024-04-28', 'Latest Bosch Dishwasher model', 35]);
        db.run(sql, [700, 'Sony TV', 'Appliance', '2024-04-30', 'Latest Sony TV model', 45]);
    });
}

export function fillReviewsDB() {
    db.serialize(() => {
        const sql = `INSERT INTO reviews (model, user, score, date, comment) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, ['iPhone 13', 'a', 5, '2024-05-02', 'Great product!']);
        db.run(sql, ['iPhone 13', 'b', 4, '2024-05-03', 'Good value for money.']);
        db.run(sql, ['Galaxy S21', 'c', 5, '2024-04-16', 'Excellent smartphone!']);
        db.run(sql, ['Galaxy S21', 'd', 4, '2024-04-17', 'Good performance.']);
        db.run(sql, ['MacBook Pro', 'e', 5, '2024-05-11', 'Best laptop on the market.']);
        db.run(sql, ['MacBook Pro', 'a', 4, '2024-05-12', 'Highly recommend.']);
        db.run(sql, ['Dell XPS', 'b', 4, '2024-05-06', 'Great laptop with good features.']);
        db.run(sql, ['Dell XPS', 'c', 5, '2024-05-07', 'Excellent performance.']);
        db.run(sql, ['Samsung Refrigerator', 'd', 4, '2024-04-21', 'Good quality refrigerator.']);
        db.run(sql, ['Samsung Refrigerator', 'e', 5, '2024-04-22', 'Keeps food fresh for longer.']);
        db.run(sql, ['LG Washing Machine', 'a', 5, '2024-04-26', 'Cleans clothes very well.']);
        db.run(sql, ['LG Washing Machine', 'b', 4, '2024-04-27', 'Easy to use.']);
        db.run(sql, ['Pixel 6', 'c', 5, '2024-05-16', 'Best camera on a smartphone.']);
        db.run(sql, ['Pixel 6', 'd', 4, '2024-05-17', 'Smooth performance.']);
        db.run(sql, ['Lenovo ThinkPad', 'e', 5, '2024-05-13', 'Great laptop for work.']);
        db.run(sql, ['Lenovo ThinkPad', 'a', 4, '2024-05-14', 'Good battery life.']);
        db.run(sql, ['Bosch Dishwasher', 'b', 4, '2024-04-29', 'Cleans dishes effectively.']);
        db.run(sql, ['Bosch Dishwasher', 'c', 5, '2024-04-30', 'Quiet and efficient.']);
        db.run(sql, ['Sony TV', 'd', 5, '2024-05-01', 'Great picture quality.']);
        db.run(sql, ['Sony TV', 'e', 4, '2024-05-02', 'Good sound system.']);
    });
}

export function fillCartsDB(): void {
    db.serialize(() => {
        const insertStmt = `INSERT INTO carts (customer, paid, paymentDate, total) VALUES (?, ?, ?, ?)`;

        db.run(insertStmt, ['cliente1', 1, '2024-05-22', 2199.00], function(err) {
            if (err) {
                return console.error(err.message);
            }
            const cartId1 = this.lastID;
            fillProductsInCart(cartId1, [
                {
                    model: 'iPhone 13', quantity: 1, category: Category.SMARTPHONE, sellingPrice: 999.00,
                    arrivalDate: "",
                    details: ""
                },
                {
                    model: 'MacBook Pro', quantity: 1, category: Category.LAPTOP, sellingPrice: 1200.00,
                    arrivalDate: "",
                    details: ""
                }
            ]);
        });

        db.run(insertStmt, ['cliente2', 1, '2024-05-23', 2100.00], function(err) {
            if (err) {
                return console.error(err.message);
            }
            const cartId2 = this.lastID;
            fillProductsInCart(cartId2, [
                {
                    model: 'Pixel 6', quantity: 1, category: Category.SMARTPHONE, sellingPrice: 1100.00,
                    arrivalDate: "",
                    details: ""
                },
                {
                    model: 'Dell XPS', quantity: 1, category: Category.LAPTOP, sellingPrice: 900.00,
                    arrivalDate: "",
                    details: ""
                },
                {
                    model: 'Sony TV', quantity: 1, category: Category.APPLIANCE, sellingPrice: 700.00,
                    arrivalDate: "",
                    details: ""
                }
            ]);
        });

        db.run(insertStmt, ['cliente3', 0, null, 1600.00], function(err) {
            if (err) {
                return console.error(err.message);
            }
            const cartId3 = this.lastID;
            fillProductsInCart(cartId3, [
                {
                    model: 'Galaxy S21', quantity: 1, category: Category.SMARTPHONE, sellingPrice: 799.00,
                    arrivalDate: "",
                    details: ""
                },
                {
                    model: 'LG Washing Machine', quantity: 1, category: Category.APPLIANCE, sellingPrice: 400.00,
                    arrivalDate: "",
                    details: ""
                },
                {
                    model: 'Bosch Dishwasher', quantity: 1, category: Category.APPLIANCE, sellingPrice: 600.00,
                    arrivalDate: "",
                    details: ""
                }
            ]);
        });
    });
}

function fillProductsInCart(cartId: number, products: Product[]): void {
    const insertStmt = `INSERT INTO products_in_cart (cartId, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)`;

    products.forEach(product => {
        db.run(insertStmt, [cartId, product.model, product.quantity, product.category, product.sellingPrice], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    });
}

export default {
    fillProductDB,
    fillReviewsDB,
    fillCartsDB
};
