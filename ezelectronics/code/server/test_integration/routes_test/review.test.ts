import { jest, describe, test, expect, beforeAll, afterAll,beforeEach,afterEach } from "@jest/globals";
import request from 'supertest';
import { app } from "../../index";
import { cleanup } from "../../src/db/cleanup";
import CartDAO from "../../src/dao/cartDAO";
import { Cart } from "../../src/components/cart";
import CartController from "../../src/controllers/cartController";
import dayjs from "dayjs";
import db from "../../src/db/db";
import crypto from "crypto";
import { Role } from "../../src/components/user";
import ReviewDAO from "../../src/dao/reviewDAO";


const routePath = "/ezelectronics"; // Base route path for the API

// Helper function that logs in a user and returns the cookie
// Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    const response = await request(app)
        .post(`${routePath}/sessions`)
        .send(userInfo)

    const cookie = response.header["set-cookie"];
    if (!cookie) {
        throw new Error("Login failed, cookie not set");
    }

    return cookie[0];
};

//inserisce un utente del tipo { username: "Admin", name: "Admin", surname: "Admin", password: "Admin", role: "Admin" } non considernado salt,addres birthdate..;
const insertUser = async (userType: any) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const hashedPassword = crypto.scryptSync(userType, salt, 16);
    await new Promise<void>((resolve, reject) => {
        db.run("INSERT INTO users (username, name, surname, role, password, salt, address, birthdate) VALUES (?,?,?,?,?,?,NULL,NULL)", [userType, userType, userType, userType, hashedPassword, salt], (err) => {
            if (err) {
                //console.log(err)
                return reject(err);
            }
            resolve();
        });
    });
};
const insertCustomer = async (username: string) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const hashedPassword = crypto.scryptSync(username, salt, 16);
    await new Promise<void>((resolve, reject) => {
        db.run("INSERT INTO users (username, name, surname, role, password, salt, address, birthdate) VALUES (?,?,?,?,?,?,NULL,NULL)", [username, username, username, Role.CUSTOMER, hashedPassword, salt], (err) => {
            if (err) {
                //console.log(err)
                return reject(err);
            }
            resolve();
        });
    });
};

// Helper function to register a product
const registerProduct = async (product: any, cookie: string) => {
    const response = await request(app)
        .post(`${routePath}/products`)
        .set("Cookie", cookie)
        .send(product);
    expect(response.status).toBe(200);
};

// Helper function to add a review to a product
const addReview = async (review: any, cookie: string) =>{
    const response = await request(app)
        .post(`${routePath}/reviews/${review.model}`)
        .set("Cookie",cookie)
        .send(review.review);
    expect(response.status).toBe(200);
}

// Test products
const product = {
    model: "Model",
    category: "Smartphone",
    quantity: 10,
    details: "Details of Product ",
    sellingPrice: 100,
    arrivalDate: "2023-01-01",
};
// Test Review
const review = {
    score: 3,
    comment: 'commento'
}



// Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer1", password: "customer", role: "Customer" };
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" };
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" };


// Cookies for the users. We use them to keep users logged in. Creating them once and saving them in variables outside of the tests will make cookies reusable
let customerCookie: string;
let adminCookie: string;
let managerCookie: string;

// Before executing tests, we remove everything from our test database, 
// create a Manager user and log in as Admin, saving the cookie in the corresponding variable
// Then we create a register a couple of product in the database to be added to 
// customer carts

beforeEach(async () => {
    await insertUser(Role.MANAGER);
    managerCookie = await login({ username: "Manager", password: "Manager" });
    await insertUser(Role.ADMIN);
    adminCookie = await login({ username: "Admin", password: "Admin" });
    await insertUser(Role.CUSTOMER);
    customerCookie = await login({ username: "Customer", password: "Customer" });
},30000);
// After each tests, we remove everything from our test database
afterEach(async () => {
    await cleanup();
},30000);
// After executing tests, we remove everything from our test database

afterAll(async () => {
    await cleanup();
});

beforeAll(async () => {
    await cleanup();
});

