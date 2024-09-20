import { describe, test, expect, beforeAll, afterAll, jest, beforeEach, afterEach } from "@jest/globals"

import ReviewDAO from "../../src/dao/reviewDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { ProductReview } from "../../src/components/review"
import ProductDAO from "../../src/dao/productDAO"
import { Category, Product } from "../../src/components/product"
import { DateAfterCurrentDateError, EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../../src/errors/productError"
import { mock } from "node:test"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

let productDAO: ProductDAO;
productDAO = new ProductDAO();

describe('Product DAO functions unit tests', () => {

    beforeEach(() => {
        jest.resetAllMocks()
        jest.restoreAllMocks()
    },20000);
      
    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
    },20000);


    describe('getProducts tests', () => {
        test("It should return an array of products when grouping is undefined", async () => {
            const testGrouping: string | null = null;
            const testCategory: string | null = null;
            const testModel: string | null = null;

            // Mock data
            const mockProduct = new Product(
                999,
                "Test Model",
                Category.SMARTPHONE,
                "2024-06-04",
                "Test Details",
                10
            );

            // Mock the database response
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [{
                    sellingPrice: mockProduct.sellingPrice,
                    model: mockProduct.model,
                    category: mockProduct.category,
                    arrivalDate: mockProduct.arrivalDate,
                    details: mockProduct.details,
                    quantity: mockProduct.quantity
                }]);
                return {} as Database;
            });

            // Call the method
            const response = await productDAO.getProducts(testGrouping, testCategory, testModel);

            // Assertions
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            expect(mockDBAll).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.any(Function));
            expect(response).toEqual([mockProduct]);
        });

        test("It should return an array of products when grouping is 'category'", async () => {
            const testGrouping: string | null = 'category';
            const testCategory: string | null = 'Smartphone';
            const testModel: string | null = null;

            // Mock data
            const mockProduct = new Product(
                999,
                "Test Model",
                Category.SMARTPHONE,
                "2024-06-04",
                "Test Details",
                10
            );

            // Mock the database response
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [{
                    sellingPrice: mockProduct.sellingPrice,
                    model: mockProduct.model,
                    category: mockProduct.category,
                    arrivalDate: mockProduct.arrivalDate,
                    details: mockProduct.details,
                    quantity: mockProduct.quantity
                }]);
                return {} as Database;
            });

            // Call the method
            const response = await productDAO.getProducts(testGrouping, testCategory, testModel);

            // Assertions
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            expect(mockDBAll).toHaveBeenCalledWith(expect.any(String), [testCategory], expect.any(Function));
            expect(response).toEqual([mockProduct]);
        });

        test("It should return an array of products when grouping is 'model'", async () => {
            const testGrouping: string | null = 'model';
            const testCategory: string | null = null;
            const testModel: string | null = 'Test Model';

            // Mock data
            const mockProduct = new Product(
                999,
                "Test Model",
                Category.SMARTPHONE,
                "2024-06-04",
                "Test Details",
                10
            );

            // Mock the database response
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [{
                    sellingPrice: mockProduct.sellingPrice,
                    model: mockProduct.model,
                    category: mockProduct.category,
                    arrivalDate: mockProduct.arrivalDate,
                    details: mockProduct.details,
                    quantity: mockProduct.quantity
                }]);
                return {} as Database;
            });

            // Call the method
            const response = await productDAO.getProducts(testGrouping, testCategory, testModel);

            // Assertions
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            expect(mockDBAll).toHaveBeenCalledWith(expect.any(String), [testModel], expect.any(Function));
            expect(response).toEqual([mockProduct]);
        });
    });

    describe('getAvailableProducts tests', () => {
        test("It should return an array of available products when grouping is undefined", async () => {
            const testGrouping: string | null = null;
            const testCategory: string | null = null;
            const testModel: string | null = null;

            // Mock data
            const mockProduct = new Product(
                999,
                "Test Model",
                Category.SMARTPHONE,
                "2024-06-04",
                "Test Details",
                10
            );

            // Mock the database response
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [{
                    sellingPrice: mockProduct.sellingPrice,
                    model: mockProduct.model,
                    category: mockProduct.category,
                    arrivalDate: mockProduct.arrivalDate,
                    details: mockProduct.details,
                    quantity: mockProduct.quantity
                }]);
                return {} as Database;
            });

            // Call the method
            const response = await productDAO.getAvailableProducts(testGrouping, testCategory, testModel);

            // Assertions
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            expect(mockDBAll).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.any(Function));
            expect(response).toEqual([mockProduct]);
        });

        test("It should return an array of available products when grouping is 'category'", async () => {
            const testGrouping: string | null = 'category';
            const testCategory: string | null = 'Smartphone';
            const testModel: string | null = null;

            // Mock data
            const mockProduct = new Product(
                999,
                "Test Model",
                Category.SMARTPHONE,
                "2024-06-04",
                "Test Details",
                10
            );

            // Mock the database response
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [{
                    sellingPrice: mockProduct.sellingPrice,
                    model: mockProduct.model,
                    category: mockProduct.category,
                    arrivalDate: mockProduct.arrivalDate,
                    details: mockProduct.details,
                    quantity: mockProduct.quantity
                }]);
                return {} as Database;
            });

            // Call the method
            const response = await productDAO.getAvailableProducts(testGrouping, testCategory, testModel);

            // Assertions
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            expect(mockDBAll).toHaveBeenCalledWith(expect.any(String), [testCategory], expect.any(Function));
            expect(response).toEqual([mockProduct]);
        });

        test("It should return an array of available products when grouping is 'model'", async () => {
            const testGrouping: string | null = 'model';
            const testCategory: string | null = null;
            const testModel: string | null = 'Test Model';

            // Mock data
            const mockProduct = new Product(
                999,
                "Test Model",
                Category.SMARTPHONE,
                "2024-06-04",
                "Test Details",
                10
            );

            // Mock the database response
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [{
                    sellingPrice: mockProduct.sellingPrice,
                    model: mockProduct.model,
                    category: mockProduct.category,
                    arrivalDate: mockProduct.arrivalDate,
                    details: mockProduct.details,
                    quantity: mockProduct.quantity
                }]);
                return {} as Database;
            });

            // Call the method
            const response = await productDAO.getAvailableProducts(testGrouping, testCategory, testModel);

            // Assertions
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            expect(mockDBAll).toHaveBeenCalledWith(expect.any(String), [testModel], expect.any(Function));
            expect(response).toEqual([mockProduct]);
        });
    });

    describe("reduceProductQuantity - DAO", () => {
        test('Remove all the products from the cart', async () => {
            const productDAO = new ProductDAO();

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

            const result = await productDAO.reduceProductQuantity('modello', 1);

            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(result).toBe(undefined)
        }) 

        test('Reject with an error when db.run callback contains an error', async () => {
            const productDAO = new ProductDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)

                return {} as Database
            })

            await expect(productDAO.reduceProductQuantity('modello', 1)).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 

        test('Reject with an error when db.run throws an error', async () => {
            const productDAO = new ProductDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw mockError;
            })

            await expect(productDAO.reduceProductQuantity('modello', 1)).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 
    })
    describe("registerProduct - DAO", () => {
        test("it should registers a new product in the database", async () => {
            const productDAO = new ProductDAO();

            const mockDBRun = jest.spyOn(db,"run").mockImplementation( (sql,params,callback) => {
                callback(null)
                return {} as Database
            });
            
            const product = new Product(200,"iPhone13",Category.SMARTPHONE,"2024-01-01","",5);
            const result = await productDAO.registerProduct(product.model,product.category,product.quantity,
                product.details,product.sellingPrice,product.arrivalDate);

            // Verifico che inserimento sia corretto
            const query = `SELECT * FROM products WHERE model = ?`;
            db.get(query, [product.model], (err, row: any) => {
                if (err) {
                    throw err;
                }

                expect(row.model).toBe(product.model);
                expect(row.category).toBe(product.category);
                expect(row.quanity).toBe(product.quantity);
                expect(row.details).toBe(product.details);
                expect(row.sellingPrice).toBe(product.sellingPrice);
                expect(row.arrivalDate).toBe(product.arrivalDate);

            })

            mockDBRun.mockRestore();
        })

        test("Reject with an error when db.run callback contains an error", async () => {

            const productDAO = new ProductDAO();
            const mockError = new Error('Database error');
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });

            const product = new Product(200,"iPhone13",Category.SMARTPHONE,"2024-01-01","",5);
            
            await expect(productDAO.registerProduct(product.model,product.category,product.quantity,
                product.details,product.sellingPrice,product.arrivalDate)).rejects.toThrow('Database error');

            expect(mockDBRun).toHaveBeenCalledTimes(1);

            // Restore the original implementation
            mockDBRun.mockRestore();
        })

        test("Reject with an error when db.run throws an error", async () => {

            const productDAO = new ProductDAO();
            
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw new Error("Database error");
            });

            const product = new Product(200,"iPhone13",Category.SMARTPHONE,"2024-01-01","",5);
            
            await expect(productDAO.registerProduct(product.model,product.category,product.quantity,
                product.details,product.sellingPrice,product.arrivalDate)).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);

            // Restore the original implementation
            mockDBRun.mockRestore();
        })
        
    })

    describe("updateProductQuantity - DAO", () => {

        const productDAO = new ProductDAO();
        const model = "iPhone 13";
        const newQuantity = 5;
        const changeDate = "2024-01-01";
        const initialQuantity = 10;
        const mockProducts = {
            model: "iPhone 13", 
            category: "Smartphone", 
            quantity: initialQuantity, 
            details: "", 
            sellingPrice: 200, 
            arrivalDate: "2024-01-01"
        };

        test("it should return a Promise with the updated quantity", async () => {

            const expectedUpdatedQuantity = initialQuantity + newQuantity;

            const mockDBGet =jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockProducts);

                return {} as Database;
            });

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);

                return {} as Database;
            });

            const result = await productDAO.updateProductQuantity(model, newQuantity, changeDate);

            expect(result).toBe(expectedUpdatedQuantity);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })

        test("it should handle db.get error", async () => {
            const mockError = new Error("Database error");
    
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                throw mockError;
            });
    
            await expect(productDAO.updateProductQuantity(model, newQuantity, changeDate)).rejects.toThrow(mockError);

            expect(mockDBGet).toHaveBeenCalledTimes(1);
        });
    
        test("it should handle db.run error", async () => {
            const mockError = new Error("Database error");
    
            const mockDBGet =  jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockProducts);
                return {} as Database;
            });
    
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw mockError;
            });
    
            await expect(productDAO.updateProductQuantity(model, newQuantity, changeDate)).rejects.toThrow(mockError);

            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        });
        test("Reject with an error when db.run callback contains an error", async () => {
            const mockError = new Error("Database error");
    
            const mockDBGet =  jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockProducts);
                return {} as Database;
            });
    
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)

                return {} as Database
            });
    
            await expect(productDAO.updateProductQuantity(model, newQuantity, changeDate)).rejects.toThrow(mockError);

            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        });

        test("Reject with an error when db.get callback contains an error", async () => {
            const mockError = new Error("Database error");
    
            const mockDBGet =  jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(mockError)

                return {} as Database
            });
    
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);

                return {} as Database;
            });
    
            await expect(productDAO.updateProductQuantity(model, newQuantity, changeDate)).rejects.toThrow(mockError);

            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(0);
        });
        
        test("it should handle product not found", async () => {

            // The callback row is null so in this case it didn't find any product with that model
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                
                callback(null, null);
                return {} as Database;
            });
    
            await expect(productDAO.updateProductQuantity(model, newQuantity, changeDate)).rejects.toThrow(new ProductNotFoundError());
        });
        
    })

    describe("deleteAllProducts - DAO",() => {
        test('It should return true when all products are successfully deleted', async () => {
            const productDAO = new ProductDAO();
        
            const mockRun = jest.spyOn(db, 'run').mockImplementation((sql, callback) => {
                callback(null);
                return {} as Database;
            });
        
            const response = await productDAO.deleteAllProducts();
        
            expect(mockRun).toHaveBeenCalledTimes(1); 
            expect(response).toBe(undefined);
        
            mockRun.mockRestore();
        })

        test('should reject error', async () => {
            const productDAO = new ProductDAO();
            
            const mockRun = jest.spyOn(db, 'run').mockImplementation((sql, callback) => {
                callback(new Error('Generic error in db.run'));
                return {} as Database
            });
        
            await expect(productDAO.deleteAllProducts()).rejects.toThrow('Generic error in db.run');
        
            expect(mockRun).toHaveBeenCalledTimes(1); 
        
            mockRun.mockRestore();
        })
        test("should reject with an error if there is an exception", async () => {
            const productDAO = new ProductDAO();
            const mockError = new Error("Unexpected error");
            const mockRun = jest.spyOn(db, 'run').mockImplementation((sql, callback) => {
                throw mockError; // Simula un'eccezione
            });
            await expect( productDAO.deleteAllProducts()).rejects.toThrow(mockError);
            expect(mockRun).toHaveBeenCalledTimes(1); 
        
            mockRun.mockRestore();
        });
    })

    describe("sellProduct - DAO", () => {
        const productDAO = new ProductDAO();
        const model = "iPhone 13";
        const newQuantity = 5;
        const changeDate = "2024-01-01";
        const initialQuantity = 10;
        const mockProducts = {
            model: "iPhone 13", 
            category: "Smartphone", 
            quantity: initialQuantity, 
            details: "", 
            sellingPrice: 200, 
            arrivalDate: "2024-01-01"
        };

        test("it should return a Promise with the updated quantity", async () => {

            const expectedUpdatedQuantity = initialQuantity - newQuantity;

            const mockDBGet =jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockProducts);

                return {} as Database;
            });

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);

                return {} as Database;
            });

            const result = await productDAO.sellProduct(model, newQuantity, changeDate);

            expect(result).toBe(expectedUpdatedQuantity);
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        })

        test("it should handle db.get error", async () => {
            const mockError = new Error("Database error");
    
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                throw mockError;
            });
    
            await expect(productDAO.sellProduct(model, newQuantity, changeDate)).rejects.toThrow(mockError);

            expect(mockDBGet).toHaveBeenCalledTimes(1);
        });
    
        test("it should handle db.run error", async () => {
            const mockError = new Error("Database error");
    
            const mockDBGet =  jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockProducts);
                return {} as Database;
            });
    
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw mockError;
            });
    
            await expect(productDAO.sellProduct(model, newQuantity, changeDate)).rejects.toThrow(mockError);

            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        });
        test("Reject with an error when db.run callback contains an error", async () => {
            const mockError = new Error("Database error");
    
            const mockDBGet =  jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockProducts);
                return {} as Database;
            });
    
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)

                return {} as Database
            });
    
            await expect(productDAO.sellProduct(model, newQuantity, changeDate)).rejects.toThrow(mockError);

            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        });

        test("Reject with an error when db.get callback contains an error", async () => {
            const mockError = new Error("Database error");
    
            const mockDBGet =  jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(mockError)

                return {} as Database
            });
    
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);

                return {} as Database;
            });
    
            await expect(productDAO.sellProduct(model, newQuantity, changeDate)).rejects.toThrow(mockError);

            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(0);
        });
        
        test("it should handle product not found", async () => {

            // The callback row is null so in this case it didn't find any product with that model
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                
                callback(null, null);
                return {} as Database;
            });
    
            await expect(productDAO.sellProduct(model, newQuantity, changeDate)).rejects.toThrow(new ProductNotFoundError());
        });

        test("it should handle quantity of product associated to model equal 0", async () => {

            // The callback row is null so in this case it didn't find any product with that model
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                
                callback(null, null);
                return {} as Database;
            });
    
            await expect(productDAO.sellProduct(model, newQuantity, changeDate)).rejects.toThrow(new EmptyProductStockError());
        });

        test("it should handle quantity to sell greater than current quantity", async () => {

            // The callback row is null so in this case it didn't find any product with that model
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                
                callback(null, null);
                return {} as Database;
            });
    
            await expect(productDAO.sellProduct(model, newQuantity, changeDate)).rejects.toThrow(new LowProductStockError());
        });

        test("it should selling Date after current date", async () => {

            // The callback row is null so in this case it didn't find any product with that model
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                
                callback(null, null);
                return {} as Database;
            });
    
            await expect(productDAO.sellProduct(model, newQuantity, changeDate)).rejects.toThrow(new DateAfterCurrentDateError());
        });


        

    });

    describe("deleteProduct-DAO",()=>{
        const productDAO = new ProductDAO();
        const model = "test_model";
        const mockProducts = {
            model: "test_model", 
            category: "Smartphone", 
            quantity: 5, 
            details: "", 
            sellingPrice: 200, 
            arrivalDate: "2024-01-01"
        };
        test('It should resolve when the product is successfully deleted',async ()=>{
            const mockDBGet = jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null,  mockProducts);
                return {} as Database;
            });
            const mockDBRun = jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            await expect(productDAO.deleteProduct(model)).resolves.toBeUndefined();

            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBRun).toHaveBeenCalledTimes(1);
        });
        test('It should reject with an error when db.get returns an error', async () => {
            const mockError = new Error('Database error');

            // Mock the database get response with an error
            jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(mockError, null);
                return {} as Database;
            });

            await expect(productDAO.deleteProduct(model)).rejects.toThrow(mockError);
        });
        test('It should reject with a ProductNotFoundError when the product is not found', async () => {
            // Mock the database get response with no result
            jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });

            await expect(productDAO.deleteProduct(model)).rejects.toThrow(ProductNotFoundError);
        });
        test('It should reject with an error when db.run returns an error', async () => {
            const mockError = new Error('Database error');

            // Mock the database get response
            jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null, { model });
                return {} as Database;
            });

            // Mock the database run response with an error
            jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(mockError);
                return {} as Database;
            });

            await expect(productDAO.deleteProduct(model)).rejects.toThrow(mockError);
        });


    });
})