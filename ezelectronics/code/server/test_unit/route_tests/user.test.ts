import { test, expect, jest, describe, beforeEach, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import UserController from "../../src/controllers/userController"
import { Role, User } from "../../src/components/user"
import ErrorHandler from "../../src/helper"
import { UnauthorizedUserError, UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError"
import Authenticator from "../../src/routers/auth"
import { DateError, Utility } from "../../src/utilities"


const baseURL = "/ezelectronics"
const sessionsURL = "/ezelectronics/sessions";


// Mock dependencies
jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")




let testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "")
let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "")



describe("User routes Unit Tests", () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    },20000);
    afterEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    },20000);

    describe("User updates user information", () => {

        test("Updates user information successfully", async () => {
            const username = "Admin";
            const updatedUser = {
                username: "Admin",
                name: "admin",
                surname: "admin",
                role: Role.MANAGER,
                address: "Corso Duca degli Abruzzi 129, Torino",
                birthdate: "1970-01-01"
            };
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = { username: "Admin", role: "Admin" };
                return next();
            });
    
            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValue(updatedUser);
    
            const response = await request(app)
                .patch(`${baseURL}/users/${username}`)
                .send({ name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "1970-01-01" });
    
            expect(response.status).toBe(200);
            expect(response.body).toEqual(updatedUser);
        });
    
        test("Returns 404 error when username does not exist", async () => {
            const username = "NonExistentUser";
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = { username: "Admin", role: "Admin" };
                return next();
            });
    
            jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValue(new UserNotFoundError());
    
            const response = await request(app)
                .patch(`${baseURL}/users/${username}`)
                .send({ name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "1970-01-01" });
    
            expect(response.status).toBe(404);
        });
    
        test("Returns 401 error when user is not logged in", async () => {
            const username = "Admin";
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user" });
            });
    
            const response = await request(app)
                .patch(`${baseURL}/users/${username}`)
                .send({ name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "1970-01-01" });
    
            expect(response.status).toBe(401);
        });
    
        test("Returns 400 error when birthdate is after the current date", async () => {
            const username = "Admin";
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = { username: "Admin", role: "Admin" };
                return next();
            });
    
            jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValue(new DateError());
    
            const response = await request(app)
                .patch(`${baseURL}/users/${username}`)
                .send({ name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "2050-01-01" });
    
            expect(response.status).toBe(400);
        });
    
        test("Returns 401 error when non-admin user tries to update another user's information", async () => {
            const username = "AnotherUser";
    
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
    
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = { username: "User", role: "Customer" };
                return next();
            });
    
            jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValue(new UnauthorizedUserError());
    
            const response = await request(app)
                .patch(`${baseURL}/users/${username}`)
                .send({ name: "admin", surname: "admin", address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "1970-01-01" });
    
            expect(response.status).toBe(401);
        });
        });
    
    describe("User Route Tests", () => {
    
            test("Retrieves user information successfully for Admin", async () => {
                const username = "Admin";
                const user = {
                    username: "Admin",
                    name: "admin",
                    surname: "admin",
                    role: Role.ADMIN,
                    address: '',
                    birthdate: ''
                };
        
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    req.user = { username: "Admin", role: "Admin" };
                    return next();
                });
        
                jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValue(user);
        
                const response = await request(app).get(`${baseURL}/users/${username}`);
        
                expect(response.status).toBe(200);
                expect(response.body).toEqual(user);
            });
        
            test("Retrieves own user information successfully for non-Admin user", async () => {
                const username = "RegularUser";
                const user = {
                    username: "RegularUser",
                    name: "John",
                    surname: "Doe",
                    role: Role.CUSTOMER,
                    address: "123 Main St",
                    birthdate: "1980-01-01"
                };
        
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    req.user = { username: "RegularUser", role: "Customer" };
                    return next();
                });
        
                jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValue(user);
        
                const response = await request(app).get(`${baseURL}/users/${username}`);
        
                expect(response.status).toBe(200);
                expect(response.body).toEqual(user);
            });
        
            test("Returns 404 error when user does not exist", async () => {
                const username = "NonExistingUser";
        
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    req.user = { username: "Admin", role: "Admin" };
                    return next();
                });
        
                jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValue(new UserNotFoundError());
        
                const response = await request(app).get(`${baseURL}/users/${username}`);
        
                expect(response.status).toBe(404);
            });
        
            test("Returns 401 error when non-Admin user attempts to retrieve another user's information", async () => {
                const username = "AnotherUser";
        
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    req.user = { username: "RegularUser", role: "Customer" };
                    return next();
                });
        
                jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValue(new UnauthorizedUserError());
        
                const response = await request(app).get(`${baseURL}/users/${username}`);
        
                expect(response.status).toBe(401);
            });
    });
        
    describe("Logout Route Tests", () => {
    
            test("Returns 200 when user logs out successfully", async () => {
                const inputUser = { username: "test", password:"password" };
    
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    req.user = { isAdmin: true }; // Assume che l'utente autenticato sia un amministratore
                    return next();
                });
    
    
                jest.spyOn(Authenticator.prototype, "logout").mockResolvedValueOnce(true);
    
                const response = await request(app).delete(`${sessionsURL}/current`);
                expect(response.status).toBe(200);
                expect(Authenticator.prototype.logout).toHaveBeenCalled();
            });
    
            test("Returns 401 error if the user is not logged in", async () => {
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    res.status(401).end();
                });
    
                const response = await request(app).delete(`${sessionsURL}/current`);
    
                expect(response.status).toBe(401);
            });
    
    
            test("It should return 503, logout failed due to server error", async () => {
                const inputUser = { username: "test", password:"m" };
            
                // Simula che l'utente sia loggato
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    // Imposta una fittizia informazione utente per indicare che l'utente è loggato
                    req.user = { isLoggedIn: true };
                    return next();
                });
            
                // Simula un errore durante il logout
                jest.spyOn(Authenticator.prototype, "logout").mockRejectedValueOnce(new Error("logout error"));
            
                // Effettua la richiesta di logout
                const response = await request(app).delete(`${sessionsURL}/current`);
            
                // Verifica che la risposta sia un codice di stato 401
                expect(response.status).toBe(503);
            
                // Verifica che il metodo logout sia stato chiamato
                expect(Authenticator.prototype.logout).toHaveBeenCalled();
            });
            
    });


    describe("POST /users", () => {

        test("It should return a 200 success code", async () => {
        const inputUser = { username: "test", name: "test", surname: "test", password: "test", role: Role.MANAGER }

            //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({
                        isLength: () => ({}),
                        isIn: () => ({})
                    }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true);
            const response = await request(app).post(baseURL + "/users").send(inputUser)
            expect(response.status).toBe(200)
            expect(UserController.prototype.createUser).toHaveBeenCalled()//Check if the createUser method has been called once
            //Check if the createUser method has been called with the correct parameters
            expect(UserController.prototype.createUser).toHaveBeenCalledWith(inputUser.username, inputUser.name, inputUser.surname, inputUser.password, inputUser.role)
        }); 

        test("It should return a 409 error when username represents a user that is already in the database", async () => {
        const inputUser = { username: "test", name: "test", surname: "test", password: "test", role: Role.MANAGER }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({
                        isLength: () => ({}),
                        isIn: () => ({})
                    }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))
            jest.spyOn(UserController.prototype, "createUser").mockRejectedValueOnce(new UserAlreadyExistsError());
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            const response = await request(app).post(baseURL + "/users").send(inputUser);
            expect(response.status).toBe(409);
            expect(UserController.prototype.createUser).toHaveBeenCalled();//Check if the createUser method has been called once
            expect(UserController.prototype.createUser).toHaveBeenCalledWith(inputUser.username, inputUser.name, inputUser.surname, inputUser.password, inputUser.role);

        });
        //It should return a 503 error when the createUser fail with a not know error
        test("It should return a 503 error when the createUser fail with a not know error", async () => {
            const inputUser = { username: "test", name: "test", surname: "test", password: "test", role: Role.MANAGER }
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({
                        isLength: () => ({}),
                        isIn: () => ({})
                    }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }))
            jest.spyOn(UserController.prototype, "createUser").mockRejectedValueOnce(new Error("General Error"));
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
            const response = await request(app).post(baseURL + "/users").send(inputUser);
            expect(response.status).toBe(503);
            expect(UserController.prototype.createUser).toHaveBeenCalled();//Check if the createUser method has been called once
            expect(UserController.prototype.createUser).toHaveBeenCalledWith(inputUser.username, inputUser.name, inputUser.surname, inputUser.password, inputUser.role);

        });

       
        test("It should fail with a 422 error if one of the params is not valid", async ()=>{
            const inputUser = { username: "test", name: "test", surname: "test", password: "test", role: ""}
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
                
            }));
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            });
            const response = await request(app).post(baseURL + "/users").send(inputUser);
            expect(response.status).toBe(422);
           
        });

    });
    describe("GET /users",()=>{
        test("It returns an array of users", async () => {
            //The route we are testing calls the getUsers method of the UserController and the isAdmin method of the Authenticator
            //We mock the 'getUsers' method to return an array of users, because we are not testing the UserController logic here (we assume it works correctly)
            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([testAdmin, testCustomer])
            
            //We mock the 'isAdmin' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            const response = await request(app).get(baseURL + "/users")
            expect(response.status).toBe(200)
            expect(UserController.prototype.getUsers).toHaveBeenCalled()
            expect(response.body).toEqual([testAdmin, testCustomer])
        });

        test("It should fail if the user is not an Admin or the user is not logged in", async () => {
            //In this case, we are testing the situation where the route returns an error code because the user is not an Admin
            //We mock the 'isAdmin' method to return a 401 error code, because we are not testing the Authenticator logic here (we assume it works correctly)
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            });
            //By calling the route with this mocked dependency, we expect the route to return a 401 error code
            const response = await request(app).get(baseURL + "/users")
            expect(response.status).toBe(401)
        });

        test("It should return a 503 error when the getUser fail with a not know error",async ()=>{
            jest.spyOn(Authenticator.prototype,"isAdmin").mockImplementation((req,res,next)=>next());
            //We mock the 'getUsers' method to return an error
            jest.spyOn(UserController.prototype, "getUsers").mockRejectedValueOnce(new Error("generic error"));
            const response = await request(app).get(baseURL + "/users")
            expect(response.status).toBe(503);

        });

    })
    describe("GET /users/roles/:role", ()=>{
        test("It returns an array of users with a specific role", async () => {
            //The route we are testing calls the getUsersByRole method of the UserController, the isAdmin method of the Authenticator, and the param method of the express-validator
            //We mock the 'getUsersByRole' method to return an array of users, because we are not testing the UserController logic here (we assume it works correctly)
            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce([testAdmin])
            //We mock the 'isAdmin' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isIn: () => ({}) }),
                })),
            }))
            //We call the route with the mocked dependencies. We expect the 'getUsersByRole' function to have been called, the route to return a 200 success code and the expected array
            const response = await request(app).get(baseURL + "/users/roles/Admin")
            expect(response.status).toBe(200)
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalled()
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith("Admin")
            expect(response.body).toEqual([testAdmin])
        });
        
        test("It should fail if the user is not an Admin or the user is not loggedin", async () => {
            //In this case, we are testing the situation where the route returns an error code because the user is not an Admin
            //We mock the 'isAdmin' method to return a 401 error code, because we are not testing the Authenticator logic here (we assume it works correctly)
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })
            //By calling the route with this mocked dependency, we expect the route to return a 401 error code
            const response = await request(app).get(baseURL + "/users/roles/Admin")
            expect(response.status).toBe(401)
        });
        test("It should fail with a 422 error if one of the params is not valid",async ()=>{
            jest.spyOn(Authenticator.prototype,"isAdmin").mockImplementation((rew,res,next)=>next());
            //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));
            //We mock the 'validateRequest' method to receive an error and return a 422 error code, because we are not testing the validation logic here (we assume it works correctly)
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })
            //We call the route with dependencies mocked to simulate an error scenario, and expect a 422 code
            const response = await request(app).get(baseURL + "/users/roles/Invalid")
            expect(response.status).toBe(422)
        });

        test("It should return a 503 error when the getUsersByRole fail with a not know error", async ()=>{
            jest.spyOn(Authenticator.prototype,"isAdmin").mockImplementation((rew,res,next)=>next());
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isIn: () => ({}) }),
                })),
            }));
            jest.spyOn(UserController.prototype,"getUsersByRole").mockRejectedValueOnce(new Error("generic error"));
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());

            const response=await request(app).get(baseURL+ "/users/roles/Customer");
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalled();
            expect(UserController.prototype.getUsersByRole).toBeCalledWith("Customer");
            expect(response.status).toBe(503);
        });
        
       describe("DELETE /users/:username",()=>{
        const username = "customer";
        test("It should delete a user and return a 200 status code, if the logged in user is an admin and the the user he want to eliminate is not an Admin",async ()=>{
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({isLength: () => ({})}),
                })),
            }))
            jest.spyOn(ErrorHandler.prototype,"validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementationOnce((req,res,next)=>{
                req.user=testAdmin
                return next();
            });
            jest.spyOn(UserController.prototype,"deleteUser").mockResolvedValueOnce(true);
            const response=await request(app).delete(baseURL+ "/users/customer");
            expect(UserController.prototype.deleteUser).toHaveBeenCalled();
            expect(UserController.prototype.deleteUser).toBeCalledWith(testAdmin,"customer");
            expect(response.status).toBe(200);
        });
        test("It should delete a user and return a 200 status code, if the logged in user is also the user that we are trying to eliminate",async ()=>{
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({isLength: () => ({})}),
                })),
            }))
            jest.spyOn(ErrorHandler.prototype,"validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementationOnce((req,res,next)=>{
                req.user=testCustomer
                return next();
            })
            jest.spyOn(UserController.prototype,"deleteUser").mockResolvedValueOnce(true);
            const response=await request(app).delete(baseURL+ `/users/${testCustomer.username}`);
            expect(UserController.prototype.deleteUser).toHaveBeenCalled();
            expect(UserController.prototype.deleteUser).toBeCalledWith(testCustomer,testCustomer.username);
            expect(response.status).toBe(200);
        });

        test("it should fail if the user is not logged in",async ()=>{
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user" });
            });
            const response= await request(app).delete(baseURL+ `/users/notloggedInUser`);
            expect(response.status).toBe(401)
        });
        
        test("it should return a 404 error when username represents a user that does not exist in the database",async ()=>{
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({isLength: () => ({})}),
                })),
            }))
            jest.spyOn(ErrorHandler.prototype,"validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementationOnce((req,res,next)=>{
                req.user=testAdmin;
                return next();
            })
            jest.spyOn(UserController.prototype,"deleteUser").mockRejectedValueOnce(new UserNotFoundError());
            const response=await request(app).delete(baseURL+ `/users/invalidUsername`);
            expect(UserController.prototype.deleteUser).toHaveBeenCalled();
            expect(UserController.prototype.deleteUser).toBeCalledWith(testAdmin,"invalidUsername");
            expect(response.status).toBe(404);
        });
        test("it should return a 401 error when the calling user is an Admin and username represents a different Admin user, username is not equal to the username of the logged user calling the route, and the user calling the route is not an Admin or the user is not logged in ",async ()=>{
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({isLength: () => ({})}),
                })),
            }))
            jest.spyOn(ErrorHandler.prototype,"validateRequest").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementationOnce((req,res,next)=>{
                req.user=testCustomer;
                return next();
            })
            jest.spyOn(UserController.prototype,"deleteUser").mockRejectedValueOnce(new UnauthorizedUserError());
            const response=await request(app).delete(baseURL+ `/users/invalidUsername`);
            expect(UserController.prototype.deleteUser).toHaveBeenCalled();
            expect(UserController.prototype.deleteUser).toBeCalledWith(testCustomer,"invalidUsername");
            expect(response.status).toBe(401);
        });

       });

       describe("DELETE /users",()=>{
        test("Deletes all non-Admin users from the database", async ()=>{
            jest.spyOn(Authenticator.prototype,"isAdmin").mockImplementation((rew,res,next)=>next());
            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true)
            const response=await request(app).delete(baseURL+ `/users`);
            expect(UserController.prototype.deleteAll).toHaveBeenCalled();
            expect(response.status).toBe(200)

        });
        test("It should return a 503 status if deleteAll fails with a generic error", async () => {
            // Mock isAdmin to always pass
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            });
        
            // Mock deleteAll to reject with an error
            jest.spyOn(UserController.prototype, "deleteAll").mockRejectedValueOnce(new Error("generic error"));
        
            const response = await request(app).delete(baseURL + "/users");
        
            expect(UserController.prototype.deleteAll).toHaveBeenCalled();
            expect(response.status).toBe(503);
        });
        test("It should fail if the user is not an Admin or the user in not logged in", async () => {
            //In this case, we are testing the situation where the route returns an error code because the user is not an Admin
            //We mock the 'isAdmin' method to return a 401 error code, because we are not testing the Authenticator logic here (we assume it works correctly)
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized" });
            })
            //By calling the route with this mocked dependency, we expect the route to return a 401 error code
            const response = await request(app).delete(baseURL + "/users")
            expect(response.status).toBe(401)
        });

       });



    });



});

