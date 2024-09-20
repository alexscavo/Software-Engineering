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

// Helper function to register a product
const registerProduct = async (product: any, cookie: string) => {
    const response = await request(app)
        .post(`${routePath}/products`)
        .set("Cookie", cookie)
        .send(product);
    expect(response.status).toBe(200);
};

// Helper function to add a product to cart
const addProduct = async (model: any, cookie: string) =>{
    const response = await request(app)
        .post(`${routePath}/carts`)
        .set("Cookie",cookie)
        .send(model);
    expect(response.status).toBe(200);
}

// Test products
const product1 = {
    model: "Model1",
    category: "Smartphone",
    quantity: 10,
    details: "Details of Product 1",
    sellingPrice: 100,
    arrivalDate: "2023-01-01",
};

const product2 = {
    model: "Model2",
    category: "Laptop",
    quantity: 20,
    details: "Details of Product 2",
    sellingPrice: 200,
    arrivalDate: "2023-02-01",
};

const product3 = {
    model: "Model3",
    category: "Smartphone",
    quantity: 1,
    details: "Details of Product 3",
    sellingPrice: 100,
    arrivalDate: "2023-01-01",
};


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
beforeAll((done) => {
    // Create the users table before each test
    db.serialize(() => {
        db.run("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, name TEXT, surname TEXT, password TEXT, salt TEXT, role TEXT, address TEXT, birthdate TEXT)", done);
    });
});


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

