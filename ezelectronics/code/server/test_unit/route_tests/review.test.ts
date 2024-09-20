import { test, expect, jest, describe, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"


import Authenticator from "../../src/routers/auth"
import { Role, User } from "../../src/components/user"
import ErrorHandler from "../../src/helper"
import ReviewController from "../../src/controllers/reviewController"
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"
import { ProductNotFoundError } from "../../src/errors/productError"
import { ProductReview } from "../../src/components/review";


const baseURL = "/ezelectronics"


// mock the review controller and the auth
jest.mock('../../src/controllers/reviewController');
jest.mock('../../src/routers/auth')

let testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
let testManager = new User('manager', 'manager', 'manager', Role.MANAGER, '', '');

describe("Reviews routes unit tests", () => {

    beforeEach(() => {
        jest.resetAllMocks()
        jest.restoreAllMocks()
    },20000);
      
    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
    },20000);

    describe("GET /reviews/:model",()=> {
        test("Returns 200 and the correct reviews for a valid product model", async () => {

            const model = "iPhone13";
            const reviews = [
                new ProductReview(model, "Mario Rossi", 5, "2024-05-02", "A very cool smartphone!")
            ];
    
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
    
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
    
            jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValue(reviews);
    
            const response = await request(app).get(baseURL + `/reviews/${model}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(reviews);
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(model);
    
            
    
        });
    
        test("Returns 404 when reviews for a non-existing product model are requested", async () => {
            const model = "NonExistingModel";
    
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
    
            jest.spyOn(ReviewController.prototype, "getProductReviews").mockRejectedValue(new ProductNotFoundError());
    
            const response = await request(app).get(baseURL + `/reviews/${model}`);
            expect(response.status).toBe(404);
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(model);
    
            
        });
    
    
        test("Returns 401 error when the user is not authenticated", async () => {
            const model = "iPhone13";
        
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
        
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                res.status(401).send({ error: "Unauthorized" });
            });
        
            const response = await request(app).get(baseURL + `/reviews/${model}`);
            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Unauthorized" });
        });


    })
    describe("POST /reviews/:model", () => {        

        test("It should return a 200 success code when the review is successfully added", async () => {
            
            const inputParams = {
                score: 3,
                comment: 'commento'
            }

            const inputReview = {
                model: 'modello0',
                user: testCustomer,
                inputParams
            }

            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce(); // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            // express-validator mock
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    notEmpty: () => ({}),
                    isInt: () => ({}),
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({ isString: () => ({}) })
                }))
            }))

            const response = await request(app).post(baseURL + '/reviews/modello0').send(inputReview.inputParams);
            expect(response.status).toBe(200);
            expect(ReviewController.prototype.addReview).toHaveBeenCalled()
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(inputReview.model, inputReview.user, inputReview.inputParams.score, inputReview.inputParams.comment)
        })

        test("It should return a 409 error code when there is already a review for the product from that user", async () => {
            
            const inputParams = {
                score: 3,
                comment: 'commento'
            }

            const inputReview = {
                model: 'modello0',
                user: testCustomer,
                inputParams
            }

            jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new ExistingReviewError()); // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            // express-validator mock
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    notEmpty: () => ({}),
                    isInt: () => ({}),
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({ isString: () => ({}) })
                }))
            }))

            const response = await request(app).post(baseURL + '/reviews/modello0').send(inputReview.inputParams);
            expect(response.status).toBe(409);
            expect(ReviewController.prototype.addReview).toHaveBeenCalled()
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(inputReview.model, inputReview.user, inputReview.inputParams.score, inputReview.inputParams.comment)
        
        })

        test("It should return a 404 error code when product is not registered", async () => {
            
            const inputParams = {
                score: 3,
                comment: 'commento'
            }

            const inputReview = {
                model: 'modello0',
                user: testCustomer,
                inputParams
            }

            jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new ProductNotFoundError()); // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            // express-validator mock
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    notEmpty: () => ({}),
                    isInt: () => ({}),
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({ isString: () => ({}) })
                }))
            }))

            const response = await request(app).post(baseURL + '/reviews/modello0').send(inputReview.inputParams);
            expect(response.status).toBe(404);
            expect(ReviewController.prototype.addReview).toHaveBeenCalled()
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(inputReview.model, inputReview.user, inputReview.inputParams.score, inputReview.inputParams.comment)
        
        })
        
        /*
        test("Model parameter is not a string", async () => { 
            
            const inputParams = {
                score: 0,
                comment: 'commento'
            }

            const inputReview = {
                model: 'modello0',
                user: testCustomer,
                inputParams
            }

            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce(); // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            // express-validator mock
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    notEmpty: () => ({}),
                    isInt: () => ({}),
                })),
                param: jest.fn().mockImplementation(() => {    // mock param of express-validator
                    throw new Error('model parameter is not a string')
                })
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).post(baseURL + '/reviews/12345').send(inputReview.inputParams);
            expect(response.status).toBe(422);
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(0)
        })

        test("Model parameter is empty", async () => { 
            
            const inputParams = {
                score: 3,
                comment: 'commento'
            }

            const inputReview = {
                model: 'modello0',
                user: testCustomer,
                inputParams
            }

            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce(); // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            // express-validator mock
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    notEmpty: () => ({}),
                    isInt: () => ({}),
                })),
                param: jest.fn().mockImplementation(() => {    // mock param of express-validator
                    throw new Error('model parameter is empty')
                })
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).post(baseURL + '/reviews/modello').send(inputReview.inputParams);
            expect(response.status).toBe(422);
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(0)
        })
        */

        test("It should return a 422 error code when the score is invalid", async () => { 
            
            const inputParams = {
                score: 0,
                comment: 'commento'
            }

            const inputReview = {
                model: 'modello0',
                user: testCustomer,
                inputParams
            }

            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce(); // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            // express-validator mock
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => { // mock body of express-validator
                    throw new Error("Invalid score value");
                }),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({ isString: () => ({}) })
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).post(baseURL + '/reviews/modello0').send(inputReview.inputParams);
            expect(response.status).toBe(422);
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(0)

        })

        test("It should return a 422 error code when the comment has not been inserted", async () => { 
            
            const inputParams = {
                score: 3,
                comment: ''
            }

            const inputReview = {
                model: 'modello0',
                user: testCustomer,
                inputParams
            }

            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce() // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            // express-validator mock
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => { // mock body of express-validator
                    throw new Error("Comment is null");
                }),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({ isString: () => ({}) })
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).post(baseURL + '/reviews/modello0').send(inputReview.inputParams);
            expect(response.status).toBe(422);
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(0)

        })

        test("It should return a 401 error code when the user is not a customer", async () => { 
            
            const inputParams = {
                score: 3,
                comment: 'commento'
            }

            const inputReview = {
                model: 'modello0',
                user: testManager,
                inputParams
            }

            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce(); // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { 
                return res.status(401).json({error: "user is not a Customer\n\n"})
             })

            // express-validator mock
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    notEmpty: () => ({}),
                    isInt: () => ({}),
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({ isString: () => ({}) })
                }))
            }))

            const response = await request(app).post(baseURL + '/reviews/modello0').send(inputReview.inputParams);
            expect(response.status).toBe(401);
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(0)

        })

        test("It should return a 401 error code when the user is not logged in", async () => { 
            
            const inputParams = {
                score: 3,
                comment: 'commento'
            }

            const inputReview = {
                model: 'modello0',
                user: testManager,
                inputParams
            }

            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce(); // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer; // set the user in req.user
                return res.status(401).json({error: "Unauthenticated user"}) 
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { 
                return next()
            })

            // express-validator mock
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    notEmpty: () => ({}),
                    isInt: () => ({}),
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({ isString: () => ({}) })
                }))
            }))

            const response = await request(app).post(baseURL + '/reviews/modello0').send(inputReview.inputParams);
            expect(response.status).toBe(401);
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(0)

        })

    })

    describe('DELETE /reviews/:model', () => {

        test('It should return a 200 success code when the review is removed by the current user for a specific product', async () => {

            jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce(); // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            // express-validator mock
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock bodcustomeparam of express-validator
                    notEmpty: () => ({ isString: () => ({}) })
                }))
            }))

            const response = await request(app).delete(baseURL + '/reviews/modello').send();
            expect(response.status).toBe(200);
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith('modello', testCustomer)
        })

        test('It should return a 401 error code when the user is not a custome', async () => {

            jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce(); // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { 
                return res.status(401).json({error: "user is not a Customer\n\n"})
             })

            // express-validator mock
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({ isString: () => ({}) })
                }))
            }))

            const response = await request(app).delete(baseURL + '/reviews/modello');
            expect(response.status).toBe(401);
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(0)
        })

        test('It should return a 401 error code when the user is not logged in', async () => {

            jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce(); // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer; // set the user in req.user
                return res.status(401).json({error : 'Unauthenticated user'}) 
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { 
                return next();
             })

            // express-validator mock
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({ isString: () => ({}) })
                }))
            }))

            const response = await request(app).delete(baseURL + '/reviews/modello');
            expect(response.status).toBe(401);
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(0)
        })

        /*
        test("Model parameter is empty", async () => { 

            jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce(); // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            // express-validator mock
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));
            
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })
            

            const response = await request(app).delete(baseURL + '/reviews/12345');
            expect(response.status).toBe(422);
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(0)

        })

        
        test('Product parameter is not a string', async () => {

            jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce(); // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer; // set the user in req.user
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { 
                return next();
             })

            // express-validator mock
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({ isString: () => ({ }) })
                }))
            }))

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
            })

            const response = await request(app).delete(baseURL + '/reviews/modello');
            expect(response.status).toBe(422);
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(0)
        })
        */
    
        test('It should return a 404 error code when the product is not registered', async () => {

            jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce(new ProductNotFoundError()); // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            // express-validator mock
            jest.mock('express-validator', () => ({ 
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({ isString: () => ({}) })
                }))
            }))

            const response = await request(app).delete(baseURL + '/reviews/modello').send();
            expect(response.status).toBe(404);
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith('modello', testCustomer)
        })

        test('It should return a 404 error code when the product is not registered', async () => {

            jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce(new NoReviewProductError()); // mock addReview

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testCustomer; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            // express-validator mock
            jest.mock('express-validator', () => ({ 
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({ isString: () => ({}) })
                }))
            }))

            const response = await request(app).delete(baseURL + '/reviews/modello').send();
            expect(response.status).toBe(404);
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith('modello', testCustomer)
        })
    })

    describe('DELETE /reviews/:model/all', () => {
        test('It should return a 200 success code when deletes all reviews of a specific product', async () =>{
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(); // mock deleteReviewsOfProduct

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            // validateProductModelMiddleware will be tested by checking status and body error message

            const response = await request(app).delete(baseURL + '/reviews/modello/all').send();
            expect(response.status).toBe(200);
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith('modello')
        })
        test('It should return a 401 error code when the user is not an Admin or Manager', async () => {

            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(); // mock deleteReviewsOfProduct

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return res.status(401).json({error: "User is not an admin or manager\n\n"})
            })

            // validateProductModelMiddleware will be tested by checking status and body error message

            const response = await request(app).delete(baseURL + '/reviews/modello/all').send();
            expect(response.status).toBe(401);
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(0)
            
        })

        test('It should return a 401 error code when the user is not logged in', async () => {

            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce(); // mock deleteReviewsOfProduct

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return  res.status(401).json({error : 'Unauthenticated user'}) ; 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return next();
            })

            // validateProductModelMiddleware will be tested by checking status and body error message

            const response = await request(app).delete(baseURL + '/reviews/modello/all').send();
            expect(response.status).toBe(401);
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(0)
        })

        test('It should return a 404 error if model does not represent an existing product in the database', async () =>{
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockRejectedValueOnce(new ProductNotFoundError()) // mock deleteReviewsOfProduct

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            // validateProductModelMiddleware will be tested by checking status and body error message

            const response = await request(app).delete(baseURL + '/reviews/modello/all').send();
            expect(response.status).toBe(404);
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalled()
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith('modello')
        })

    })


    describe('DELETE /reviews', () => {
        test('It should return a 200 success code when deletes all reviews of all existing products', async () =>{
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce(); // mock deleteAllReviews

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            // validateProductModelMiddleware will be tested by checking status and body error message

            const response = await request(app).delete(baseURL + '/reviews').send();
            expect(response.status).toBe(200);
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalled()
        })
        
        test('It should return a 401 error code when the user is not an Admin or Manager', async () => {

            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce(); // mock deleteAllReviews

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return res.status(401).json({error: "User is not an admin or manager\n\n"})
            })

            // validateProductModelMiddleware will be tested by checking status and body error message

            const response = await request(app).delete(baseURL + '/reviews').send();
            expect(response.status).toBe(401);
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(0)
            
        })

        test('It should return a 401 error code when the user is not logged in', async () => {

            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce(); // mock deleteAllReviews

            // mock the auth methods
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return  res.status(401).json({error : 'Unauthenticated user'}) ; 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return next()
            })

            // validateProductModelMiddleware will be tested by checking status and body error message

            const response = await request(app).delete(baseURL + '/reviews').send();
            expect(response.status).toBe(401);
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(0)
        })

        
    })
})