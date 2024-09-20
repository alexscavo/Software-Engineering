import { jest, describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals";
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
import ProductDAO from "../../src/dao/productDAO";
import { Category } from "../../src/components/product";
import ProductController from "../../src/controllers/productController"
import { Product } from "../../src/components/product"


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
                return reject(err);
            }
            resolve();
        });
    });
};

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

// Helper function to register a product
const registerProduct = async (product: any, cookie: string) => {
    const response = await request(app)
        .post(`${routePath}/products`)
        .set("Cookie", cookie)
        .send(product);
    expect(response.status).toBe(200);
};



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


// Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer1", password: "customer", role: "Customer" };
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" };
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" };


// Cookies for the users. We use them to keep users logged in. Creating them once and saving them in variables outside of the tests will make cookies reusable
let customerCookie: string;
let adminCookie: string;
let managerCookie: string;


async function create_tables() {
    await db.exec(`CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY NOT NULL UNIQUE, name TEXT NOT NULL, surname TEXT NOT NULL, role TEXT NOT NULL, password TEXT, salt TEXT, address TEXT, birthdate TEXT)`);
    await db.exec(`CREATE TABLE IF NOT EXISTS products (model TEXT PRIMARY KEY, sellingPrice REAL NOT NULL, category TEXT NOT NULL, arrivalDate TEXT, details TEXT, quantity INTEGER NOT NULL)`);
    await db.exec(`CREATE TABLE IF NOT EXISTS carts (id INTEGER PRIMARY KEY AUTOINCREMENT, customer TEXT NOT NULL, paid BOOLEAN NOT NULL DEFAULT 0, paymentDate TEXT DEFAULT NULL, total REAL NOT NULL DEFAULT 0, FOREIGN KEY (customer) REFERENCES users (username) ON DELETE CASCADE)`);
    await db.exec(`CREATE TABLE IF NOT EXISTS products_in_cart (cartId INTEGER NOT NULL, model TEXT NOT NULL, quantity INTEGER NOT NULL, category TEXT NOT NULL, price REAL NOT NULL, PRIMARY KEY (cartId, model), FOREIGN KEY (cartId) REFERENCES carts(id) ON DELETE CASCADE, FOREIGN KEY (model) REFERENCES products(model) ON DELETE CASCADE)`);
    await db.exec(`CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, model TEXT NOT NULL, user TEXT NOT NULL, score INTEGER NOT NULL, date TEXT NOT NULL, comment TEXT, FOREIGN KEY (model) REFERENCES products(model) ON DELETE CASCADE, FOREIGN KEY (user) REFERENCES users(username) ON DELETE CASCADE)`);
}


let productDao: ProductDAO;
let productController: ProductController;
let prodotto1: Product;
let prodotto2: Product;
let prodotto_modello_non_esiste: Product;
let prodotto_quantità_esaurita: Product;
let prodotto_laptop1: Product;
let prodotto_laptop2: Product;
let prodotto_applicance1: Product;


beforeAll(async () => {

    productDao = new ProductDAO()
    productController = new ProductController()

    prodotto1 = new Product(10, "model1", Category.SMARTPHONE, "2021-10-10", "details", 10)
    prodotto2 = new Product(10, "model2", Category.SMARTPHONE, "2021-10-10", "details", 10)
    prodotto_modello_non_esiste = new Product(10, "modelloNonEsiste", Category.SMARTPHONE, "2021-10-10", "details", 10)
    prodotto_quantità_esaurita = new Product(10, "modelQE", Category.SMARTPHONE, "2021-10-10", "details", 0)
    prodotto_laptop1 = new Product(10, "modelLaptop1", Category.LAPTOP, "2021-10-10", "details", 10)
    prodotto_laptop2 = new Product(10, "modelLaptop2", Category.LAPTOP, "2021-10-10", "details", 10)
    prodotto_applicance1 = new Product(10, "modelAppliance1", Category.APPLIANCE, "2021-10-10", "details", 10)

    await cleanup();
})

// Before executing tests, we remove everything from our test database, 
// create a Manager user and log in as Admin, saving the cookie in the corresponding variable
// Then we create a register a couple of product in the database to be added to 
// customer carts