describe("Cart routes integration tests", () => {
    describe("DELETE /carts", () =>{
        test("It should delete all carts and return a 200 status code(Manager)", async () => {

            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)
            await addProduct({model: product2.model}, customerCookie)


            const response = await request(app)
                .delete(`${routePath}/carts`)
                .set("Cookie", managerCookie)
                expect(response.status).toBe(200);

            // Check if all carts are deleted
            const cartsResponse = await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", managerCookie)
                expect(cartsResponse.status).toBe(200);
                expect(cartsResponse.body).toHaveLength(0);
        },30000);
        test("It should delete all carts and return a 200 status code(Admin)", async () => {

            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)
            await addProduct({model: product2.model}, customerCookie)

            // Called by an admin
            const response = await request(app)
                .delete(`${routePath}/carts`)
                .set("Cookie", adminCookie)
                expect(response.status).toBe(200);

            // Check if all carts are deleted
            const cartsResponse = await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", managerCookie)
                expect(cartsResponse.status).toBe(200);
                expect(cartsResponse.body).toHaveLength(0);
        },30000);

        test("It should return a 401 error code if the user is not an Admin or Manager", async () => {

            await request(app).delete(`${routePath}/carts`).set("Cookie", customerCookie).expect(401); // We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
            await request(app).delete(`${routePath}/carts`).expect(401); // We can also call the route without any cookie. The result should be the same
        },30000);
        test("It should return error 503 code if there's been an error in the database", async () =>{
            jest.spyOn(CartDAO.prototype,"deleteAllCarts").mockRejectedValueOnce(new Error('Database error'));
            const response = await request(app)
                .delete(`${routePath}/carts`)
                .set("Cookie", managerCookie)
                expect(response.status).toBe(503);
        },30000)
        
    })

    describe("GET /carts/all", () =>{
    
        test("It should get all carts and return a 200 status code(Manager)", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)
            await addProduct({model: product2.model}, customerCookie)

            const response = await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", managerCookie)
                expect(response.status).toBe(200);
                expect(response.body).toHaveLength(1);
        },30000);
        test("It should get all carts and return a 200 status code(Admin)", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)
            await addProduct({model: product2.model}, customerCookie)

            const response = await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", adminCookie)
                expect(response.status).toBe(200);
                expect(response.body).toHaveLength(1);
        },30000);
        test("It should return a 401 error code if the user is not an Admin or Manager", async () => {
            await request(app).get(`${routePath}/carts/all`).set("Cookie", customerCookie).expect(401); // We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
            await request(app).get(`${routePath}/carts/all`).expect(401); // We can also call the route without any cookie. The result should be the same
        },30000);
        test("It should return error 503 code if there's been an error in the database", async () =>{
            jest.spyOn(CartDAO.prototype,"getAllCarts").mockRejectedValueOnce(new Error('Database error'));
            // Check if all carts are deleted
            const response = await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", managerCookie);
                expect(response.status).toBe(503);
        },30000)  
    })

    describe("DELETE /carts/current", () =>{
    
        test("It should remove all the products from the cart of the user", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)
            await addProduct({model: product2.model}, customerCookie)

            const response = await request(app)
                .delete(`${routePath}/carts/current`)
                .set("Cookie", customerCookie)
            expect(response.status).toBe(200);
        
            const cart = await request(app)
                                        .get(`${routePath}/carts`)
                                        .set("Cookie", customerCookie)

            expect(cart.status).toBe(200);
            expect(cart.body.products).toHaveLength(0)
            expect(cart.body.total).toBe(0)
        },30000);

        test("It should return 404 if the user do not have an unpaid cart", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            const response = await request(app)
                .delete(`${routePath}/carts/current`)
                .set("Cookie", customerCookie)
            expect(response.status).toBe(404);
        },30000);

        test("It should fail if the user is a manager/admin", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)
            await addProduct({model: product2.model}, customerCookie)

            const response = await request(app)
                .delete(`${routePath}/carts/current`)
                .set("Cookie", managerCookie)
            expect(response.status).toBe(401);
        
            const cart = await request(app)
                                        .get(`${routePath}/carts`)
                                        .set("Cookie", customerCookie)

            expect(cart.status).toBe(200);
            expect(cart.body.products).toHaveLength(2)
        },30000);
    })

    describe("POST /carts", () =>{
    
        test("It should add a product to the cart of the user", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            const response = await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({model: product1.model});
            expect(response.status).toBe(200);
        
            const cart = await request(app)
                                .get(`${routePath}/carts`)
                                .set("Cookie", customerCookie)
                                
            expect(cart.status).toBe(200);
            expect(cart.body.products).toHaveLength(1)
        },30000);

        test("It should return 404 if the model is not registered", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            const response = await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({model: 'wrongModel'});
            expect(response.status).toBe(404);
        },30000);

        test("It should return 409 if the model has quantity 0", async () => {

            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)
            await registerProduct(product3,managerCookie)
            
            const resp = await request(app)
                .patch(`${routePath}/products/${product3.model}/sell`)
                .set("Cookie", managerCookie)
                .send({sellingDate: '2024-05-05', quantity: 1});
            expect(resp.status).toBe(200);

            const response = await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({model: product3.model});
            expect(response.status).toBe(409);
        },30000);

        test("It should return 401 if the user is not a Customer", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            const response = await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", managerCookie)
                .send({model: product1.model});
            expect(response.status).toBe(401);
        },30000);

        test("It should return 422 if model parameter is not a string", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            const response = await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({model: 125});
            expect(response.status).toBe(422);
        },30000);

        test("It should return 422 if model parameter is empty", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            const response = await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({model: ''});
            expect(response.status).toBe(422);
        },30000);

        test("It should return 401 if model user is not authenticated", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            const response = await request(app)
                .post(`${routePath}/carts`)
                .send({model: product1.model});
            expect(response.status).toBe(401);
        },30000);
        
    })

    describe("GET /carts", () =>{
    
        test("It should return the cart of the user", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)

            const cart = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
            expect(cart.status).toBe(200);
            expect(cart.body).toEqual({customer: 'Customer', paid: 0, paymentDate: null, total: product1.sellingPrice, products: [{
                model: 'Model1',
                quantity: 1,
                category: 'Smartphone',
                price: 100}]})
        },30000);

        test("It should return an empty cart", async () => {

            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            const cart = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
            expect(cart.status).toBe(200);
            expect(cart.body).toEqual({customer: 'Customer', paid: false, paymentDate: null, total: 0, products: []})
        },30000);

        test("It should return 401 if the user is not a Customer", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)

            const cart = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", managerCookie)
            expect(cart.status).toBe(401);
        },30000);

        test("It should return 401 if model user is not authenticated", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)

            const cart = await request(app)
                .get(`${routePath}/carts`)
            expect(cart.status).toBe(401);
        },30000);
      
    })

    describe("PATCH /carts", () =>{
    
        test("It should checkout the cart", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)

            const response = await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
            expect(response.status).toBe(200);

            
            const cart = await request(app)
                            .get(`${routePath}/carts/all`)
                            .set("Cookie", adminCookie)
                                
            expect(cart.status).toBe(200);
            expect(cart.body).toEqual([{customer: 'Customer',
                paid: 1,
                paymentDate: dayjs().format('YYYY-MM-DD'),
                total: 100,
                products: [{"category": product1.category, "model": product1.model, "price": product1.sellingPrice, "quantity": 1}]}]);
        },30000);

        test("It should return 404 if the user do not have an unpaid cart", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            const response = await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
            expect(response.status).toBe(404);
        },30000);

        test("It should return a 400 error if the cart is empty", async () => {


            await registerProduct(product1,managerCookie)

            await addProduct({model: product1.model}, customerCookie)
            await request(app)
                .delete(`${routePath}/carts/products/${product1.model}`)
                .set("Cookie", customerCookie)

            const response = await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
            expect(response.status).toBe(400);

        },30000);

        test("It should return 409 if the user do not have an unpaid cart", async () => {


            await registerProduct(product3,managerCookie)

            await addProduct({model: product3.model}, customerCookie)
            await addProduct({model: product3.model}, customerCookie)
            
            await request(app)
                .patch(`${routePath}/products/${product3.model}/sell`)
                .set("Cookie", managerCookie)
                .send({sellingDate: '2024-05-05', quantity: 1});        

            const response = await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
            expect(response.status).toBe(409);
        },30000);

        test("It should return 401 if the user is not a Customer", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            const response = await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", managerCookie)
            expect(response.status).toBe(401);
        },30000);

        test("It should return 401 if the user is not logged in", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            const response = await request(app)
                .patch(`${routePath}/carts`)

            expect(response.status).toBe(401);
        },30000);


    })

    describe("GET /carts/history", () =>{
    
        test("It should retrieve the paid carts", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)

            await await request(app)
                    .patch(`${routePath}/carts`)
                    .set("Cookie", customerCookie)

            const carts = await request(app)
                .get(`${routePath}/carts/history`)
                .set("Cookie", customerCookie)
            expect(carts.status).toBe(200);

            expect(carts.body).toEqual([{customer: 'Customer', paid: 1, paymentDate: dayjs().format('YYYY-MM-DD'), total: 100, products: [{"model": product1.model, category: "Smartphone", "price": product1.sellingPrice, "quantity": 1}]}])
        },30000);

        test("It should return an empty list", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)

            const carts = await request(app)
                .get(`${routePath}/carts/history`)
                .set("Cookie", customerCookie)
            expect(carts.status).toBe(200);

            expect(carts.body).toEqual([])
        },30000);

        test("It should return 401 is the user is not a Customer", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)

            await await request(app)
                    .patch(`${routePath}/carts`)
                    .set("Cookie", customerCookie)

            const carts = await request(app)
                .get(`${routePath}/carts/history`)
                .set("Cookie", adminCookie)
            expect(carts.status).toBe(401);
            
        },30000);

        test("It should return 401 is the user is not authenticated", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)

            await await request(app)
                    .patch(`${routePath}/carts`)
                    .set("Cookie", customerCookie)

            const carts = await request(app)
                .get(`${routePath}/carts/history`)
            expect(carts.status).toBe(401);
            
        },30000);

    })

    describe("DELETE /carts/history", () =>{
    
        test("It should remove 1 product quantity from the cart", async () => {


            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)
            await addProduct({model: product1.model}, customerCookie)

            const response = await request(app)
                    .delete(`${routePath}/carts/products/${product1.model}`)
                    .set("Cookie", customerCookie)
            expect(response.status).toBe(200)

            const cart = await request(app)
                                .get(`${routePath}/carts`)
                                .set("Cookie", customerCookie)
            expect(cart.status).toBe(200);
            expect(cart.body.products[0].quantity).toBe(1)
        },30000);

        test("It should return 404 if th model represents a product that is not in the cart", async () => {

            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            const response = await request(app)
                    .delete(`${routePath}/carts/products/${product1.model}`)
                    .set("Cookie", customerCookie)
            expect(response.status).toBe(404)
        },30000);

        test("It should remove 404 if the product does not represent an existing product", async () => {

            const response = await request(app)
                    .delete(`${routePath}/carts/products/${product1.model}`)
                    .set("Cookie", customerCookie)
            expect(response.status).toBe(404)
        },30000);

        test("It should remove 404 if the cart is empty", async () => {

            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)
            await request(app)
                .delete(`${routePath}/carts/products/${product1.model}`)
                .set("Cookie", customerCookie)

            const response = await request(app)
                    .delete(`${routePath}/carts/products/${product1.model}`)
                    .set("Cookie", customerCookie)
            expect(response.status).toBe(404)
        },30000);

        test("It should remove 401 if the user is not a Customer", async () => {

            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)
            const response = await request(app)
                    .delete(`${routePath}/carts/products/${product1.model}`)
                    .set("Cookie", managerCookie)
            expect(response.status).toBe(401)
        },30000);

        test("It should remove 404 if the user is not logged in", async () => {

            await registerProduct(product1,managerCookie)
            await registerProduct(product2,managerCookie)

            await addProduct({model: product1.model}, customerCookie)
            const response = await request(app)
                    .delete(`${routePath}/carts/products/${product1.model}`)
            expect(response.status).toBe(401)
        },30000);
    })
})