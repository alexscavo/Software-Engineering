import { describe, test, expect, beforeEach, afterEach, afterAll, beforeAll } from "@jest/globals";
import UserDAO from "../../src/dao/userDAO";
import ReviewDAO from "../../src/dao/reviewDAO";
import { Category, Product } from "../../src/components/product"
import db from "../../src/db/db";
import { UserAlreadyExistsError } from "../../src/errors/userError";
import crypto from "crypto";
import { ProductReview } from "../../src/components/review";
import { User, Role } from "../../src/components/user";
const sqlInsertProducts = "INSERT INTO products (model, sellingPrice, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)";
const sqlInsertUser = "INSERT INTO users (username, name, surname, password, salt, role, address, birthDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
const sqlInsertRewie = "INSERT INTO reviews (model,user,score,date,comment) VALUES (?, ?, ?, ?, ?)";
//const sqlGetUserProductReview = "SELECT * FROM reviews WHERE model = ? AND user = ?"
//const sqlGetProductReview = "SELECT * FROM reviews WHERE model = ?"


const insertManager = (username: string) => {
    const salt = crypto.randomBytes(16);
    const hashedPassword = crypto.scryptSync('pw', salt, 16);
    db.run(sqlInsertUser, [username, "Test", "User", hashedPassword, salt, "Manager", "123 Main St", "1990-01-01"]);
}
const InserCustomer = (username: string) => {
    const salt = crypto.randomBytes(16);
    const hashedPassword = crypto.scryptSync('pw', salt, 16);
    db.run(sqlInsertUser, [username, "Test", "User", hashedPassword, salt, "Customer", "123 Main St", "1990-01-01"]);
}

