import { describe, test, expect, afterEach, afterAll,beforeEach,beforeAll } from "@jest/globals";
import request from 'supertest';
import { app } from "../../index";

import db from "../../src/db/db";
import crypto from "crypto";
import { Role } from "../../src/components/user";
import { cleanup } from "../../src/db/cleanup";



const routePath = "/ezelectronics"; // Base route path for the API

// Default user information. We use them to create users and evaluate the returned values
const customer = { username: "Customer", name: "Customer", surname: "Customer", password: "Customer", role: "Customer" };
const admin = { username: "Admin", name: "Admin", surname: "Admin", password: "Admin", role: "Admin" };
// Cookies for the users. We use them to keep users logged in. Creating them once and saving them in variables outside of the tests will make cookies reusable
let customerCookie: string;
let adminCookie: string;
//inserisce un utente del tipo { username: "Admin", name: "Admin", surname: "Admin", password: "Admin", role: "Admin" } non considernado salt,addres birthdate..;
const insertUser = async (userType: any) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const hashedPassword = crypto.scryptSync(userType, salt, 16);

    await new Promise<void>((resolve, reject) => {
        db.run("DELETE FROM users WHERE username = ?", [userType], (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });

    await new Promise<void>((resolve, reject) => {
        db.run("INSERT INTO users (username, name, surname, role, password, salt, address, birthdate) VALUES (?,?,?,?,?,?,NULL,NULL)", [userType, userType, userType, userType, hashedPassword, salt], (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};

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

const postUser = async (userInfo: any) => {
    const response=await request(app)
        .post(`${routePath}/users/`)
        .send(userInfo)
        expect(response.status).toBe(200)
};


beforeEach(async () => {
    await insertUser(Role.ADMIN);
    adminCookie = await login({ username: "Admin", password: "Admin" });
},20000);
    // After each tests, we remove everything from our test database
    afterEach(async () => {
        await cleanup();
    },20000);
    // After executing tests, we remove everything from our test database
    
    afterAll(async () => {
        await cleanup();
    });

    beforeAll(async () => {
        await cleanup();
    });

// Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable


// A 'describe' block is a way to group tests. It can be used to group tests that are related to the same functionality
// In this example, tests are for the user routes
// Inner 'describe' blocks define tests for each route
describe("User routes integration tests", () => {


    describe("Update user information Route ", () => {
        
        test("Updates user information successfully", async () => {
            const updatedUser = {
                username: "Admin",
                name: "admin",
                surname: "admin",
                role: Role.ADMIN,
                address: "Corso Duca degli Abruzzi 129, Torino",
                birthdate: "1970-01-01"
            };

            const response = await request(app)
                .patch(`${routePath}/users/${admin.username}`)
                .set("Cookie", adminCookie)
                .send({ name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "1970-01-01"});

        

            expect(response.status).toBe(200);
            expect(response.body).toEqual(updatedUser);
        });

        test("Returns 404 error when username does not exist", async () => {
            const response = await request(app)
                .patch(`${routePath}/users/NonExistentUser`)
                .set("Cookie", adminCookie)
                .send({ name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "1970-01-01" });

            expect(response.status).toBe(404);
        });

        test("Returns 401 error when user is not logged in", async () => {
            const response = await request(app)
                .patch(`${routePath}/users/${admin.username}`)
                .send({ name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "1970-01-01" });

            expect(response.status).toBe(401);
        });

        test("Returns 400 error when birthdate is after the current date", async () => {
            const response = await request(app)
                .patch(`${routePath}/users/${admin.username}`)
                .set("Cookie", adminCookie)
                .send({ name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "2050-01-01" });

            expect(response.status).toBe(400);
        });

        test("Returns 401 error when non-admin user tries to update another user's information", async () => {
            const customer = { username: "User", name: "user", surname: "user", password: "user", role: Role.CUSTOMER };
            await postUser(customer);
            const customerCookie = await login({ username: customer.username, password: customer.password });

            const response = await request(app)
                .patch(`${routePath}/users/AnotherUser`)
                .set("Cookie", customerCookie)
                .send({ name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "1970-01-01" });

            expect(response.status).toBe(401);
        });
    });


    describe("User Route Tests", () => {
            
        test("Retrieves user information successfully for Admin", async () => {
            const response = await request(app)
                .get(`${routePath}/users/${admin.username}`)
                .set("Cookie", adminCookie);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                username: "Admin",
                name: "Admin",
                surname: "Admin",
                role: Role.ADMIN,
                address: null,
                birthdate: null
            });
        });

        test("Retrieves own user information successfully for non-Admin user", async () => {
            const customer = { username: "RegularUser", name: "John", surname: "Doe", password: "password", role: Role.CUSTOMER };
            await postUser(customer);
            const customerCookie = await login({ username: customer.username, password: customer.password });

            const response = await request(app)
                .get(`${routePath}/users/RegularUser`)
                .set("Cookie", customerCookie);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                username: "RegularUser",
                name: "John",
                surname: "Doe",
                role: Role.CUSTOMER,
                address: null,
                birthdate: null
            });
        });

        test("Returns 404 error when user does not exist", async () => {
            const response = await request(app)
                .get(`${routePath}/users/NonExistingUser`)
                .set("Cookie", adminCookie);

            expect(response.status).toBe(404);
        });


        test("Returns 401 error when non-Admin user attempts to retrieve another user's information", async () => {
            const customer = { username: "RegularUser", name: "John", surname: "Doe", password: "password", role: Role.CUSTOMER };
            await postUser(customer);
            const customerCookie = await login({ username: customer.username, password: customer.password });

            const anotherUser = { username: "AnotherUser", name: "Jane", surname: "Smith", password: "password123", role: Role.CUSTOMER };
            await postUser(anotherUser);

            const response = await request(app)
                .get(`${routePath}/users/${anotherUser.username}`)
                .set("Cookie", customerCookie);

            expect(response.status).toBe(401);
        });
    });

    describe("Logout Route Tests", () => {

        


        test("Returns 200 when user logs out successfully", async () => {
            const response = await request(app)
                .delete(`${routePath}/sessions/current`)
                .set("Cookie", adminCookie);

            expect(response.status).toBe(200);
        });

        test("Returns 401 error if the user is not logged in", async () => {
            const response = await request(app)
                .delete(`${routePath}/sessions/current`);

            expect(response.status).toBe(401);
        });

    
    });
   
    describe("POST /users", () => {
        // A 'test' block is a single test. It should be a single logical unit of testing for a specific functionality and use case (e.g. correct behavior, error handling, authentication checks)
        test("It should return a 200 success code and create a new user", async () => {
            // A 'request' function is used to send a request to the server. It is similar to the 'fetch' function in the browser
            // It executes an API call to the specified route, similarly to how the client does it
            // It is an actual call, with no mocking, so it tests the real behavior of the server
            // Route calls are asynchronous operations, so we need to use 'await' to wait for the response
           const response= await request(app)
                .post(`${routePath}/users`) // The route path is specified here. Other operation types can be defined with similar blocks (e.g. 'get', 'patch', 'delete'). Route and query parameters can be added to the path
                .send(customer) // In case of a POST request, the data is sent in the body of the request. It is specified with the 'send' block. The data sent should be consistent with the API specifications in terms of names and types
                expect(response.status).toBe(200) // The 'expect' block is used to check the response status code. We expect a 200 status code for a successful operation
            // After the request is sent, we can add additional checks to verify the operation, since we need to be sure that the user is present in the database
            // A possible way is retrieving all users and looking for the user we just created.
            const users = await request(app) // It is possible to assign the response to a variable and use it later. 
                .get(`${routePath}/users`)
                .set("Cookie", adminCookie) // Authentication is specified with the 'set' block. Adding a cookie to the request will allow authentication (if the cookie has been created with the correct login route). Without this cookie, the request will be unauthorized
            expect(users.body).toHaveLength(2); // Since we know that the database was empty at the beginning of our tests and we created two users (an Admin before starting and a Customer in this test), the array should contain only two users
            let cust = users.body.find((user: any) => user.username === customer.username); // We look for the user we created in the array of users
            expect(cust).toBeDefined(); // We expect the user we have created to exist in the array. The parameter should also be equal to those we have sent
            expect(cust.name).toBe(customer.name);
            expect(cust.surname).toBe(customer.surname);
            expect(cust.role).toBe(customer.role);
        });

        test("It should return a 409 error when username represents a user that is already in the database", async () => {          
            //user admin is created at the begining of database  
            const response= await request(app)
                .post(`${routePath}/users`) 
                .send(admin)
                expect(response.status).toBe(409)
                const users = await request(app) // It is possible to assign the response to a variable and use it later. 
                .get(`${routePath}/users`)
                .set("Cookie", adminCookie) // Authentication is specified with the 'set' block. Adding a cookie to the request will allow authentication (if the cookie has been created with the correct login route). Without this cookie, the request will be unauthorized
            expect(users.body.filter((user: any)=>user.username==="Admin")).toHaveLength(1);//cutomer crato con il primo test e admin

        });

        

        // Tests for error conditions can be added in separate 'test' blocks.
        // We can group together tests for the same condition, no need to create a test for each body parameter, for example
        test("It should return a 422 error code if username is empty", async () => {
            const incustomer = { ...customer, username: "" };
            const response = await request(app).post(`${routePath}/users`).send(incustomer);
            expect(response.status).toBe(422);
        });
         test("It should return a 422 error code if username is not a string", async () => {
            const incustomer = { ...customer, username: 1 };
            const response = await request(app).post(`${routePath}/users`).send(incustomer);
            expect(response.status).toBe(422);
        });
    
    
        test("It should return a 422 error code if name is empty", async () => {
            const incustomer = { ...customer, name: "" };
            const response = await request(app).post(`${routePath}/users`).send(incustomer);
            expect(response.status).toBe(422);
        });
        test("It should return a 422 error code if name is not a string", async () => {
            const incustomer = { ...customer, name: 1 };
            const response = await request(app).post(`${routePath}/users`).send(incustomer);
            expect(response.status).toBe(422);
        });
    
    
        test("It should return a 422 error code if surname is empty", async () => {
            const incustomer = { ...customer, surname: "" };
            const response = await request(app).post(`${routePath}/users`).send(incustomer);
            expect(response.status).toBe(422);
        });
        test("It should return a 422 error code if surname is not a string", async () => {
            const incustomer = { ...customer, surname: 1 };
            const response = await request(app).post(`${routePath}/users`).send(incustomer);
            expect(response.status).toBe(422);
        });
    
        test("It should return a 422 error code if password is empty", async () => {
            const incustomer = { ...customer, password: "" };
            const response = await request(app).post(`${routePath}/users`).send(incustomer);
            expect(response.status).toBe(422);
        });
        test("It should return a 422 error code if password is not a string", async () => {
            const incustomer = { ...customer, password: 1 };
            const response = await request(app).post(`${routePath}/users`).send(incustomer);
            expect(response.status).toBe(422);
        });
    
        test("It should return a 422 error code if the role is not one of the allowed values", async () => {
            const invalidRoles = ["InvalidRole", "User", "Guest"]; // Esempi di ruoli non validi
            for (const invalidRole of invalidRoles) {
                const incustomer = { ...customer, role: invalidRole }; // Crea un oggetto utente con un ruolo non valido
                const response = await request(app).post(`${routePath}/users`).send(incustomer);
                expect(response.status).toBe(422);
            }
        });
    });

    describe("GET /users", () => {
        test("It should return an array of users", async () => {
            //add another user, customer
            const response= await request(app)
                .post(`${routePath}/users`) 
                .send(customer) 
                expect(response.status).toBe(200) 

            const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie).expect(200);
            //the administrator created at the beginning of the test and the customer
            expect(users.body).toHaveLength(2);
            let cust = users.body.find((user: any) => user.username === customer.username);
            expect(cust).toBeDefined();
            expect(cust.name).toBe(customer.name);
            expect(cust.surname).toBe(customer.surname);
            expect(cust.role).toBe(customer.role);
            let adm = users.body.find((user: any) => user.username === admin.username);
            expect(adm).toBeDefined();
            expect(adm.name).toBe(admin.name);
            expect(adm.surname).toBe(admin.surname);
            expect(adm.role).toBe(admin.role);
        });
        
 
        test("It should return a 401 error code if the user is not an Admin", async () => {
            const response= await request(app)
                .post(`${routePath}/users`) 
                .send(customer) 
            customerCookie = await login(customer);
            await request(app).get(`${routePath}/users`).set("Cookie", customerCookie).expect(401); // We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
        });
    });

    describe("GET /users/roles/:role", () => {
        test("It should return an array of users with a specific role", async () => {
            // Route parameters are set in this way by placing directly the value in the path
            // It is not possible to send an empty value for the role (/users/roles/ will not be recognized as an existing route, it will return 404)
            // Empty route parameters cannot be tested in this way, but there should be a validation block for them in the route
            const admins = await request(app).get(`${routePath}/users/roles/Admin`).set("Cookie", adminCookie).expect(200);
            expect(admins.body).toHaveLength(1); // In this case, we expect only one Admin user to be returned
            let adm = admins.body[0];
            expect(adm.username).toBe(admin.username);
            expect(adm.name).toBe(admin.name);
            expect(adm.surname).toBe(admin.surname);
        });

        test("It should return a 422 error code if the role is not valid", async () => {
            // Invalid route parameters can be sent and tested in this way. The 'expect' block should contain the corresponding code
            await request(app).get(`${routePath}/users/roles/Invalid`).set("Cookie", adminCookie).expect(422);
        });

        test("It should return a 401 error code if the user is not an Admin", async () => {
            const response= await request(app)
                .post(`${routePath}/users`) // The route path is specified here. Other operation types can be defined with similar blocks (e.g. 'get', 'patch', 'delete'). Route and query parameters can be added to the path
                .send(customer) // In case of a POST request, the data is sent in the body of the request. It is specified with the 'send' block. The data sent should be consistent with the API specifications in terms of names and types
                expect(response.status).toBe(200) 
            customerCookie = await login(customer);
            await request(app).get(`${routePath}/users/roles/Admin`).set("Cookie", customerCookie).expect(401); // We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
        });
    });

    describe("DELETE /users/:username",()=>{
        test("It should delete a user and return a 200 status code, if the logged in user is also the user that we are trying to eliminate(Admin version)", async ()=>{
            //create a admin
            const admin_2 = { username: "Admin2", name: "Admin2", surname: "Admin2", password: "Admin2", role: "Admin" };
            await request(app).post(`${routePath}/users`).send(admin_2).expect(200);
            //logged in admin
            const adminCookie2 = await login(admin_2);
            //admin try to eliminate himself
            const response = await request(app).delete(`${routePath}/users/${admin_2.username}`).set("Cookie", adminCookie2);
            expect(response.status).toBe(200);
            const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie);
            //there is only the admin the was carted in the beforeEach
            expect(users.body).toHaveLength(1);
        });
        test("It should delete a user and return a 200 status code, if the logged in user is an admin and the the user he want to eliminate is not an Admin", async () => {
            //create a cutomer
            await request(app).post(`${routePath}/users`).send(customer).expect(200);
            //admin created in the beforeEach, try to delete the customer
            const response = await request(app).delete(`${routePath}/users/${customer.username}`).set("Cookie", adminCookie);
            expect(response.status).toBe(200);

            const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie);
            expect(users.body).toHaveLength(1);
        });

        test("It should delete a user and return a 200 status code, if the logged in user is also the user that we are trying to eliminate(generic user version)", async ()=>{
                //create a cutomer
                await request(app).post(`${routePath}/users`).send(customer).expect(200);
                //admin created in the beforeEach, try to delete the customer
                customerCookie = await login(customer);
                const response = await request(app).delete(`${routePath}/users/${customer.username}`).set("Cookie", customerCookie);
                expect(response.status).toBe(200);
                const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie);
            //there is only the admin the was carted in the beforeEach
                expect(users.body).toHaveLength(1);
        });
       

        test("It should return a 404 error if the user does not exist", async () => {
            const response = await request(app).delete(`${routePath}/users/NonExistentUser`).set("Cookie", adminCookie);
            expect(response.status).toBe(404);
        });
        test("It should return a 401 error if a non-Admin user tries to delete another user", async () => {
            await request(app).post(`${routePath}/users`).send(customer).expect(200);
            customerCookie = await login(customer);
            const response = await request(app).delete(`${routePath}/users/${admin.username}`).set("Cookie", customerCookie);
            expect(response.status).toBe(401);
        });
        test("It should return a 401 error if a Admin user tries to delete another Admin user", async () => {
            //new admin, that we want to elimnate
            const admin_2 = { username: "Admin2", name: "Admin2", surname: "Admin2", password: "Admin2", role: "Admin" };
            await request(app).post(`${routePath}/users`).send(admin_2).expect(200);
            //admin logged in try to eliminate another admin
            const response = await request(app).delete(`${routePath}/users/${admin_2.username}`).set("Cookie", adminCookie);
            expect(response.status).toBe(401);
        });
        test("it should return a 401 error if the user is not logged in",async ()=>{
            const response = await request(app).delete(`${routePath}/users/customer`);
            expect(response.status).toBe(401);

        });

    });

    describe("DELETE /users",()=>{
        test("It should delete all non-Admin users if called by an Admin", async () => {
            await request(app).post(`${routePath}/users`).send(customer).expect(200);
            const response = await request(app).delete(`${routePath}/users`).set("Cookie", adminCookie);
            expect(response.status).toBe(200);

            const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie);
            expect(users.body).toHaveLength(1);
            expect(users.body[0].role).toBe("Admin");
        });
        test("It should return a 401 error if called by a non-Admin user", async () => {
            await request(app).post(`${routePath}/users`).send(customer).expect(200);
            customerCookie = await login(customer);
            const response = await request(app).delete(`${routePath}/users`).set("Cookie", customerCookie);
            expect(response.status).toBe(401);
        });
        test("It should return a 401 error if the user is not logged-in", async () => {
            const response = await request(app).delete(`${routePath}/users`)
            expect(response.status).toBe(401);
        });


    });
    
});
describe("AuthRoutes Unit Tests",()=>{

    describe("POST /sessions",()=>{
        //admin user is carted in the beforeEach
        test("It should log in a user with correct credentials", async () => {
            await request(app).post(`${routePath}/users`).send(customer).expect(200);
            const response = await request(app).post(`${routePath}/sessions`).send({ username: "Customer", password: "Customer" });
            expect(response.status).toBe(200);
            expect(response.body.username).toBe(customer.username);
        });
        test("It should return a 401 error if the username does not exist", async () => {
            const response = await request(app).post(`${routePath}/sessions`).send({ username: "NonExistent", password: "Admin" });
            expect(response.status).toBe(401);
        });

        test("It should return a 401 error if the password provided does not match the one in the database", async () => {
            const response = await request(app).post(`${routePath}/sessions`).send({ username: "Admin", password: "WrongPassword" });
            expect(response.status).toBe(401);
        });
        test("It should return a 422 error if the username is empty", async () => {
            const response = await request(app).post(`${routePath}/sessions`).send({ username: "", password: "Admin" });
            expect(response.status).toBe(422);
        });
        test("It should return a 422 error if the password is not a string", async () => {
            const response = await request(app).post(`${routePath}/sessions`).send({ username: "Admin", password: 1 });
            expect(response.status).toBe(422);
        });

    })

    describe("DELETE /sessions/current",()=>{
        test("It should log out the current user and clear the cookie", async () => {
            const response = await request(app).delete(`${routePath}/sessions/current`).set("Cookie", adminCookie);
            expect(response.status).toBe(200);
            const loginCheck = await request(app).get(`${routePath}/sessions/current`).set("Cookie", adminCookie);
            expect(loginCheck.status).toBe(401);
        });
        test("It should return a 401 error if no user is logged in", async () => {
            const response = await request(app).delete(`${routePath}/sessions/current`);
            expect(response.status).toBe(401);
        });

    })
    describe("GET /sessions/current",  ()=>{
        test("It should return the currently logged-in user", async () => {
            const response = await request(app).get(`${routePath}/sessions/current`).set("Cookie", adminCookie);
            expect(response.status).toBe(200);
            expect(response.body.username).toBe(admin.username);
        });
        test("It should return a 401 error if no user is logged in", async () => {
            const response = await request(app).get(`${routePath}/sessions/current`);
            expect(response.status).toBe(401);
        });

    })

})



