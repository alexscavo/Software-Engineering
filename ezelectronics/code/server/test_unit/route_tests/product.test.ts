
import { test, expect, jest, describe, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"


import Authenticator from "../../src/routers/auth"
import { Role, User } from "../../src/components/user"
import ErrorHandler from "../../src/helper"
import ReviewController from "../../src/controllers/reviewController"
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"
import { InvalidGroupingError,InvalidCategoryGroupingError, InvalidModelGroupingError, ChangeDateBeforeArrivalDateError, DateAfterCurrentDateError, EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError"
import ProductController from "../../src/controllers/productController"
import { isString } from "util"
import { Category, Product } from "../../src/components/product"



const baseURL = "/ezelectronics"


// mock the review controller and the auth
jest.mock('../../src/controllers/reviewController');
jest.mock('../../src/routers/auth')
//jest.mock("../../src/controllers/productController")


const testProducts =  {
    model: "iPhone13", 
    category: "Smartphone", 
    quantity: 5, 
    details: "", 
    sellingPrice: 200, 
    arrivalDate: "2024-01-01"
}
let testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
let testManager = new User('manager', 'manager', 'manager', Role.MANAGER, '', '');

describe("Product routes unit tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks()
    });
      
    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
    });

    describe("Route Get Products", () => {

        test("Returns 200 and the correct products when grouping is 'category' and a valid category is provided", async () => {
            const grouping: string|null = "category";
            const category:string|null = "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + '/products').query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(grouping, category, undefined);

        })

        test("Returns 200 and the correct products when grouping is 'model' and a valid model is provided", async()=>{

            const grouping:string|null = "model";
            const category:string|null = null;
            const model:string|null = "model";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + '/products').query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(grouping,undefined, model);
        })

        test("Returns 200 and the correct products when grouping, category and model are not provided", async()=>{
            const grouping:string|null = null;
            const category:string|null= null;
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + '/products').query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(200);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(undefined, undefined, undefined);
        })

        
        test("Returns 401 error when the user is not logged in", async () => {
            const grouping: string|null = "category";
            const category:string|null = "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            
            // Mock the authentication middleware to simulate an unauthenticated user
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return res.status(401).json({error: "Unauthenticated user"})
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 

                return next();
            })
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue(products);
        
            const response = await request(app).get(baseURL + '/products').query({ grouping: grouping, category: category, model: model });
        
            expect(response.status).toBe(401);
            expect(ProductController.prototype.getProducts).not.toHaveBeenCalled();
            
        });

            
        

        test("Returns 401 error when the user is not an admin or manager", async () => {
            const grouping: string|null = "category";
            const category:string|null = "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]
        
            // Mock the authentication middleware to simulate an authenticated user
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
        
            // Mock the admin/manager authorization middleware to simulate a user without admin/manager privileges
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                res.status(401).send({ error: "Forbidden" });
            });
        
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + '/products').query({ grouping: grouping, category: category, model: model });
        
            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Forbidden" });
            expect(ProductController.prototype.getProducts).not.toHaveBeenCalled();
        });
        


        test("Returns a 422 error if grouping is null and any of category or model is not null", async()=>{
            const grouping:string|null = null;
            const category:string|null= "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new InvalidGroupingError());
            const response = await request(app).get(baseURL + '/products').query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(422);
            
        }) 
        test("Returns a 422 error if grouping is not valid", async()=>{
            const grouping:string|null = "GroupingNonValido";
            const category:string|null= "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            
            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new InvalidGroupingError());
            const response = await request(app).get(baseURL + '/products').query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(422);
            
        })
    

        test("Returns a 422 error if category is not valid", async () => {
            const grouping: string | null = "category";
            const category: string | null = "xxxx"; // Invalid category. It's not one between: "Appliance", "Laptop" or "Smartphone". 
            const model: string | null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10);
            const products = [product];
        
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
        
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
        
            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new InvalidGroupingError());
        
            const response = await request(app).get(baseURL + '/products').query({ grouping: grouping, category: category, model: model });
        
            expect(response.status).toBe(422);
        });
        
    

        test("Returns a 422 error if grouping is 'category' but category is null", async()=>{
            const grouping:string|null = "category";
            const category:string|null= null;
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new InvalidGroupingError());
            const response = await request(app).get(baseURL + '/products').query({ grouping: grouping, category: category, model: model });
            
            expect(response.status).toBe(422);
        })
    
        test("Returns a 422 error if grouping is 'model' but model is empty", async()=>{
            const grouping:string|null = "model";
            const category:string|null=  null;
            const model:string|null = " ";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new InvalidGroupingError());
            const response = await request(app).get(baseURL + '/products').query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(422);
        })
    

        test("Returns a 422 error if grouping is 'model' but model is null", async()=>{
            const grouping:string|null = "model";
            const category:string|null= "CategoryNonValida";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new InvalidGroupingError());
            const response = await request(app).get(baseURL + '/products').query({ grouping: grouping, category: category, model: model });
       
            expect(response.status).toBe(422);
            
        })
    
        test("Returns 200 with an empty array if grouping is 'model' and the specified model does not exist", async()=>{
            const grouping:string|null = "model";
            const category:string|null= null;
            const model:string|null = "ModelloNonEsistente";
            

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([]);
            const response = await request(app).get(baseURL + '/products').query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(200); //cerca nel db ma non trova il modello indicato , ritorna un array vuoto
            expect(response.body).toEqual([]);
        })
    });

    

    describe("Route Get Available Products", () => {

        test("Returns 200 and the correct products when grouping is 'category' for available products", async () => {
                        
            const grouping: string|null = "category";
            const category:string|null = "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + '/products' + "/available").query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(grouping, category, "");

        
        });




        test("Returns 200 and the correct products when grouping is 'model' for available products", async()=>{

            const grouping:string|null = "model";
            const category:string|null = null;
            const model:string|null = "model";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });


            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + '/products'+ "/available").query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(grouping,"", model);
        })

        test("Returns 200 and the correct products when no query parameters are provided for available product", async()=>{
            const grouping:string|null = null;
            const category:string|null= null;
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + '/products'+ "/available").query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith("", "", "");
        })


        test("Returns 401 error when the user is not logged in", async () => {
            const grouping: string|null = "category";
            const category:string|null = "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            
            // Mock the authentication middleware to simulate an unauthenticated user
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return res.status(401).json({error: "Unauthenticated user"})
            });

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);
        
            const response = await request(app).get(baseURL + '/products').query({ grouping: grouping, category: category, model: model });
        
            expect(response.status).toBe(401);
            expect(ProductController.prototype.getAvailableProducts).not.toHaveBeenCalled();
            
        });

        
        test("Returns 422 error when grouping is null but category is not null", async()=>{
            const grouping:string|null = null;
            const category:string|null= "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue(new InvalidGroupingError());
            const response = await request(app).get(baseURL + '/products' + "/available").query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(422);
            
            
        })

        test("Returns 422 error for invalid grouping value", async()=>{
            const grouping:string|null = "GroupingNonValido";
            const category:string|null= "Smartphone";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue(new InvalidGroupingError());
            const response = await request(app).get(baseURL + '/products' + "/available").query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(422);
        })

        test("Returns 422 error for invalid category value", async()=>{
            const grouping:string|null = "category";
            const category:string|null= "CategoryNonValida";
            const model:string|null = null;
            
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });


            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue(new InvalidGroupingError());

            const response = await request(app).get(baseURL + '/products' + "/available").query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(422);
          
        })

        test("Returns 422 error when grouping is 'category' but category is null", async()=>{
            const grouping:string|null = "category";
            const category:string|null= null;
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue(new InvalidGroupingError());
            const response = await request(app).get(baseURL + '/products' + "/available").query({ grouping: grouping, category: category, model: model });
        
            expect(response.status).toBe(422);
            
        })

        test("Returns 422 error when grouping by 'model', but model is empty", async()=>{
            const grouping:string|null = "model";
            const category:string|null=  null;
            const model:string|null = " ";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue(new InvalidModelGroupingError());
            const response = await request(app).get(baseURL + '/products' + "/available").query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(422);
            
        })

        test("Returns 422 error when grouping is 'model' but model is null", async()=>{
            const grouping:string|null = "model";
            const category:string|null= "CategoryNonValida";
            const model:string|null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue(new InvalidModelGroupingError);
            const response = await request(app).get(baseURL + '/products' + "/available").query({ grouping: grouping, category: category, model: model });
            
            expect(response.status).toBe(422);
           
        })

        test("Returns 404 error when grouping by model but model does not exist", async()=>{
            const grouping:string|null = "model";
            const category:string|null= null;
            const model:string|null = "ModelloNonEsistente";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });


            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue(new ProductNotFoundError());;

            const response = await request(app).get(baseURL + '/products' + "/available").query({ grouping: grouping, category: category, model: model });
            
            expect(response.status).toBe(404);
            
        })
     });
    describe("PATCH /products - change avaiable quantity of a product", () => {  
        const productController = new ProductController();
        test("should return 200 for a valid request", async () => {
            
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 3,
                changeDate: "2024-02-01"
            }
            const testProduct = new Product(testProducts.sellingPrice,testProducts.model,Category.SMARTPHONE,
                testProducts.arrivalDate,testProducts.details,testProducts.quantity);
            

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);
            const products = await productController.getProducts('model', null, testProduct.model);
            
            const expectedValue = testProduct.quantity + testChange.quantity;

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(expectedValue); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProduct.model}`).send(testChange)
            expect(response.status).toBe(200)
            expect(response.body).toEqual({ quantity: expectedValue })


            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalled()
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(inputParams.model, testChange.quantity, testChange.changeDate);

            expect(ProductController.prototype.getProducts).toHaveBeenCalled()
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith('model', null, testProduct.model);
            

            
            
        })
        test("it should return a 401 when the user is not a manager", async () => {
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 3,
                changeDate: "2024-02-01"
            }
            const testProduct = new Product(testProducts.sellingPrice,testProducts.model,Category.SMARTPHONE,
                testProducts.arrivalDate,testProducts.details,testProducts.quantity);
            

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);
            const products = await productController.getProducts('model', null, testProduct.model);
            
            const expectedValue = testProduct.quantity + testChange.quantity;

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(expectedValue); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return res.status(401).json({error: "user is not a Manager\n\n"})
            })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProduct.model}`).send(testChange)
            expect(response.status).toBe(401)

            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0)            
            
            
        })

        test("it should return a 401 when the user is not a logged in", async () => {
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 3,
                changeDate: "2024-02-01"
            }
            const testProduct = new Product(testProducts.sellingPrice,testProducts.model,Category.SMARTPHONE,
                testProducts.arrivalDate,testProducts.details,testProducts.quantity);
            

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);
            const products = await productController.getProducts('model', null, testProduct.model);
            
            const expectedValue = testProduct.quantity + testChange.quantity;

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(expectedValue); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return res.status(401).json({error: "Unauthenticated user"})
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return next()
            })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProduct.model}`).send(testChange)
            expect(response.status).toBe(401)

            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0)            
           
            
        })

        test("It should return a 404 error if model does not represent a product in the database", async () => {

            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 3,
                changeDate: "2024-02-01"
            }
            

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new ProductNotFoundError()); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next()
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return next()
            })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProducts.model}`).send(testChange)
            expect(response.status).toBe(404)

            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1)         
            
            
        })

        test("It should return a 422 error if changeDate is after the current date ", async () => {
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 3,
                changeDate: "2025-02-01"
            }
            const testProduct = new Product(testProducts.sellingPrice,testProducts.model,Category.SMARTPHONE,
                testProducts.arrivalDate,testProducts.details,testProducts.quantity);
            

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);
            const products = await productController.getProducts('model', null, testProduct.model);
            
            const expectedValue = testProduct.quantity + testChange.quantity;

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new DateAfterCurrentDateError()); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProduct.model}`).send(testChange)
            expect(response.status).toBe(422);
            expect(response.body.message).toBe('Invalid changeDate: It must be a valid date in the format YYYY-MM-DD, not after the current date, and after the arrival date of the product');

            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0)     

        })

        test("It should return a 400 error if changeDate is before the product's arrivalDate ", async () => {
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 3,
                changeDate: "2024-02-01"
            }
            

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new ChangeDateBeforeArrivalDateError()); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next()
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return next()
            })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProducts.model}`).send(testChange)
            expect(response.status).toBe(400)

            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1)        
            
        })

        test("It should return a 422 error if changeDate is not in the format YYYY-MM-DD", async () => {
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 3,
                changeDate: "2024/02/01"
            }
            const testProduct = new Product(testProducts.sellingPrice,testProducts.model,Category.SMARTPHONE,
                testProducts.arrivalDate,testProducts.details,testProducts.quantity);
            

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);
            const products = await productController.getProducts('model', null, testProduct.model);
            
            const expectedValue = testProduct.quantity + testChange.quantity;

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(expectedValue); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProduct.model}`).send(testChange)
            expect(response.status).toBe(422);
            expect(response.body.message).toBe('Invalid changeDate: It must be a valid date in the format YYYY-MM-DD, not after the current date, and after the arrival date of the product');

            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0)     
               
            
        })

        test("It should return a 422 error if the newQuantity is not a number", async () => {
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: "fakeQuantity",
                changeDate: "2024-02-01"
            }

            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })


            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProducts.model}`).send(testChange)
            expect(response.status).toBe(422);
            expect(response.body.message).toBe('Invalid quantity: It must be a number greater than 0');

            
        })

        test("It should return a 422 error if the newQuantity is not greater than 0", async () => {
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 0,
                changeDate: "2024-02-01"
            }

            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })


            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProducts.model}`).send(testChange)
            expect(response.status).toBe(422);
            expect(response.body.message).toBe('Invalid quantity: It must be a number greater than 0');
            
            
        })
    })

    describe("POST /products - Register a new product", () => {  

        test("should return 200 for a valid request", async () => {
            const testProducts =  {
                model: "iPhone13", 
                category: "Smartphone", 
                quantity: 5, 
                details: "", 
                sellingPrice: 200, 
                arrivalDate: "2024-01-01"
            }

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(); // mock registerProducts

            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user expect(response.status).toBe(422);in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).post(baseURL + '/products').send(testProducts);
            expect(response.status).toBe(200);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1)
        })
        test("should return 422 for an invalid category (not in Smartphone, Laptop, Appliance)", async () => {
            const testProducts =  {
                model: "iPhone13", 
                category: "Tablet", 
                quantity: 5, 
                details: "", 
                sellingPrice: 200, 
                arrivalDate: "2024-01-01"
            }

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(); // mock registerProducts

            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user expect(response.status).toBe(422);in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).post(baseURL + '/products').send(testProducts);
            expect(response.status).toBe(422);
            expect(response.body.message).toBe('Invalid category: It must be one of Smartphone, Laptop, Appliance');
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0)
        })

        test("should return 422 for an invalid model(empty string)", async () => {
            const testProducts =  {
                model: "", 
                category: "Smartphone", 
                quantity: 5, 
                details: "", 
                sellingPrice: 200, 
                arrivalDate: "2024-01-01"
            }

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(); // mock registerProducts

            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).post(baseURL + '/products').send(testProducts);
            expect(response.status).toBe(422);
            expect(response.body.message).toBe('Invalid model: It must be a non-empty string');
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0)
        })

        
        test("should return 422 for an invalid quanity", async () => {
            const testProducts =  {
                model: "iPhone13", 
                category: "Smartphone", 
                quantity: 0, 
                details: "", 
                sellingPrice: 200, 
                arrivalDate: "2024-01-01"
            }
            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(); // mock registerProducts

            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).post(baseURL + '/products').send(testProducts);
            expect(response.status).toBe(422);
            expect(response.body.message).toBe('Invalid quantity: It must be a number greater than 0');
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0)
        })


        
        test("should return 422 for an invalid sellingPrice", async () => {
            const testProducts =  {
                model: "iPhone13", 
                category: "Smartphone", 
                quantity: 5, 
                details: "", 
                sellingPrice: 0, 
                arrivalDate: "2024-01-01"
            }

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(); // mock registerProducts

            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            
            const response = await request(app).post(baseURL + '/products').send(testProducts);
            expect(response.status).toBe(422);
            expect(response.body.message).toBe('Invalid sellingPrice: It must be a number greater than 0');
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0)
        })

        

        
        test("should return 422 for an invalid date format (YYYY-MM-DD)", async () => {
            const testProducts =  {
                model: "iPhone13", 
                category: "Smartphone", 
                quantity: 5, 
                details: "", 
                sellingPrice: 200, 
                arrivalDate: "2024/01/01"
            }

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(); // mock registerProducts

            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).post(baseURL + '/products').send(testProducts);
            expect(response.status).toBe(422);
            expect(response.body.message).toBe('Invalid arrivalDate: It must be a valid date in the format YYYY-MM-DD');
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0)
        })

        test("should return 422 for arrival date after current date", async () => {
            const testProducts =  {
                model: "iPhone13", 
                category: "Smartphone", 
                quantity: 5, 
                details: "", 
                sellingPrice: 200, 
                arrivalDate: "2025-01-01"
            }

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(); // mock registerProducts

            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });

            
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).post(baseURL + '/products').send(testProducts);

            expect(response.status).toBe(422);
            expect(response.body.message).toBe('Invalid arrivalDate: It must be a valid date in the format YYYY-MM-DD and not after the current date');
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0)
        })

        
        test("it should return 409 code when already exist a product with that model in the database", async () =>{
            const testProducts =  {
                model: "iPhone13", 
                category: "Smartphone", 
                quantity: 5, 
                details: "", 
                sellingPrice: 200, 
                arrivalDate: "2024-01-01"
            }
            jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new ProductAlreadyExistsError()); // mock registerProducts
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return next();
            })

            const response = await request(app).post(baseURL + '/products').send(testProducts)
            expect(response.status).toBe(409);
            expect(response.body.error).toBe("The product already exists")
        })
        test("it should return 401 code when the user is not a Manager", async () => {
            const testProducts =  {
                model: "iPhone13", 
                category: "Smartphone", 
                quantity: 5, 
                details: "", 
                sellingPrice: 200, 
                arrivalDate: "2025-01-01"
            }

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(); // mock registerProducts

            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 

                return res.status(401).json({error: "user is not a Manager\n\n"})
            })

            const response = await request(app).post(baseURL + '/products').send(testProducts);
            expect(response.status).toBe(401);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0)
        })

        test("it should return 401 code when the user is not logged in ", async () => {
            const testProducts =  {
                model: "iPhone13", 
                category: "Smartphone", 
                quantity: 5, 
                details: "", 
                sellingPrice: 200, 
                arrivalDate: "2025-01-01"
            }

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce(); // mock registerProducts

            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return res.status(401).json({error: "Unauthenticated user"})
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 

                return next();
            })

            const response = await request(app).post(baseURL + '/products').send(testProducts);
            expect(response.status).toBe(401);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0)
        })

    })
    describe("PATCH /:model/sell - Route for selling a product.", () =>{
        const productController = new ProductController();
        test("should return 200 for a valid request", async () => {
            
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 3,
                sellingDate: "2024-02-01"
            }
            const testProduct = new Product(testProducts.sellingPrice,testProducts.model,Category.SMARTPHONE,
                testProducts.arrivalDate,testProducts.details,testProducts.quantity);
            

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);
            const products = await productController.getProducts('model', null, testProduct.model);
            
            const expectedValue = testProduct.quantity + testChange.quantity;

            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(expectedValue); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProduct.model}/sell`).send(testChange)
            expect(response.status).toBe(200)
            expect(response.body).toEqual({ quantity: expectedValue })


            expect(ProductController.prototype.sellProduct).toHaveBeenCalled()
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(testProduct.model, testChange.quantity, testChange.sellingDate);

            expect(ProductController.prototype.getProducts).toHaveBeenCalled()
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith('model', null, testProduct.model);
            

            
            
        })
        test("it should return a 401 when the user is not a manager", async () => {
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 3,
                sellingDate: "2024-02-01"
            }
            const testProduct = new Product(testProducts.sellingPrice,testProducts.model,Category.SMARTPHONE,
                testProducts.arrivalDate,testProducts.details,testProducts.quantity);
            

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);
            const products = await productController.getProducts('model', null, testProduct.model);
            
            const expectedValue = testProduct.quantity + testChange.quantity;

            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(expectedValue); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return res.status(401).json({error: "user is not a Manager\n\n"})
            })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProduct.model}/sell`).send(testChange)
            expect(response.status).toBe(401)

            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(0)            
            
            
        })

        test("it should return a 401 when the user is not a logged in", async () => {
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 3,
                sellingDate: "2024-02-01"
            }
            const testProduct = new Product(testProducts.sellingPrice,testProducts.model,Category.SMARTPHONE,
                testProducts.arrivalDate,testProducts.details,testProducts.quantity);
            

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);
            const products = await productController.getProducts('model', null, testProduct.model);
            
            const expectedValue = testProduct.quantity + testChange.quantity;

            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(expectedValue); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return res.status(401).json({error: "Unauthenticated user"})
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return next()
            })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProduct.model}/sell`).send(testChange)
            expect(response.status).toBe(401)

            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(0)            
           
            
        })

        test("It should return a 404 error if model does not represent a product in the database", async () => {

            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 3,
                sellingDate: "2024-02-01"
            }
            

            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new ProductNotFoundError()); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next()
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return next()
            })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProducts.model}/sell`).send(testChange)
            expect(response.status).toBe(404)

            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)         
            
            
        })

        test("It should return a 422 error if sellingDate is after the current date ", async () => {
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 3,
                sellingDate: "2025-02-01"
            }
            const testProduct = new Product(testProducts.sellingPrice,testProducts.model,Category.SMARTPHONE,
                testProducts.arrivalDate,testProducts.details,testProducts.quantity);
            

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);
            const products = await productController.getProducts('model', null, testProduct.model);
            
            const expectedValue = testProduct.quantity + testChange.quantity;

            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new DateAfterCurrentDateError()); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProduct.model}/sell`).send(testChange)
            expect(response.status).toBe(422);
            expect(response.body.message).toBe('Invalid sellingDate: It must be a valid date in the format YYYY-MM-DD, not after the current date, and after the arrival date of the product');

            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(0)     

        })

        test("It should return a 400 error if sellingDate is before the product's arrivalDate ", async () => {
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 3,
                sellingDate: "2024-02-01"
            }
            

            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new ChangeDateBeforeArrivalDateError()); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next()
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return next()
            })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProducts.model}/sell`).send(testChange)
            expect(response.status).toBe(400)

            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1)        
            
        })

        test("It should return a 422 error if changeDate is not in the format YYYY-MM-DD", async () => {
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 3,
                sellingDate: "2024/02/01"
            }
            const testProduct = new Product(testProducts.sellingPrice,testProducts.model,Category.SMARTPHONE,
                testProducts.arrivalDate,testProducts.details,testProducts.quantity);
            

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);
            const products = await productController.getProducts('model', null, testProduct.model);
            
            const expectedValue = testProduct.quantity + testChange.quantity;

            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(expectedValue); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProduct.model}/sell`).send(testChange)
            expect(response.status).toBe(422);
            expect(response.body.message).toBe('Invalid sellingDate: It must be a valid date in the format YYYY-MM-DD');

            expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(0)     
               
            
        })

        test("It should return a 422 error if the newQuantity is not a number", async () => {
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: "fakeQuantity",
                sellingDate: "2024-02-01"
            }

            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })


            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProducts.model}/sell`).send(testChange)
            expect(response.status).toBe(422);
            expect(response.body.message).toBe('Invalid quantity: It must be a number greater than 0');

            
        })

        test("It should return a 422 error if the newQuantity is not greater than 0", async () => {
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 0,
                sellingDate: "2024-02-01"
            }

            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })


            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProducts.model}/sell`).send(testChange)
            expect(response.status).toBe(422);
            expect(response.body.message).toBe('Invalid quantity: It must be a number greater than 0');
            
            
        })
        test("It should return a 409 error if model represents a product whose available quantity is 0",async () =>{
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 3,
                sellingDate: "2024-02-01"
            }
            const testProduct = new Product(testProducts.sellingPrice,testProducts.model,Category.SMARTPHONE,
                testProducts.arrivalDate,testProducts.details,0);
            

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);
            const products = await productController.getProducts('model', null, testProduct.model);
            
            const expectedValue = testProduct.quantity + testChange.quantity;

            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new EmptyProductStockError); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProduct.model}/sell`).send(testChange)
            expect(response.status).toBe(409);
            

        })
        test("It should return a 409 error if the available quantity of model is lower than the requested quantity", async () =>{
            const inputParams = {
                model: testProducts.model
            }
            const testChange =  {
                quantity: 20,
                sellingDate: "2024-02-01"
            }
            const testProduct = new Product(testProducts.sellingPrice,testProducts.model,Category.SMARTPHONE,
                testProducts.arrivalDate,testProducts.details,testProducts.quantity);
            

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);
            const products = await productController.getProducts('model', null, testProduct.model);
            
            const expectedValue = testProduct.quantity + testChange.quantity;

            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new LowProductStockError()); 
            // mock the auth methos

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
                req.user = testManager; // set the user in req.user
                return next(); 
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            // We don't need to mock the expressValidator since we already use a customValidator (?)
            const response = await request(app).patch(baseURL + `/products/${testProduct.model}/sell`).send(testChange)
            expect(response.status).toBe(409)

        })





    })
    
   describe("DELETE /products - deletes all products from the database", () =>{
        test("should return 200 for a valid request", async () => {
            const mockDeleteAllProducts = jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testManager
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).delete(baseURL + '/products').send()
            expect(response.status).toBe(200)
            expect(mockDeleteAllProducts).toHaveBeenCalledTimes(1)
            expect(mockDeleteAllProducts).toHaveBeenCalledWith()
        })
        test('It should return a 401 code when the user is not logged in', async () => {

            const mockDeleteAllProducts = jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({error: "Unauthenticated user"})
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return next()
            })

            const response = await request(app).delete(baseURL + '/products').send()
            expect(response.status).toBe(401)
            expect(mockDeleteAllProducts).toHaveBeenCalledTimes(0)
        })

        test('It should return a 401 code when the user is not a manager or an admin', async () => {

            const mockDeleteAllProducts = jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true)
    

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testCustomer
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { 
                return res.status(401).json({error: "user is not a manager or admin"}) 
             })

             const response = await request(app).delete(baseURL + '/products').send()
             expect(response.status).toBe(401)
             expect(mockDeleteAllProducts).toHaveBeenCalledTimes(0)
        })

        test('It should return 503 code whene there is an error', async () => {

            const mockDeleteAllProducts = jest.spyOn(ProductController.prototype, "deleteAllProducts").mockRejectedValueOnce(new Error('Generic error'))

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testManager
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() })

            const response = await request(app).delete(baseURL + '/products').send()
             expect(response.status).toBe(503)
             expect(mockDeleteAllProducts).toHaveBeenCalledTimes(1)

        })
   })

   describe("DELETE /products/:model",()=>{
    test("should return 200 for a valid request", async () => {
        const mockDeleteProduct = jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true);
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testManager;
            return next();
        });
        
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next() });
        
        const response = await request(app).delete(baseURL + `/products/${testProducts.model}`).send();
        expect(response.status).toBe(200);
        expect(mockDeleteProduct).toHaveBeenCalledTimes(1);
        expect(mockDeleteProduct).toHaveBeenCalledWith(testProducts.model);
    });

    test('should return a 401 code when the user is not logged in', async () => {
        const mockDeleteProduct = jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true);
        
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user" });
        });
        
        const response = await request(app).delete(baseURL + `/products/${testProducts.model}`).send();
        expect(response.status).toBe(401);
        expect(mockDeleteProduct).toHaveBeenCalledTimes(0);
    });
    test('should return a 401 code when the user is not a manager or an admin', async () => {
        const mockDeleteProduct = jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true);
        
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = testCustomer;
            return next();
        });
        
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "user is not a manager or admin" });
        });
        
        const response = await request(app).delete(baseURL + `/products/${testProducts.model}`).send();
        expect(response.status).toBe(401);
        expect(mockDeleteProduct).toHaveBeenCalledTimes(0);
    });
    test('should return 404 if the product is not found', async () => {
        const mockDeleteProduct = jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValueOnce(new ProductNotFoundError());
        
        
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            req.user = testManager;
            return next(); });
        
        const response = await request(app).delete(baseURL + `/products/${testProducts.model}`).send();
        expect(response.status).toBe(404);
        expect(mockDeleteProduct).toHaveBeenCalledTimes(1);
    });
    test('should return 503 if there is a server error', async () => {
        const mockDeleteProduct = jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValueOnce(new Error('Generic error'));
        
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            req.user = testManager;
            return next(); });

        
        const response = await request(app).delete(baseURL + `/products/${testProducts.model}`).send();
        expect(response.status).toBe(503);
        expect(mockDeleteProduct).toHaveBeenCalledTimes(1);
    });



   });


})