describe("UserDAO integration test with Real Database", () => {
    let reviewDAO: ReviewDAO;

    beforeAll(() => {
        db.serialize(() => {
            db.run("CREATE TABLE IF NOT EXISTS products(model TEXT PRIMARY KEY,sellingPrice REAL NOT NULL,category TEXT NOT NULL, arrivalDate TEXT,details TEXT,quantity INTEGER NOT NULL)");
            db.run("CREATE TABLE IF NOT EXISTS reviews(id INTEGER PRIMARY KEY AUTOINCREMENT, model TEXT NOT NULL,user TEXT NOT NULL, score INTEGER NOT NULL,date TEXT NOT NULL,comment TEXT,FOREIGN KEY (model) REFERENCES products(model) ON DELETE CASCADE,FOREIGN KEY (user) REFERENCES users(username) ON DELETE CASCADE)")
            db.run("CREATE TABLE IF NOT EXISTS users(username TEXT PRIMARY KEY NOT NULL UNIQUE,name TEXT NOT NULL,surname TEXT NOT NULL,role TEXT NOT NULL,password TEXT,salt TEXT,address TEXT,birthdate TEXT)")
        })
    })


    beforeEach((done) => {
        // Create the users table before each test
        db.serialize(() => {
            db.run("DELETE FROM reviews", done);
            db.run("DELETE FROM products", done);
            db.run("DELETE FROM users", done);
        });
        reviewDAO = new ReviewDAO();
    },20000);

    afterEach((done) => {
        // Drop the users table after each test
        db.serialize(() => {
            db.run("DELETE FROM reviews", done);
            db.run("DELETE FROM products", done);
            db.run("DELETE FROM users", done);
        });
    },20000);

    describe("addProductReview", () => {
        test("It should return 1 review", async () => {
            const testCustomer = new User('customer', 'nome', 'cognome', Role.CUSTOMER, '', '')
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 1);
            const testReview = new ProductReview(testProduct.model, testCustomer.username, 5, '', '')
            db.serialize(() => {
                InserCustomer("customer");
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
            })
            await reviewDAO.addProductReview(testReview)

            db.all("SELECT * FROM reviews", [], (err, rows) => {
                if (err) {
                    expect(true).toBe(false)
                    return
                }

                expect(rows).toHaveLength(1)
            })
        })

        test("It should return 2 reviews", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 1);
            const testReview = new ProductReview(testProduct.model, 'customer', 5, '', '')
            const testReview1 = new ProductReview(testProduct.model, 'customer1', 5, '', '')
            db.serialize(() => {
                InserCustomer("customer");
                InserCustomer("customer1");
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
            })
            await reviewDAO.addProductReview(testReview)
            await reviewDAO.addProductReview(testReview1)


            db.all("SELECT * FROM reviews", [], (err, rows) => {
                if (err) {
                    expect(true).toBe(false)
                    return
                }

                expect(rows).toHaveLength(2)
            })
        })


    })

    describe("deleteUserProductReview", () => {
        test("It should remove the review of the user for that product", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 1);
            const testReview = new ProductReview(testProduct.model, 'customer', 5, '', '')
            db.serialize(() => {
                InserCustomer("customer");
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertRewie,[testReview.model, testReview.user, testReview.score, testReview.date, testReview.comment]);
            })

            await reviewDAO.deleteUserProductReview(testReview.model, testReview.user)


            db.all("SELECT * FROM reviews", [], (err, rows) => {
                if (err) {
                    expect(true).toBe(false)
                    return
                }

                expect(rows).toHaveLength(0)
            })
        })

        test("It should not remove the review if the user did not reviewd it", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 1);
            const testReview = new ProductReview(testProduct.model, 'customer', 5, '', '')
            db.serialize(() => {
                InserCustomer("customer");
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertRewie,[testReview.model, testReview.user, testReview.score, testReview.date, testReview.comment]);
            })

            await reviewDAO.deleteUserProductReview(testReview.model, 'wrongUser')

            db.all("SELECT * FROM reviews", [], (err, rows) => {
                if (err) {
                    expect(true).toBe(false)
                    return
                }

                expect(rows).toHaveLength(1)
            })
        })


    })

    describe("getUserProductReview", () => {
        test("It should return the review of the user for the product", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 1);
            const testReview = new ProductReview(testProduct.model, 'customer', 5, '', '')
            db.serialize(() => {
                InserCustomer("customer");
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertRewie,[testReview.model, testReview.user, testReview.score, testReview.date, testReview.comment]);
            });

            const reviews = await reviewDAO.getUserProductReview(testReview.model, testReview.user)

            expect(reviews).toBeDefined()

        })

        test("It should return an empty list if the user did not reviewd the product", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 1);
            const testReview = new ProductReview(testProduct.model, 'customer', 5, '', '')

            db.serialize(() => {
                InserCustomer("customer");
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertRewie,[testReview.model, testReview.user, testReview.score, testReview.date, testReview.comment]);
            });

            const reviews = await reviewDAO.getUserProductReview(testReview.model, 'wrongUser')

            expect(reviews).toBe(null)
        })

        test("It should not return the review of the user for the product", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 1);
            const testReview = new ProductReview(testProduct.model, 'customer', 5, '', '')

            db.serialize(() => {
                InserCustomer("customer");
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertRewie,[testReview.model, testReview.user, testReview.score, testReview.date, testReview.comment]);
            });
            const reviews = await reviewDAO.getUserProductReview('wrongModel', testReview.user)

            expect(reviews).toBe(null)
        })

    })

    describe("deleteReviewsOfProduct", () => {
        test("It should delete all reviews of a specific product.", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 1);
            const testReview = new ProductReview(testProduct.model, 'customer', 5, '', '')
            // Insert a product and a review for the product
            // register a customer and a manager
            db.serialize(() => {
                InserCustomer("customer");
                insertManager("manager")
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertRewie,[testReview.model, testReview.user, testReview.score, testReview.date, testReview.comment]);
             });
             const reviewBeforeDelete = await reviewDAO.getUserProductReview(testReview.model, testReview.user)
             expect(reviewBeforeDelete).toBeDefined()

            await reviewDAO.deleteReviewsOfProduct(testProduct.model)
            const reviewsAfterDelete = await reviewDAO.getUserProductReview(testReview.model, testReview.user)
            expect(reviewsAfterDelete).toBeNull()
        })
    })
    describe("deleteAllReviews", () => {
        test("It should delete all reviews of a specific product.", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 1);
            const testReview = new ProductReview(testProduct.model, 'customer', 5, '', '')
            // Insert a product and a review for the product
            // register a customer and a manager
            db.serialize(() => {
                InserCustomer("customer");
                insertManager("manager")
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertRewie,[testReview.model, testReview.user, testReview.score, testReview.date, testReview.comment]);
             });
             const reviewBeforeDelete = await reviewDAO.getUserProductReview(testReview.model, testReview.user)
             expect(reviewBeforeDelete).toBeDefined()

            await reviewDAO.deleteAllReviews()
            const reviewsAfterDelete = await reviewDAO.getUserProductReview(testReview.model, testReview.user)
            expect(reviewsAfterDelete).toBeNull()
            
        })
    })

    describe('getProductReviews tests', () => {
        const testModel = "Test Model";
        test("It should return an array of reviews for a product model", async () => {
            const testProduct = new Product(10, testModel, Category.APPLIANCE, null, null, 1);
            const testReview1 = new ProductReview(testProduct.model, 'customer1', 5, '', '');
            const testReview2 = new ProductReview(testProduct.model, 'customer2', 4, '', '');
    
            db.serialize(() => {
                InserCustomer("customer1");
                InserCustomer("customer2");
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertRewie,[testReview1.model, testReview1.user, testReview1.score, testReview1.date, testReview1.comment]);
                db.run(sqlInsertRewie,[testReview2.model, testReview2.user, testReview2.score, testReview2.date, testReview2.comment]);
            });
    
            const reviews = await reviewDAO.getProductReviews(testModel)
    
            expect(reviews).toBeDefined();
            expect(reviews.length).toBe(2);
        });
    
        test("It should return an empty array if no reviews exist for the product model", async () => {
            const reviews = await reviewDAO.getProductReviews('wrongModel')
            expect(reviews).toEqual([]);
        });
    });
})