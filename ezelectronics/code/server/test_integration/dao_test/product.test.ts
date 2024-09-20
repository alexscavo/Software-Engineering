import { describe, test, expect, beforeEach, afterEach,afterAll, beforeAll } from "@jest/globals";
import {Category, Product} from "../../src/components/product"
import db from "../../src/db/db";
import ProductDAO from "../../src/dao/productDAO";
import UserDAO from "../../src/dao/userDAO";
import ReviewDAO from "../../src/dao/reviewDAO";
import { UserAlreadyExistsError } from "../../src/errors/userError";
import crypto from "crypto";
import { ProductReview } from "../../src/components/review";
import { User, Role } from "../../src/components/user";
import { DateAfterCurrentDateError, EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../../src/errors/productError";

const sqlInsertProducts = "INSERT INTO products (model, sellingPrice, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)";
const sqlInsertUser = "INSERT INTO users (username, name, surname, password, salt, role, address, birthDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
const sqlGetAllProducts = ""

const insertManager = (username: string) => {
    const salt = crypto.randomBytes(16);
    const hashedPassword = crypto.scryptSync('pw', salt, 16);
    db.run(sqlInsertUser, [username, "Test", "User", hashedPassword, salt, "Manager", "123 Main St", "1990-01-01"]);
}
describe("productDAO integration test with Real Database", () => {
    let productDAO: ProductDAO;


    beforeEach((done) => {
        db.serialize(() => {
            db.run("DELETE FROM products", done);
            db.run("CREATE TABLE IF NOT EXISTS products(model TEXT PRIMARY KEY,sellingPrice REAL NOT NULL,category TEXT NOT NULL, arrivalDate TEXT,details TEXT,quantity INTEGER NOT NULL)");
        });
        productDAO = new ProductDAO();
    },20000);

    afterEach((done) => {
        db.serialize(() => {
            db.run("DELETE FROM products", done);
        });
    },20000);

    describe("reduceProductQuantity",()=>{
        test("It should reduce the quantity of the product", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 5);

            db.serialize(() => {
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
            })
            await productDAO.reduceProductQuantity(testProduct.model, 1)
            
            const products = await productDAO.getProducts('model', null, testProduct.model)
            
            expect(products[0].quantity).toBe(4)
            
        })

        test("It should not reduce the quantity of the product of the product model is not correct", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 5);

            db.serialize(() => {
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
            })
           
            await productDAO.reduceProductQuantity('wrongModel', 1)
            
            const products = await productDAO.getProducts('model', null, testProduct.model)
            
            expect(products[0].quantity).toBe(5)
        })
        
    })

    describe("getProducts", () =>{
        test("It should return an array of products when grouping is undefined", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 5);
            db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
            const products = await productDAO.getProducts(null, null,null );
            expect(products).toEqual([testProduct])
        })
        test("It should return an array of available products when grouping is 'model'", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 5);
            db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
            const products = await productDAO.getProducts('model', null,testProduct.model );
            expect(products).toEqual([testProduct])
        })
        test("It should return an array of available products when grouping is 'category'", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 5);
            db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
            const products = await productDAO.getProducts('cateogory', testProduct.category,null );
            expect(products).toEqual([testProduct])
        })

    })

    describe("registerProduct ", () => {
        test("it should registers a new product in the database", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 5);
            await productDAO.registerProduct(testProduct.model,testProduct.category,
                testProduct.quantity,testProduct.details,testProduct.sellingPrice,
                testProduct.arrivalDate);
            const products = await productDAO.getProducts('model', null,testProduct.model );
            expect(products).toEqual([testProduct])     
        })
    })

    describe("updateProductQuantity - DAO", () => {
        test("it should return the new quantity", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, '2024-01-01', null, 5);
            const quantityToAdd = 5;
            const changeDate = '2024-02-01'
            db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
           
            const expectedQuantity = testProduct.quantity + quantityToAdd;
            const response = await productDAO.updateProductQuantity(testProduct.model,quantityToAdd,changeDate)
            expect(response).toEqual(expectedQuantity)
        })
        test("it should handle product not found", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, '2024-01-01', null, 5);
            const quantityToAdd = 5;
            const changeDate = '2024-02-01'
            const wrongProductModel = "wrongModel"
            db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
           
            const expectedQuantity = testProduct.quantity + quantityToAdd;
            await expect(productDAO.updateProductQuantity(wrongProductModel, quantityToAdd, changeDate)).rejects.toThrow(new ProductNotFoundError());

        })
    })
    describe("sellProduct", () => {
        test("it should return new quantity after sell", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, '2024-01-01', null, 5);
            const quantitySold = 5;
            const changeDate = '2024-02-01'
            db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
           
            const expectedQuantity = testProduct.quantity - quantitySold;
            const response = await productDAO.sellProduct(testProduct.model,quantitySold,changeDate)
            expect(response).toEqual(expectedQuantity)
        })
        test("it should handle product not found", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, '2024-01-01', null, 5);
            const quantitySold = 5;
            const changeDate = '2024-02-01'
            const wrongProductModel = "wrongModel"
            db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
           
            const expectedQuantity = testProduct.quantity - quantitySold;
            await expect(productDAO.sellProduct(wrongProductModel, quantitySold, changeDate)).rejects.toThrow(new ProductNotFoundError());

        })
        test("it should handle quantity of product associated to model equal 0", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, '2024-01-01', null, 0);
            const quantitySold = 5;
            const changeDate = '2024-02-01'
            db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
            await expect(productDAO.sellProduct(testProduct.model, quantitySold, changeDate)).rejects.toThrow(new EmptyProductStockError());
        })
        test("it should handle quantity to sell greater than current quantity", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, '2024-01-01', null, 5);
            const quantitySold = 10;
            const changeDate = '2024-02-01'
            db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);

            await expect(productDAO.sellProduct(testProduct.model, quantitySold, changeDate)).rejects.toThrow(new LowProductStockError());

        })
        test("it should selling Date after current date", async () => {
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, '2024-01-01', null, 5);
            const quantitySold = 10;
            const changeDate = '2024-02-01'
            db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);

            await expect(productDAO.sellProduct(testProduct.model, quantitySold, changeDate)).rejects.toThrow(new DateAfterCurrentDateError());
        })
    })

    describe('getProducts tests', () => {
        const testModel = "Test Model";
        const testProduct = new Product(10, testModel, Category.APPLIANCE, null, null, 5);
    
        test("It should return an array of products when grouping is undefined", async () => {
            db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);

            const products = await productDAO.getProducts(null, null, testProduct.model)
            expect(products).toBeDefined();
            expect(products.length).toBe(1);
        });
    
        // test("It should return an array of products when grouping is 'category'", async () => {
        //     db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);

        //     const products = await productDAO.getProducts('category', null, testProduct.model)
        //     expect(products).toBeDefined();
        //     expect(products.length).toBe(1);
        // });
    
        test("It should return an array of products when grouping is 'model'", async () => {
            db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);

            const products = await productDAO.getProducts('model', null, testProduct.model)
            expect(products).toBeDefined();
            expect(products.length).toBe(1);
        });
    });
    

    describe('getAvailableProducts tests', () => {
        const testModel = "Test Model";
        const testProduct = new Product(10, testModel, Category.APPLIANCE, null, null, 5);
    
        test("It should return an array of available products when grouping is undefined", async () => {
            db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);

            const products = await productDAO.getAvailableProducts(null, null, testProduct.model)
            expect(products).toBeDefined();
            expect(products.length).toBe(1);
        });
    
        // test("It should return an array of available products when grouping is 'category'", async () => {
        //     db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);

        //     const products = await productDAO.getAvailableProducts('category', null, testProduct.model)
        //     expect(products).toBeDefined();
        //     expect(products.length).toBe(1);
        // });
    
        test("It should return an array of available products when grouping is 'model'", async () => {
            db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);

            const products = await productDAO.getAvailableProducts('model', null, testProduct.model)
            expect(products).toBeDefined();
            expect(products.length).toBe(1);
        });
    });
    
    

})