beforeEach(async () => {
    await productController.registerProducts(prodotto1.model, prodotto1.category, prodotto1.quantity, prodotto1.details, prodotto1.sellingPrice, prodotto1.arrivalDate)
    await productController.registerProducts(prodotto_quantità_esaurita.model, prodotto_quantità_esaurita.category, prodotto_quantità_esaurita.quantity, prodotto_quantità_esaurita.details, prodotto_quantità_esaurita.sellingPrice, prodotto_quantità_esaurita.arrivalDate)
    await productController.registerProducts(prodotto_laptop1.model, prodotto_laptop1.category, prodotto_laptop1.quantity, prodotto_laptop1.details, prodotto_laptop1.sellingPrice, prodotto_laptop1.arrivalDate)
    await productController.registerProducts(prodotto_laptop2.model, prodotto_laptop2.category, prodotto_laptop2.quantity, prodotto_laptop2.details, prodotto_laptop2.sellingPrice, prodotto_laptop2.arrivalDate)
    await productController.registerProducts(prodotto_applicance1.model, prodotto_applicance1.category, prodotto_applicance1.quantity, prodotto_applicance1.details, prodotto_applicance1.sellingPrice, prodotto_applicance1.arrivalDate)

    // await postUser(customer)
    // customerCookie = await login(customer)
    // await postUser(manager)
    // managerCookie = await login(manager)

    await insertUser(Role.MANAGER);
    managerCookie = await login({ username: "Manager", password: "Manager" });
    await insertUser(Role.ADMIN);
    adminCookie = await login({ username: "Admin", password: "Admin" });
    await insertUser(Role.CUSTOMER);
    customerCookie = await login({ username: "Customer", password: "Customer" });
},30000);
// After each tests, we remove everything from our test database
afterEach(async () => {
    await create_tables();
    await cleanup();
},30000);
// After executing tests, we remove everything from our test database

afterAll(async () => {
    await create_tables();
    await cleanup();
});