describe("Review routes integration tests", () => {

    describe("GET /reviews/:model", () => {
        test("Returns 200 and the correct reviews for a valid product model", async () => {
            const productModel = "Model";
            const expectedReview = {
                comment: "commento",
                date: dayjs().format("YYYY-MM-DD"),
                model: "Model",
                score: 3,
                user: "Customer",
            };
            
            await registerProduct({ ...product, model: productModel }, managerCookie);
            await addReview({ model: productModel, review }, customerCookie);
            const response = await request(app)
                .get(`${routePath}/reviews/${productModel}`)
                .set("Cookie", customerCookie);

            
            expect(response.status).toBe(200);
            expect(response.body).toEqual([expectedReview]);

           
        },30000);

        test("Returns 404 when reviews for a non-existing product model are requested", async () => {
            const nonExistingModel = "NonExistingModel";

            const response = await request(app)
                .get(`${routePath}/reviews/${nonExistingModel}`)
                .set("Cookie", customerCookie);

            expect(response.status).toBe(404);
            
        },30000);
        test("Returns 401 error when the user is not authenticated", async () => {
            const response = await request(app)
                .get(`${routePath}/reviews/${product.model}`);

            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({ error: "Unauthenticated user" });
        },30000);
    });

    describe("DELETE /reviews/:model/all", () =>{
        test("It should delete all reviews for a specific model of products(Manager)", async () => {
            await registerProduct(product,managerCookie)

            // Make final review object
            const inputReview = {
                model: product.model,
                user: customer,
                review
            }
            
            await addReview(inputReview,customerCookie)


            const response = await request(app)
                .delete(`${routePath}/reviews/${product.model}/all`)
                .set("Cookie", managerCookie)
                expect(response.status).toBe(200);

            // Check if all reviews are deleted
            const reviewsResponse = await request(app)
                .get(`${routePath}/reviews/${product.model}`)
                .set("Cookie", managerCookie)
                expect(reviewsResponse.status).toBe(200);
                expect(reviewsResponse.body).toHaveLength(0);
        },30000);
        test("It should delete all reviews for a specific model of products(Admin)", async () => {
            await registerProduct(product,managerCookie)

            // Make final review object
            const inputReview = {
                model: product.model,
                user: customer,
                review
            }
            
            await addReview(inputReview,customerCookie)


            const response = await request(app)
                .delete(`${routePath}/reviews/${product.model}/all`)
                .set("Cookie", adminCookie)
                expect(response.status).toBe(200);

            // Check if all reviews are deleted
            const reviewsResponse = await request(app)
                .get(`${routePath}/reviews/${product.model}`)
                .set("Cookie", managerCookie)
                expect(reviewsResponse.status).toBe(200);
                expect(reviewsResponse.body).toHaveLength(0);
        },30000);
        test("It should return a 404 error when product model is not in the database", async () => {   
            
            const response = await request(app)
                .delete(`${routePath}/reviews/${product.model}/all`)
                .set("Cookie", adminCookie)
                expect(response.status).toBe(404);
                //console.log(response.body)


        },30000);
        test("It should return a 401 error code if the user is not an Admin or Manager", async () => {

            await request(app).delete(`${routePath}/reviews/${product.model}/all`).set("Cookie", customerCookie).expect(401); // We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
            await request(app).delete(`${routePath}/reviews/${product.model}/all`).expect(401); // We can also call the route without any cookie. The result should be the same
        },30000);
        test("It should return error 503 code if there's been an error in the database", async () =>{
            await registerProduct(product,managerCookie)

            // Make final review object
            const inputReview = {
                model: product.model,
                user: customer,
                review
            }
            
            await addReview(inputReview,customerCookie)
            jest.spyOn(ReviewDAO.prototype,"deleteReviewsOfProduct").mockRejectedValueOnce(new Error('Database error'));
            const response = await request(app)
                .delete(`${routePath}/reviews/${product.model}/all`)
                .set("Cookie", adminCookie)
                expect(response.status).toBe(503);
        },30000)


    });
    describe("DELETE /reviews", () =>{
        test("It should delete all reviews for all products(Manager)", async () => {
            await registerProduct(product,managerCookie)

            // Make final review object
            const inputReview = {
                model: product.model,
                user: customer,
                review
            }
            
            await addReview(inputReview,customerCookie)


            const response = await request(app)
                .delete(`${routePath}/reviews`)
                .set("Cookie", managerCookie)
                expect(response.status).toBe(200);

            // Check if all reviews are deleted
            const reviewsResponse = await request(app)
                .get(`${routePath}/reviews/${product.model}`)
                .set("Cookie", managerCookie)
                expect(reviewsResponse.status).toBe(200);
                expect(reviewsResponse.body).toHaveLength(0);
        },30000);
        test("It should delete all reviews for a specific model of products(Admin)", async () => {
            await registerProduct(product,managerCookie)

            // Make final review object
            const inputReview = {
                model: product.model,
                user: customer,
                review
            }
            
            await addReview(inputReview,customerCookie)


            const response = await request(app)
                .delete(`${routePath}/reviews`)
                .set("Cookie", adminCookie)
                expect(response.status).toBe(200);

            // Check if all reviews are deleted
            const reviewsResponse = await request(app)
                .get(`${routePath}/reviews/${product.model}`)
                .set("Cookie", managerCookie)
                expect(reviewsResponse.status).toBe(200);
                expect(reviewsResponse.body).toHaveLength(0);
        },30000);
        
        test("It should return a 401 error code if the user is not an Admin or Manager", async () => {

            await request(app).delete(`${routePath}/reviews`).set("Cookie", customerCookie).expect(401); // We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
            await request(app).delete(`${routePath}/reviews`).expect(401); // We can also call the route without any cookie. The result should be the same
        },30000);
        test("It should return error 503 code if there's been an error in the database", async () =>{
            await registerProduct(product,managerCookie)

            // Make final review object
            const inputReview = {
                model: product.model,
                user: customer,
                review
            }
            
            await addReview(inputReview,customerCookie)
            jest.spyOn(ReviewDAO.prototype,"deleteAllReviews").mockRejectedValueOnce(new Error('Database error'));
            const response = await request(app)
                .delete(`${routePath}/reviews`)
                .set("Cookie", adminCookie)
                expect(response.status).toBe(503);
        },30000)
    });
    describe("DELETE /reviews/:model",()=>{
        const productModel = "Model";
        const anotherProductModel = "AnotherModel";
        const nonExistentModel = "NonExistentModel";

        test("It should delete the review by the logged-in customer", async () => {
            await registerProduct({ ...product, model: productModel }, managerCookie);
            await addReview({ model: productModel, review }, customerCookie);
            const response = await request(app)
                .delete(`${routePath}/reviews/${productModel}`)
                .set("Cookie", customerCookie);

            expect(response.status).toBe(200);

            // Check if the review is deleted
            const reviewsResponse = await request(app)
                .get(`${routePath}/reviews/${productModel}`)
                .set("Cookie", customerCookie);

            expect(reviewsResponse.status).toBe(200);
            expect(reviewsResponse.body).toHaveLength(0);

        },30000);
        test("It should return a 404 error if the product model does not exist", async () => {
            const response = await request(app)
                .delete(`${routePath}/reviews/${nonExistentModel}`)
                .set("Cookie", customerCookie);
    
            expect(response.status).toBe(404);
        },30000);
        test("It should return a 404 error if the customer has not reviewed the specified product", async () => {
            await registerProduct({ ...product, model: anotherProductModel }, managerCookie);

            const response = await request(app)
                .delete(`${routePath}/reviews/${anotherProductModel}`)
                .set("Cookie", customerCookie);
    
            expect(response.status).toBe(404);
        },30000);
        test("It should return a 401 error if the user is not logged in", async () => {
            await registerProduct({ ...product, model: productModel }, managerCookie);
            await addReview({ model: productModel, review }, customerCookie);
            const response = await request(app)
                .delete(`${routePath}/reviews/${productModel}`);
            
            expect(response.status).toBe(401);
        },30000);
        test("It should return a 404 error if the user-logged in has not reviewed the specified product but another user did it", async () => {
            await insertCustomer("Customer1");
            const anotherCustomerCookie = await login({ username: "Customer1", password: "Customer1" });
            await registerProduct({ ...product, model: productModel }, managerCookie);
            await addReview({ model: productModel, review }, customerCookie);
            const response = await request(app)
                .delete(`${routePath}/reviews/${productModel}`)
                .set("Cookie", anotherCustomerCookie);
    
            expect(response.status).toBe(404);
        },30000);
        test("It should return a 401 error if the user is not logged-in", async () => {
            const response = await request(app)
                .delete(`${routePath}/reviews/${productModel}`)
            expect(response.status).toBe(401);
        },30000);

    });





});