describe("AuthRoutes Unit Tests", () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });
    afterEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });
    

    describe("POST /sessions", () => {
        test("It should return a 200 success code on login", async () => {
            const loginUser = { username: "test", password: "test" }
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({isLength: () => ({})}),
                })),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "login").mockResolvedValueOnce(new User("test", "test", "test", Role.CUSTOMER, "", ""))

            const response = await request(app).post(baseURL + "/sessions").send(loginUser)
            expect(Authenticator.prototype.login).toHaveBeenCalled();
            expect(response.status).toBe(200)
        });

        test("It should fail with a 401 error if the username does not exist or the password provided does not match the one in the database",async ()=>{
            const loginUser = { username: "test", password: "test" }
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({isLength: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next())
            jest.spyOn(Authenticator.prototype, "login").mockRejectedValueOnce(new Error("Unauthorized"))
            const response = await request(app).post(baseURL + "/sessions").send(loginUser)
            expect(Authenticator.prototype.login).toHaveBeenCalled();
            expect(response.status).toBe(401)

        });
        test("It should fail with a 422 error if one of the params is not valid",async ()=>{
            const loginUser = { username: "", password: "test" }
            jest.mock("express-validator",()=>({
                body:jest.fn().mockImplementation(()=>{throw new Error("Invalid value");})
            }));
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            });
            const response = await request(app).post(baseURL + "/sessions").send(loginUser)
            expect(response.status).toBe(422);
        });

    });

    describe("DELETE /sessions/current",()=>{
        test("It should return a 200 success code on logout", async ()=>{
            jest.spyOn(Authenticator.prototype, "logout").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementationOnce((req,res,next)=>{
                return next();
            });
            const response = await request(app).delete(baseURL + "/sessions/current")
            expect(response.status).toBe(200)
            expect(Authenticator.prototype.logout).toHaveBeenCalled();

        });
        test("It should fail with a 401 eroor code if the user calling the route is not logged in", async ()=>{
            jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementationOnce((req,res,next)=>{
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });
            const response = await request(app).delete(baseURL + "/sessions/current")
            expect(response.status).toBe(401)

        });
        test("It should fail if the logout fail", async ()=>{
            jest.spyOn(Authenticator.prototype, "logout").mockRejectedValue(new Error("Logout failed"))
            jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementationOnce((req,res,next)=>{
                return next();
            });
            const response = await request(app).delete(baseURL + "/sessions/current")
            expect(response.status).toBe(503)
            expect(Authenticator.prototype.logout).toHaveBeenCalled();

        });

    });

    describe("GET /sessions/current",  ()=>{
        test("It should return the currently logged in user", async () => {
            const loggedUser = new User("test", "test", "test", Role.CUSTOMER, "", "")

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = loggedUser;
                return next();
            })

            const response = await request(app).get(baseURL + "/sessions/current")
            expect(response.status).toBe(200)
            expect(response.body).toEqual(loggedUser)
        });
        test("It should fail with a 401 eroor code if the user calling the route is not logged in", async () => {

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            })
            const response = await request(app).get(baseURL + "/sessions/current")
            expect(response.status).toBe(401)
        });



    });





});


/*
test("It should return a 200 success code", async () => {
    const testUser = { //Define a test user object sent to the route
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    }
    jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
    const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
    expect(response.status).toBe(200) //Check if the response status is 200
    expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
    expect(UserController.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role)
})*/