describe("Product routes integration tests", () => {

    describe("Get Products", () => {

        test("Retrieve all products when grouping, category, and model are not provided", async () => {
            const grouping: string | null = null
            const category: string | null = null
            const model: string | null = null

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual([prodotto1, prodotto_quantità_esaurita, prodotto_laptop1, prodotto_laptop2, prodotto_applicance1])
                })
        },30000)

        test("Retrieve all products of a specific category", async () => {
            const grouping: string | null = "category"
            const category = Category.LAPTOP
            const model: string | null = null

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual([prodotto_laptop1, prodotto_laptop2])
                })
        },30000)

        test("Retrieve all products of a specific model", async () => {
            const grouping: string | null = "model"
            const category: string | null = null
            const model = "model1"

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual([prodotto1])
                })
        },30000)

        test("Error when category is not provided for category grouping", async () => {
            const grouping = "category"
            const category: string | null = null
            const model: string | null = null

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: "Invalid request: grouping is category and category is null OR model is not null.",
                        status: 422
                    })
                })
        },30000)

        test("Error for invalid category", async () => {
            const grouping = "category"
            const category = "invalid"
            const model: string | null = null

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: "Invalid request: grouping is category and category is null OR model is not null.",
                        status: 422
                    })
                })
        },30000)


        test("Error when model is not provided for model grouping", async () => {
            const grouping = "model"
            const category: string | null = null
            const model: string | null = null

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({
                        error: "Invalid request: grouping is model and model is null OR category is not null.",
                        status: 422,
                    })
                })
        },30000)

        test("Empty model error", async () => {
            const grouping = "model"
            const category: string | null = null
            const model = " "

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${encodeURIComponent(model)}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({ error: "Invalid request: grouping is model and model is null OR category is not null.", status: 422 })
                })
        },30000)

        test("Product not found error", async () => {
            const grouping: string | null = "model"
            const category: string | null = null
            const model = "modelloNonEsiste"

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(404)
                .then((response) => {
                    expect(response.body).toEqual({ error: "Product not found", status: 404 })
                })
        },30000)

        test("Invalid grouping error", async () => {
            const grouping = "invalid"
            const category: string | null = null
            const model: string | null = null

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({ error: "Wrong grouping!", status: 422 })
                })
        },30000)

        test("Error when no grouping provided but category or model is provided", async () => {
            const grouping: string | null = null
            const category = Category.LAPTOP
            const model: string | null = null

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({ error: "Invalid request: grouping is null and any of category or model is not null.", status: 422 })
                })
        },30000)

        test("Grouping on model but model is null error", async () => {
            const grouping = "model"
            const category: string | null = null
            const model: string | null = null

            let url = `${routePath}/products/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({ error: "Invalid request: grouping is model and model is null OR category is not null.", status: 422 })
                })
        },30000)

        test("Retrieve all products", async () => {
            const res = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie);

            expect(res.status).toBe(200);
            // Adjust this expectation based on the actual number of products returned
            expect(res.body.length).toBe(5); // Assuming you registered 5 products in beforeEach
        },30000);

        test("Error 401 when user is not logged in", async () => {
            const res = await request(app)
                .get(`${routePath}/products`);

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Unauthenticated user");
        },30000);

        test("Error 401 for non-admin or manager", async () => {
            const res = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", customerCookie);

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("User is not an admin or manager");
        },30000);




    });

    describe("Get Available Products", () => {

        test("Retrieve all available products", async () => {
            const grouping: string | null = null
            const category: string | null = null
            const model: string | null = null

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            //console.log("Constructed URL:", url);

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(200)
                .then((response) => {
                    //console.log("Response body:", response.body);
                    expect(response.body).toEqual([prodotto1, prodotto_laptop1, prodotto_laptop2, prodotto_applicance1])
                })
        },30000)

        test("Retrieve all available products of a specific category", async () => {
            const grouping: string | null = "category"
            const category = Category.LAPTOP
            const model: string | null = null

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual([prodotto_laptop1, prodotto_laptop2])
                })
        },30000)

        test("Retrieve all available products of a specific model", async () => {
            const grouping: string | null = "model"
            const category: string | null = null
            const model = "model1"

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(200)
                .then((response) => {
                    expect(response.body).toEqual([prodotto1])
                })
        },30000)

        test("Error when category is not provided for category grouping", async () => {
            const grouping = "category"
            const category: string | null = null
            const model: string | null = null

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({ error: "Invalid request: grouping is category and category is null OR model is not null.", status: 422 })
                })
        },30000)

        test("Error for invalid category", async () => {
            const grouping = "category"
            const category = "invalid"
            const model: string | null = null

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({ error: "Invalid request: grouping is category and category is null OR model is not null.", status: 422 })
                })
        },30000)

        test("Error when model is not provided for model grouping", async () => {
            const grouping = "model"
            const category: string | null = null
            const model: string | null = null

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({ error: "Invalid request: grouping is model and model is null OR category is not null.", status: 422 })
                })
        },30000)

        test("Empty model error", async () => {
            const grouping = "model"
            const category: string | null = null
            const model = " "

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${encodeURIComponent(model)}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({ error: "Invalid request: grouping is model and model is null OR category is not null.", status: 422 })
                })
        },30000)

        test("Product not found error", async () => {
            const grouping: string | null = "model"
            const category: string | null = null
            const model = "modelloNonEsiste"

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(404)
                .then((response) => {
                    expect(response.body).toEqual({ error: "Product not found", status: 404 })
                })
        },30000)

        test("Invalid grouping error", async () => {
            const grouping = "invalid"
            const category: string | null = null
            const model: string | null = null

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({ error: "Wrong grouping!", status: 422 })
                })
        },30000)

        test("Error when no grouping provided but category or model is provided", async () => {
            const grouping: string | null = null
            const category = Category.LAPTOP
            const model: string | null = null

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({ error: "Invalid request: grouping is null and any of category or model is not null.", status: 422 })
                })
        },30000)

        test("Grouping on model but model is null error", async () => {
            const grouping = "model"
            const category: string | null = null
            const model: string | null = null

            let url = `${routePath}/products/available/`;
            let params: string[] = [];
            if (grouping) params.push(`grouping=${grouping}`);
            if (category) params.push(`category=${category}`);
            if (model) params.push(`model=${model}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            await request(app)
                .get(url)
                .set('Cookie', managerCookie)
                .expect(422)
                .then((response) => {
                    expect(response.body).toEqual({ error: "Invalid request: grouping is model and model is null OR category is not null.", status: 422 })
                })
        },30000)
    });

    describe("DELETE /products", () => {
        test("It should delete all products and return a 200 status code(Manager)", async () => {

            await registerProduct(product1, managerCookie)
            await registerProduct(product2, managerCookie)

            const response = await request(app)
                .delete(`${routePath}/products`)
                .set("Cookie", managerCookie)
            expect(response.status).toBe(200);

            // Check if all products are deleted
            const cartsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
            expect(cartsResponse.status).toBe(200);
            expect(cartsResponse.body).toHaveLength(0);
        },30000);
        test("It should delete all products and return a 200 status code(Admin)", async () => {

            await registerProduct(product1, managerCookie)
            await registerProduct(product2, managerCookie)

            const response = await request(app)
                .delete(`${routePath}/products`)
                .set("Cookie", adminCookie)
            expect(response.status).toBe(200);

            // Check if all carts are deleted
            const cartsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
            expect(cartsResponse.status).toBe(200);
            expect(cartsResponse.body).toHaveLength(0);
        },30000);
        test("It should return a 401 error code if the user is not an Admin or Manager", async () => {
            await request(app).get(`${routePath}/products`).set("Cookie", customerCookie).expect(401); // We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
            await request(app).get(`${routePath}/products`).expect(401); // We can also call the route without any cookie. The result should be the same
        },30000);
        test("It should return error 503 code if there's been an error in the database", async () => {
            jest.spyOn(ProductDAO.prototype, "getProducts").mockRejectedValueOnce(new Error('Database error'));
            // Check if all carts are deleted
            const response = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie);
            expect(response.status).toBe(503);
        },30000)
    })
    describe("POST /products", () => {
        test("It should register the arrival of a set of products that have the same model(Manager)", async () => {
            // Register products 
            const response = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(response.status).toBe(200);

            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200);
            expect(getProductsResponse.body).toHaveLength(1);
        },30000)
        test("It should register the arrival of a set of products that have the same model(Admin)", async () => {
            // Register products 
            const response = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", adminCookie)
                .send(product1)
            expect(response.status).toBe(200);

            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200);
            expect(getProductsResponse.body).toHaveLength(1);
        },30000)
        test("It should return a 409 error when model represents a Product that is already in the database", async () => {
            // Register product1
            const alreadyPostProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1);
            expect(alreadyPostProduct.status).toBe(200);

            // Trying to register a product with same model
            const response = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(response.status).toBe(409)
            expect(response.body.error).toBe("The product already exists");
        },30000)
        // Tests for error conditions can be added in separate 'test' blocks.
        // We can group together tests for the same condition, no need to create a test for each body parameter, for example
        test("It should return a 422 error code if model is empty", async () => {
            const inproduct = { ...product1, model: "" };
            const response = await request(app).post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(inproduct);
            expect(response.status).toBe(422);
        },30000);
        test("It should return a 422 error code if model is not a string", async () => {
            const inproduct = { ...product1, model: 1 };
            const response = await request(app).post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(inproduct);
            expect(response.status).toBe(422);
        },30000);
        test("It should return a 401 error code if user is not Admin or manager", async () => {
            // Register products 
            const response = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(response.status).toBe(200);

            // Call with wrong user
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", customerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(401);
        },30000)

        test("It should return a 422 error code if sellingPrince is 0", async () => {
            const inproduct = { ...product1, sellingPrice: 0 };
            const response = await request(app).post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(inproduct);
            expect(response.status).toBe(422);
        },30000);
        test("It should return a 422 error code if sellingPrice is not a number", async () => {
            const inproduct = { ...product1, sellingPrice: "3" };
            const response = await request(app).post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(inproduct);
            expect(response.status).toBe(422);
        },30000);
        test("It should return a 422 error code if category is not valid", async () => {
            const inproduct = { ...product1, category: "DishWasher" };
            const response = await request(app).post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(inproduct);
            expect(response.status).toBe(422);
        },30000);
        test("It should return a 422 error code if quantity is 0", async () => {
            const inproduct = { ...product1, quantity: 0 };
            const response = await request(app).post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(inproduct);
            expect(response.status).toBe(422);
        },30000);
        test("It should return a 422 error code if quantity is not a number", async () => {
            const inproduct = { ...product1, quantity: "3" };
            const response = await request(app).post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(inproduct);
            expect(response.status).toBe(422);
        },30000);
        test("It should return a 422 error code if details is not a string", async () => {
            const inproduct = { ...product1, details: 0 };
            const response = await request(app).post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(inproduct);
            expect(response.status).toBe(422);
        },30000);
        test("It should return a 422 error code if arrivalDate is after current Date", async () => {
            const inproduct = { ...product1, arrivalDate: "2025-01-01" };
            const response = await request(app).post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(inproduct);
            expect(response.status).toBe(422);
        },30000);
        test("It should return a 422 error code if arrivalDate format is not valid", async () => {
            const inproduct = { ...product1, arrivalDate: "2024/01/01" };
            const response = await request(app).post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(inproduct);
            expect(response.status).toBe(422);
        },30000);
    })
    describe("PATCH /products/:model", () => {
        test("it should increases the available quantity of a set of products(Manager)", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            const testChange = {
                quantity: 5,
                changeDate: "2024-02-01"
            }
            // new quantity should be 25
            const expectedValue = oldQuantity + testChange.quantity
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(200)
            expect(response.body).toEqual({ quantity: expectedValue })

            // Verify that the product have been registered
            const getModifiedProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getModifiedProductsResponse.status).toBe(200)
            expect(getModifiedProductsResponse.body).toHaveLength(1)
            expect((getModifiedProductsResponse.body)[0].quantity).toEqual(expectedValue)
        },30000)
        test("it should increases the available quantity of a set of products(Admin)", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            const testChange = {
                quantity: 5,
                changeDate: "2024-02-01"
            }
            // new quantity should be 25
            const expectedValue = oldQuantity + testChange.quantity
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}`)
                .set("Cookie", adminCookie)
                .send(testChange);
            expect(response.status).toBe(200)
            expect(response.body).toEqual({ quantity: expectedValue })

            // Verify that the product have been registered
            const getModifiedProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getModifiedProductsResponse.status).toBe(200)
            expect(getModifiedProductsResponse.body).toHaveLength(1)
            expect((getModifiedProductsResponse.body)[0].quantity).toEqual(expectedValue)
        },30000)
        test("It should return a 404 error when model does't represents a Product in the database", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            const testChange = {
                quantity: 5,
                changeDate: "2024-02-01"
            }
            // new quantity should be 25
            const expectedValue = oldQuantity + testChange.quantity
            // Modify quantity, give wrong model
            const response = await request(app)
                .patch(`${routePath}/products/${product2.model}`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(404)
            expect(response.body.error).toBe("Product not found")
        },30000)
        test("It should return a 422 error when quantity is 0", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            // Quantity is 0
            const testChange = {
                quantity: 0,
                changeDate: "2024-02-01"
            }
            // new quantity should be 25
            const expectedValue = oldQuantity + testChange.quantity
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(422)
            expect(response.body.message).toBe('Invalid quantity: It must be a number greater than 0')

        },30000)
        test("It should return a 422 error when quantity is not a number", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            // Quantity is 0
            const testChange = {
                quantity: "2",
                changeDate: "2024-02-01"
            }
            // new quantity should be 25
            const expectedValue = oldQuantity + testChange.quantity
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(422)
            expect(response.body.message).toBe('Invalid quantity: It must be a number greater than 0')
        },30000)
        test("It should return a 422 error when changeDate format is not correct", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            // Invalid changeDate format
            const testChange = {
                quantity: 5,
                changeDate: "2024/02/01"
            }
            // new quantity should be 25
            const expectedValue = oldQuantity + testChange.quantity
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(422)
            expect(response.body.message).toBe('Invalid changeDate: It must be a valid date in the format YYYY-MM-DD, not after the current date, and after the arrival date of the product')
        },30000)
        test("It should return a 422 error when changeDate is after current date", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            // Change Date after current date
            const testChange = {
                quantity: 5,
                changeDate: "2025-02-01"
            }
            // new quantity should be 25
            const expectedValue = oldQuantity + testChange.quantity
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(422)
            expect(response.body.message).toBe('Invalid changeDate: It must be a valid date in the format YYYY-MM-DD, not after the current date, and after the arrival date of the product')
        },30000)
        test("It should return a 400 error when changeDate is before arrival date", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            // Change Date after current date
            const testChange = {
                quantity: 5,
                changeDate: "2022-02-01"
            }
            // new quantity should be 25
            const expectedValue = oldQuantity + testChange.quantity
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Change date cannot be before the arrival date.')
        },30000)
        test("It should return a 401 error code if user is not Admin or manager", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            const testChange = {
                quantity: 5,
                changeDate: "2024-02-01"
            }
            // new quantity should be 25
            const expectedValue = oldQuantity + testChange.quantity
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}`)
                .set("Cookie", customerCookie)
                .send(testChange);
            expect(response.status).toBe(401)

        },30000)
    })
    describe("PATCH /:model/sell", () => {
        test("it should record a product's sale, reducing its quantity in the stock by a specified amount(Manager)", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            const testChange = {
                sellingDate: "2024-02-01",
                quantity: 5
            }
            // new quantity should be 25
            const expectedValue = oldQuantity - testChange.quantity
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}/sell`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(200)
            expect(response.body).toEqual({ quantity: expectedValue })

            // Verify that the product have been registered
            const getModifiedProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getModifiedProductsResponse.status).toBe(200)
            expect(getModifiedProductsResponse.body).toHaveLength(1)
            expect((getModifiedProductsResponse.body)[0].quantity).toEqual(expectedValue)
        },30000)
        test("it should record a product's sale, reducing its quantity in the stock by a specified amount(Admin)", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            const testChange = {
                sellingDate: "2024-02-01",
                quantity: 5
            }
            // new quantity should be 25
            const expectedValue = oldQuantity - testChange.quantity
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}/sell`)
                .set("Cookie", adminCookie)
                .send(testChange);
            expect(response.status).toBe(200)
            expect(response.body).toEqual({ quantity: expectedValue })

            // Verify that the product have been registered
            const getModifiedProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getModifiedProductsResponse.status).toBe(200)
            expect(getModifiedProductsResponse.body).toHaveLength(1)
            expect((getModifiedProductsResponse.body)[0].quantity).toEqual(expectedValue)
        },30000)
        test("It should return a 404 error when model does't represents a Product in the database", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            const testChange = {
                quantity: 5,
                sellingDate: "2024-02-01"
            }
            // new quantity should be 25
            const expectedValue = oldQuantity - testChange.quantity
            // Modify quantity, give wrong model
            const response = await request(app)
                .patch(`${routePath}/products/${product2.model}/sell`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(404)
            expect(response.body.error).toBe("Product not found")
        },30000)
        test("It should return a 422 error when quantity is 0", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            // Quantity is 0
            const testChange = {
                quantity: 0,
                sellingDate: "2024-02-01"
            }
            // new quantity should be 25
            const expectedValue = oldQuantity - testChange.quantity
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}/sell`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(422)
            expect(response.body.message).toBe('Invalid quantity: It must be a number greater than 0')

        },30000)
        test("It should return a 422 error when quantity is not a number", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            // Quantity is 0
            const testChange = {
                quantity: "2",
                changeDate: "2024-02-01"
            }
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}/sell`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(422)
            expect(response.body.message).toBe('Invalid quantity: It must be a number greater than 0')
        },30000)
        test("It should return a 422 error when sellingDate format is not correct", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            // Invalid changeDate format
            const testChange = {
                quantity: 5,
                sellingDate: "2024/02/01"
            }
            // new quantity should be 25
            const expectedValue = oldQuantity - testChange.quantity
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}/sell`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(422)
            expect(response.body.message).toBe('Invalid sellingDate: It must be a valid date in the format YYYY-MM-DD')
        },30000)
        test("It should return a 422 error when sellingDate is after current date", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            // Change Date after current date
            const testChange = {
                quantity: 5,
                sellingDate: "2025-02-01"
            }
            // new quantity should be 25
            const expectedValue = oldQuantity - testChange.quantity
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}/sell`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(422)
            expect(response.body.message).toBe('Invalid sellingDate: It must be a valid date in the format YYYY-MM-DD, not after the current date, and after the arrival date of the product')
        },30000)
        test("It should return a 400 error when sellingDate is before arrival date", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            // Change Date after current date
            const testChange = {
                quantity: 5,
                sellingDate: "2022-02-01"
            }
            // new quantity should be 25
            const expectedValue = oldQuantity + testChange.quantity
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}/sell`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Change date cannot be before the arrival date.')
        },30000)
        test("It should return a 401 error code if user is not Admin or manager", async () => {
            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            expect(registerProduct.status).toBe(200);
            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            const oldQuantity = getProductsResponse.body[0].quantity;
            const testChange = {
                quantity: 5,
                sellingDate: "2024-02-01"
            }
            // new quantity should be 25
            const expectedValue = oldQuantity - testChange.quantity
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}/sell`)
                .set("Cookie", customerCookie)
                .send(testChange);
            expect(response.status).toBe(401)
        },30000)
        test("It should return a 409 error if model represents a product whose available quantity is 0", async () => {
            // Test product 
            const testProduct = {
                model: "Model",
                category: "Smartphone",
                quantity: 1,
                details: "Details of Product 1",
                sellingPrice: 100,
                arrivalDate: "2023-01-01",
            };

            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(testProduct)
            //console.log(registerProduct.body)
            expect(registerProduct.status).toBe(200);

            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: testProduct.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)

            // Call first a sellProduct so that the quantity goes to 0
            const sellSoQuantityGoesToZero = await request(app)
                .patch(`${routePath}/products/${testProduct.model}/sell`)
                .set("Cookie", managerCookie)
                .send({ sellingDate: "2024-01-01", quantity: 1 });
            expect(sellSoQuantityGoesToZero.status).toBe(200)
            expect(sellSoQuantityGoesToZero.body).toEqual({ quantity: 0 })

            const testChange = {
                sellingDate: "2024-02-01",
                quantity: 5
            }
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${testProduct.model}/sell`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(409)
            expect(response.body.error).toEqual("Product stock is empty")

        },30000)

        test("It should return a 409 error if the available quantity of model is lower than the requested quantity", async () => {

            // Register products 
            const registerProduct = await request(app)
                .post(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .send(product1)
            //console.log(registerProduct.body)
            expect(registerProduct.status).toBe(200);

            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200)
            expect(getProductsResponse.body).toHaveLength(1)


            const testChange = {
                sellingDate: "2024-02-01",
                quantity: 50
            }
            // Modify quantity
            const response = await request(app)
                .patch(`${routePath}/products/${product1.model}/sell`)
                .set("Cookie", managerCookie)
                .send(testChange);
            expect(response.status).toBe(409)
            expect(response.body.error).toEqual("Product stock cannot satisfy the requested quantity")

        },30000)
    })

    describe("DELETE /products/:model", () => {
        test("Admin can delete a product", async () => {
            // Register products 
            await productController.registerProducts(product1.model, product1.category, product1.quantity, product1.details, product1.sellingPrice, product1.arrivalDate);

            //rimuovi prodotto
            const response = await request(app)
                .delete(`${routePath}/products/${product1.model}`)
                .set("Cookie", adminCookie);

            expect(response.status).toBe(200);

            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(404);
        },30000);
        test("Manager can delete a product", async () => {
            // Register products 
            await productController.registerProducts(product1.model, product1.category, product1.quantity, product1.details, product1.sellingPrice, product1.arrivalDate);

            //rimuovi prodotto
            const response = await request(app)
                .delete(`${routePath}/products/${product1.model}`)
                .set("Cookie", managerCookie);

            expect(response.status).toBe(200);

            // Verify that the product have been registered
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(404);
        },30000);

        test("Customer cannot delete a product", async () => {
            await productController.registerProducts(product1.model, product1.category, product1.quantity, product1.details, product1.sellingPrice, product1.arrivalDate);
            const response = await request(app)
                .delete(`${routePath}/products/${product1.model}`)
                .set("Cookie", customerCookie);
    
            expect(response.status).toBe(401);
            const getProductsResponse = await request(app)
                .get(`${routePath}/products`)
                .set("Cookie", managerCookie)
                .query({ grouping: 'model', category: null, model: product1.model });
            expect(getProductsResponse.status).toBe(200);
        },30000);
        test("Unauthenticated user cannot delete a product", async () => {
            await productController.registerProducts(product1.model, product1.category, product1.quantity, product1.details, product1.sellingPrice, product1.arrivalDate);
            const response = await request(app)
                .delete(`${routePath}/products/${product1.model}`);
    
            expect(response.status).toBe(401);
        },30000);

        test("Error when trying to delete a non-existent product", async () => {
            const response = await request(app)
                .delete(`${routePath}/products/NonExistentModel`)
                .set("Cookie", adminCookie);
    
            expect(response.status).toBe(404);
        },30000);
     

    })


})