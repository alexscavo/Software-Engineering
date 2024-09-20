import { test, expect, jest, describe, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"


import Authenticator from "../../src/routers/auth"
import { Role, User } from "../../src/components/user"
import ErrorHandler from "../../src/helper"
import CartController from "../../src/controllers/cartController"
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError"
import { Cart, ProductInCart } from "../../src/components/cart"
import { Category, Product } from "../../src/components/product"
import { EmptyProductStockError, ProductNotFoundError } from "../../src/errors/productError"

const baseURL = "/ezelectronics"


// mock the review controller and the auth
jest.mock('../../src/controllers/reviewController');
jest.mock('../../src/routers/auth')

let testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
let testManager = new User('manager', 'manager', 'manager', Role.MANAGER, '', '');
let testProduct = new Product(100, 'modello', Category.APPLIANCE, null, null, 5);
let testProductInCart = new ProductInCart(testProduct.model, 1, testProduct.category, testProduct.sellingPrice)
let testCart = new Cart(testCustomer.username, false, '', testProductInCart.price*testProductInCart.quantity, [testProductInCart])
let testPaidCart = new Cart(testCustomer.username, true, '2024-05-05', testProductInCart.price*testProductInCart.quantity, [testProductInCart])

describe("Cart routes unit tests", () => {

    beforeEach(() => {
        jest.resetAllMocks()
        jest.restoreAllMocks()
    },20000);
      
    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
    },20000);

    describe("GET /carts - retrieve the cart of the current user", () => {      

        test("It should return a 200 success code when retrieving cart with one product", async () => {
            jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(testCart)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).get(baseURL + '/carts').send()
            expect(response.status).toBe(200)
            expect(CartController.prototype.getCart).toHaveBeenCalled()
            expect(CartController.prototype.getCart).toHaveBeenCalledWith(testCustomer)
        })

        test("It should return a 503 error code when failing to retrieve cart", async () => {
            jest.spyOn(CartController.prototype, "getCart").mockRejectedValueOnce(new Error())

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).get(baseURL + '/carts').send()
            expect(response.status).toBe(503)
            expect(CartController.prototype.getCart).toHaveBeenCalled()
            expect(CartController.prototype.getCart).toHaveBeenCalledWith(testCustomer)
        })

        test("It should return a 401 error code when user is not logged in", async () => {
            jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(testCart)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer; // set the user in req.user
                return res.status(401).json({error: "Unauthenticated user"}) 
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).get(baseURL + '/carts').send()
            expect(response.status).toBe(401)
            expect(CartController.prototype.getCart).toHaveBeenCalledTimes(0)
        })

        test("It should return a 401 error code when user is not a customer", async () => {
            
            jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(testCart)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { 
                return res.status(401).json({error: "user is not a customer"})
            })

            const response = await request(app).get(baseURL + '/carts').send()
            expect(response.status).toBe(401)
            expect(CartController.prototype.getCart).toHaveBeenCalledTimes(0)
        })
    })

    describe('POST /carts - add a product to cart', () => {
        test('It should return a 200 success code when the product has been added to the cart', async () => {

            const inputParams = {
                model: testProduct.model
            }

            const mockAddToCart = jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })
            
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    notEmpty: () => ({isString: () => ({})}),
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator

                }))
            }))

            const response = await request(app).post(baseURL + '/carts').send(inputParams)
            expect(response.status).toBe(200)
            expect(mockAddToCart).toHaveBeenCalledTimes(1)
            expect(mockAddToCart).toHaveBeenCalledWith(testCustomer, testProduct.model)
        })

        test('It should return a 401 code when the user is not logged in', async () => {

            const inputParams = {
                model: testProduct.model
            }

            const mockAddToCart = jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return res.status(401).json({error: "Unauthenticated user"})
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })
            
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    notEmpty: () => ({isString: () => ({})}),
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator

                }))
            }))

            const response = await request(app).post(baseURL + '/carts').send(inputParams)
            expect(response.status).toBe(401)
            expect(mockAddToCart).toHaveBeenCalledTimes(0)
        })

        test('It should return a 401 code when the user is not a customer', async () => {

            const inputParams = {
                model: testProduct.model
            }

            const mockAddToCart = jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { 
                return res.status(401).json({error: "user is not a customer"})
            })
            
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    notEmpty: () => ({isString: () => ({})}),
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator

                }))
            }))

            const response = await request(app).post(baseURL + '/carts').send(inputParams)
            expect(response.status).toBe(401)
            expect(mockAddToCart).toHaveBeenCalledTimes(0)
        })

        test('It should return a 422 code when the request parameter is empty', async () => {

            const inputParams = {
                model: testProduct.model
            }

            const mockAddToCart = jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })
            
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => { // mock body of express-validator
                    throw new Error('Model is empty')
                }),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator

                }))
            }))

            const response = await request(app).post(baseURL + '/carts').send('')
            expect(response.status).toBe(422)
            expect(mockAddToCart).toHaveBeenCalledTimes(0)
        })

        test('It should return a 422 code when the request parameter is not a string', async () => {

            const inputParams = {
                model: 15
            }

            const mockAddToCart = jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true)
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })
            
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => { // mock body of express-validator
                    throw new Error('Model is not a string')
                }),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator

                }))
            }))

            const response = await request(app).post(baseURL + '/carts').send(inputParams)
            expect(response.status).toBe(422)
            expect(mockAddToCart).toHaveBeenCalledTimes(0)
        })

        test('It should return a 404 code when the product is not registered', async () => {

            const inputParams = {
                model: testProduct.model
            }

            const mockAddToCart = jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new ProductNotFoundError())
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })
            
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    notEmpty: () => ({isString: () => ({})}),
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator

                }))
            }))

            const response = await request(app).post(baseURL + '/carts').send(inputParams)
            expect(response.status).toBe(404)
            expect(mockAddToCart).toHaveBeenCalledTimes(1)
            expect(mockAddToCart).toHaveBeenCalledWith(testCustomer, testProduct.model)
        })

        test('It should return a 409 code when the product is not available', async () => {

            const inputParams = {
                model: testProduct.model
            }

            const mockAddToCart = jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new EmptyProductStockError())
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })
            
            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    notEmpty: () => ({isString: () => ({})}),
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator

                }))
            }))

            const response = await request(app).post(baseURL + '/carts').send(inputParams)
            expect(response.status).toBe(409)
            expect(mockAddToCart).toHaveBeenCalledTimes(1)
            expect(mockAddToCart).toHaveBeenCalledWith(testCustomer, testProduct.model)
        })
    })
        
    describe('DELETE /carts/current - delete the current cart', () => {
        test('It should return 200 status code when the cart has been deleted', async () => {

            const mockClearCart = jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).delete(baseURL + '/carts/current').send()
            expect(response.status).toBe(200)
            expect(mockClearCart).toHaveBeenCalledTimes(1)
            expect(mockClearCart).toHaveBeenCalledWith(testCustomer)
            
        })

        test('It should return 401 status code when the user is not logged in', async () => {

            const mockClearCart = jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return res.status(401).json({error: "Unauthenticated user"})
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).delete(baseURL + '/carts/current').send()
            expect(response.status).toBe(401)
            expect(mockClearCart).toHaveBeenCalledTimes(0)
            
        })

        test('It should return 401 when user is not a customer', async () => {

            const mockClearCart = jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testManager
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { 
                return res.status(401).json({error: "user is not a Customer\n\n"})
            })

            const response = await request(app).delete(baseURL + '/carts/current').send()
            expect(response.status).toBe(401)
            expect(mockClearCart).toHaveBeenCalledTimes(0)            
        })

        test('It should return 404 status when there is not an unpaid cart for the user', async () => {

            const mockClearCart = jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new CartNotFoundError())

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).delete(baseURL + '/carts/current').send()
            expect(response.status).toBe(404)
            expect(mockClearCart).toHaveBeenCalledTimes(1)
            expect(mockClearCart).toHaveBeenCalledWith(testCustomer)
            
        })
    })

    describe('GET /carts/history - retrieve the history of the carts', () => {
        test('It should return a 200 success code when there is at least 1 paid cart', async () => {

            const mockGetCustomerCarts = jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce([testPaidCart])

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).get(baseURL + '/carts/history').send()
            expect(response.status).toBe(200)
            expect(mockGetCustomerCarts).toHaveBeenCalledTimes(1)
            expect(mockGetCustomerCarts).toHaveBeenCalledWith(testCustomer)          
        })

        test('It should return a 401 code when the user is not logged in', async () => {

            const mockGetCustomerCarts = jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce([testPaidCart])

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return res.status(401).json({error: "Unauthenticated user"})
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).get(baseURL + '/carts/history').send()
            expect(response.status).toBe(401)
            expect(mockGetCustomerCarts).toHaveBeenCalledTimes(0)          
        })

        test('It should return a 401 code when the user is not a customer', async () => {

            const mockGetCustomerCarts = jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce([testPaidCart])

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { 
                return res.status(401).json({error: "user is not a customer"})
            })

            const response = await request(app).get(baseURL + '/carts/history').send()
            expect(response.status).toBe(401)
            expect(mockGetCustomerCarts).toHaveBeenCalledTimes(0)          
        })

        test('It should return a 503 code whene there is an error', async () => {

            const mockGetCustomerCarts = jest.spyOn(CartController.prototype, "getCustomerCarts").mockRejectedValueOnce(new Error('Generic error'))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).get(baseURL + '/carts/history').send()
            expect(response.status).toBe(503)
            expect(mockGetCustomerCarts).toHaveBeenCalledTimes(1)
            expect(mockGetCustomerCarts).toHaveBeenCalledWith(testCustomer)          
        })
    })

    describe('PATCH /carts - checkout the current cart', () => {
        test('It should return a 200 success code when the cart has been checked out', async () => {

            const mockCheckoutCart = jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).patch(baseURL + '/carts').send()
            expect(response.status).toBe(200)
            expect(mockCheckoutCart).toHaveBeenCalledTimes(1)
            expect(mockCheckoutCart).toHaveBeenCalledWith(testCustomer)          
        })

        test('It should return a 401 code when the user is not logged in', async () => {

            const mockCheckoutCart = jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return res.status(401).json({error: "Unauthenticated user"})
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).patch(baseURL + '/carts').send()
            expect(response.status).toBe(401)
            expect(mockCheckoutCart).toHaveBeenCalledTimes(0)          
        })

        test('It should return a 401 code when the user is not a customer', async () => {

            const mockCheckoutCart = jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { 
                return res.status(401).json({error: "user is not a customer"})
            })

            const response = await request(app).patch(baseURL + '/carts').send()
            expect(response.status).toBe(401)
            expect(mockCheckoutCart).toHaveBeenCalledTimes(0)          
        })

        test('It should return a 404 code when there is not an unpaid cart for the customer', async () => {

            const mockCheckoutCart = jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new CartNotFoundError())

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).patch(baseURL + '/carts').send()
            expect(response.status).toBe(404)
            expect(mockCheckoutCart).toHaveBeenCalledTimes(1)
            expect(mockCheckoutCart).toHaveBeenCalledWith(testCustomer)          
        })

        test('It should return a 404 code when the cart is empty', async () => {

            const mockCheckoutCart = jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new EmptyCartError())

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).patch(baseURL + '/carts').send()
            expect(response.status).toBe(400)
            expect(mockCheckoutCart).toHaveBeenCalledTimes(1)
            expect(mockCheckoutCart).toHaveBeenCalledWith(testCustomer)          
        })

        test('It should return a 409 code when at least one product is out of stock', async () => {

            const mockCheckoutCart = jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new EmptyProductStockError())

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).patch(baseURL + '/carts').send()
            expect(response.status).toBe(409)
            expect(mockCheckoutCart).toHaveBeenCalledTimes(1)
            expect(mockCheckoutCart).toHaveBeenCalledWith(testCustomer)          
        })

        test('It should return a 409 code when there is not enough quantity of the requested item in stock', async () => {

            const mockCheckoutCart = jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new EmptyCartError())

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).patch(baseURL + '/carts').send()
            expect(response.status).toBe(400)
            expect(mockCheckoutCart).toHaveBeenCalledTimes(1)
            expect(mockCheckoutCart).toHaveBeenCalledWith(testCustomer)          
        })
    })

    describe('DELETE /carts/products/:model - remove a product from cart', () => {
        test('It should return a 200 success code when the cart has been checked out', async () => {

            const mockRemoveProductFromCart = jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({isString: () => ({})}),
                }))
            }))

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).delete(baseURL + '/carts/products/modello').send()
            expect(response.status).toBe(200)
            expect(mockRemoveProductFromCart).toHaveBeenCalledTimes(1)
            expect(mockRemoveProductFromCart).toHaveBeenCalledWith(testCustomer, 'modello')          
        })

        test('It should return a 401 code when the user is not logged in', async () => {

            const mockRemoveProductFromCart = jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return res.status(401).json({error: "Unauthenticated user"})
            })

            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({isString: () => ({})}),
                }))
            }))

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).delete(baseURL + '/carts/products/modello').send()
            expect(response.status).toBe(401)
            expect(mockRemoveProductFromCart).toHaveBeenCalledTimes(0)          
        })

        test('It should return a 401 code when the user is not a customer', async () => {

            const mockRemoveProductFromCart = jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({isString: () => ({})}),
                }))
            }))

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { 
                return res.status(401).json({error: "user is not a customer"})
            })

            const response = await request(app).delete(baseURL + '/carts/products/modello').send()
            expect(response.status).toBe(401)
            expect(mockRemoveProductFromCart).toHaveBeenCalledTimes(0)          
        })

        test('It should return a 404 code if the model parameter is empty', async () => {

            const mockRemoveProductFromCart = jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    
                })),
                param: jest.fn().mockImplementation(() => {    // mock param of express-validator
                    throw new Error('model parameter is empty')
                })
            }))

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { 
                return next()
            })

            const response = await request(app).delete(baseURL + '/carts/products/').send()
            expect(response.status).toBe(404)
            expect(mockRemoveProductFromCart).toHaveBeenCalledTimes(0)          
        })

        test('It should return a 404 code when the product is not in the cart', async () => {

            const mockRemoveProductFromCart = jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotInCartError())

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({isString: () => ({})}),
                }))
            }))

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).delete(baseURL + '/carts/products/modello').send()
            expect(response.status).toBe(404)
            expect(mockRemoveProductFromCart).toHaveBeenCalledTimes(1)
            expect(mockRemoveProductFromCart).toHaveBeenCalledWith(testCustomer, 'modello')          
        })

        test('It should return a 404 code when the product is not in the cart', async () => {

            const mockRemoveProductFromCart = jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new CartNotFoundError())

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({isString: () => ({})}),
                }))
            }))

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).delete(baseURL + '/carts/products/modello').send()
            expect(response.status).toBe(404)
            expect(mockRemoveProductFromCart).toHaveBeenCalledTimes(1)
            expect(mockRemoveProductFromCart).toHaveBeenCalledWith(testCustomer, 'modello')          
        })

        test('It should return a 404 code when the product is not in the cart', async () => {

            const mockRemoveProductFromCart = jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotFoundError())

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({isString: () => ({})}),
                }))
            }))

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).delete(baseURL + '/carts/products/modello').send()
            expect(response.status).toBe(404)
            expect(mockRemoveProductFromCart).toHaveBeenCalledTimes(1)
            expect(mockRemoveProductFromCart).toHaveBeenCalledWith(testCustomer, 'modello')          
        })

        test('It should return a 404 code when the product is not in the cart', async () => {

            const mockRemoveProductFromCart = jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new EmptyCartError())

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.mock('express-validator', () => ({ 
                body: jest.fn().mockImplementation(() => ({ // mock body of express-validator
                    
                })),
                param: jest.fn().mockImplementation(() => ({    // mock param of express-validator
                    notEmpty: () => ({isString: () => ({})}),
                }))
            }))

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).delete(baseURL + '/carts/products/modello').send()
            expect(response.status).toBe(400)
            expect(mockRemoveProductFromCart).toHaveBeenCalledTimes(1)
            expect(mockRemoveProductFromCart).toHaveBeenCalledWith(testCustomer, 'modello')          
        })
    })

    describe('DELETE /carts - delete all carts', () => {
        test('It should return 200 status code when all the cart has been deleted', async () => {

            const mockDeleteAllCarts = jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testManager
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).delete(baseURL + '/carts').send()
            expect(response.status).toBe(200)
            expect(mockDeleteAllCarts).toHaveBeenCalledTimes(1)
            expect(mockDeleteAllCarts).toHaveBeenCalledWith()
        })

        test('It should return a 401 code when the user is not logged in', async () => {

            const mockDeleteAllCarts = jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({error: "Unauthenticated user"})
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return next()
            })

            const response = await request(app).delete(baseURL + '/carts').send()
            expect(response.status).toBe(401)
            expect(mockDeleteAllCarts).toHaveBeenCalledTimes(0)
        })

        test('It should return a 401 code when the user is not a manaer or an admin', async () => {

            const mockDeleteAllCarts = jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true)
    

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return res.status(401).json({error: "user is not a manager or admin"}) 
             })

            const response = await request(app).delete(baseURL + '/carts').send()
            expect(response.status).toBe(401)
            expect(mockDeleteAllCarts).toHaveBeenCalledTimes(0)
        })

        test('It should return 503 code whene there is an error', async () => {

            const mockGetAllCarts = jest.spyOn(CartController.prototype, "deleteAllCarts").mockRejectedValueOnce(new Error('Generic error'))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testManager
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).delete(baseURL + '/carts').send()
            expect(response.status).toBe(503)
            expect(mockGetAllCarts).toHaveBeenCalledTimes(1)

        })
    })

    describe('GET /carts/all - Returns all carts of all users, both current and past', () => {
        test('It should return 200 status code when returns all carts of all users, both current and past.', async () => {

            const mockGetAllCarts = jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce([testPaidCart])

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testManager
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).get(baseURL + '/carts/all').send()
            expect(response.status).toBe(200)
            expect(mockGetAllCarts).toHaveBeenCalledTimes(1)

        })

        test('It should return a 401 code when the user is not logged in', async () => {

            const mockGetAllCarts = jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce([testPaidCart])

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({error: "Unauthenticated user"})
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return next()
            })

            const response = await request(app).get(baseURL + '/carts/all').send()
            expect(response.status).toBe(401)
            expect(mockGetAllCarts).toHaveBeenCalledTimes(0)
        })

        test('It should return a 401 code when the user is not a manaer or an admin', async () => {

            const mockGetAllCarts = jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce([testPaidCart])

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return res.status(401).json({error: "user is not a manager or admin"}) 
             })

            const response = await request(app).get(baseURL + '/carts/all').send()
            expect(response.status).toBe(401)
            expect(mockGetAllCarts).toHaveBeenCalledTimes(0)
        })
        
        test('It should return 503 code whene there is an error', async () => {

            const mockGetAllCarts = jest.spyOn(CartController.prototype, "getAllCarts").mockRejectedValueOnce(new Error('Generic error'))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testManager
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).get(baseURL + '/carts/all').send()
            expect(response.status).toBe(503)
            expect(mockGetAllCarts).toHaveBeenCalledTimes(1)

        })
    })
            
})