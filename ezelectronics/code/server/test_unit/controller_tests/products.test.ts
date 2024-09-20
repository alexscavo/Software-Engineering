import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals"

import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import ProductDAO from "../../src/dao/productDAO"
import { Product, Category } from "../../src/components/product";
import { ProductReview } from "../../src/components/review"
import { User, Role } from "../../src/components/user";
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError";
import { ProductAlreadyExistsError, ProductNotFoundError,InvalidGroupingError,InvalidCategoryGroupingError,InvalidModelGroupingError,} from "../../src/errors/productError";
import dayjs from "dayjs";
import ProductController from "../../src/controllers/productController";
import { response } from "express";

jest.mock("../../src/dao/productDAO");
jest.mock("../../src/db/db.ts");

const testProducts =  {
    model: "iPhone13", 
    category: "Smartphone", 
    quantity: 5, 
    details: "", 
    sellingPrice: 200, 
    arrivalDate: "2024-01-01"
}


describe('Product controller functions unit tests', () => {
    let productController: ProductController;

    beforeEach(() => {
        jest.resetAllMocks()
        jest.restoreAllMocks()
    },20000);
      
    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
    },20000);



    describe('getProducts tests', () => {

        test("It should return an array of products when grouping is null", async () => {
            const testGrouping: string | null = null;
            const testCategory: string | null = null;
            const testModel: string | null = null;

            // Create mock product data
            const mockProduct = new Product(
                999,            // sellingPrice
                "Test Model",   // model
                Category.SMARTPHONE,    // category
                "2024-06-04",   // arrivalDate
                "Test Details", // details
                10              // quantity
            );

            jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([mockProduct]);

            const controller = new ProductController();
            const response = await controller.getProducts(testGrouping, testCategory, testModel);

            expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith(testGrouping, testCategory, testModel);
            expect(response).toEqual([mockProduct]);
        });

        test("It should return an array of products when grouping is 'category'", async () => {
            const testGrouping: string | null = 'category';
            const testCategory: string | null = 'Smartphone';
            const testModel: string | null = null;

            // Create mock product data
            const mockProduct = new Product(
                999,            // sellingPrice
                "Test Model",   // model
                Category.SMARTPHONE,    // category
                "2024-06-04",   // arrivalDate
                "Test Details", // details
                10              // quantity
            );

            jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([mockProduct]);

            const controller = new ProductController();
            const response = await controller.getProducts(testGrouping, testCategory, testModel);

            expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith(testGrouping, testCategory, testModel);
            expect(response).toEqual([mockProduct]);
        });



        test("It should return an empty array when no products are found", async () => {
            const testGrouping: string | null = null;
            const testCategory: string | null = null;
            const testModel: string | null = null;

            jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([]);

            const controller = new ProductController();
            const response = await controller.getProducts(testGrouping, testCategory, testModel);

            expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith(testGrouping, testCategory, testModel);
            expect(response).toEqual([]);
        });

        test("It should handle database errors correctly", async () => {
            const testGrouping: string | null = null;
            const testCategory: string | null = null;
            const testModel: string | null = null;

            const dbError = new Error("Database error");

            jest.spyOn(ProductDAO.prototype, "getProducts").mockRejectedValueOnce(dbError);

            const controller = new ProductController();

            await expect(controller.getProducts(testGrouping, testCategory, testModel)).rejects.toThrow("Database error");
        });
            });

    describe('getAvailableProducts tests', () => {

        test("It should return an array of available products (quantity>0) when grouping is 'model'", async () => {
            const testGrouping: string | null = "model";
            const testCategory: string | null = null;
            const testModel: string | null = "Test Model";

            const mockProduct = new Product(
                999,            // sellingPrice
                testModel,      // model
                Category.SMARTPHONE,    // category
                "2024-06-04",   // arrivalDate
                "Test Details", // details
                10              // quantity
            );

            jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([mockProduct]);
            jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce([mockProduct]);

            const controller = new ProductController();
            const response = await controller.getAvailableProducts(testGrouping, testCategory, testModel);

            expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledWith(testGrouping, testCategory, testModel);
            expect(response).toEqual([mockProduct]);
        });

        test("It should return an array of available products (quantity>0) when grouping is 'category'", async () => {
            const testGrouping: string | null = "category";
            const testCategory: string | null = "Smartphone";
            const testModel: string | null = null;

            const mockProduct = new Product(
                999,            // sellingPrice
                "Test Model",   // model
                Category.SMARTPHONE,    // category
                "2024-06-04",   // arrivalDate
                "Test Details", // details
                10              // quantity
            );

            jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce([mockProduct]);

            const controller = new ProductController();
            const response = await controller.getAvailableProducts(testGrouping, testCategory, testModel);

            expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledWith(testGrouping, testCategory, testModel);
            expect(response).toEqual([mockProduct]);
        });

        test("It should throw InvalidGroupingError when grouping is null and category or model is provided", async () => {
            const testGrouping: string | null = null;
            const testCategory: string | null = "Smartphone";
            const testModel: string | null = null;

            const controller = new ProductController();

            await expect(controller.getAvailableProducts(testGrouping, testCategory, testModel))
                .rejects
                .toThrow(InvalidGroupingError);
        });

        test("It should throw InvalidCategoryGroupingError when grouping is 'category' but model is provided", async () => {
            const testGrouping: string | null = "category";
            const testCategory: string | null = "Smartphone";
            const testModel: string | null = "Test Model";

            const controller = new ProductController();

            await expect(controller.getAvailableProducts(testGrouping, testCategory, testModel))
                .rejects
                .toThrow(InvalidCategoryGroupingError);
        });

        test("It should throw InvalidModelGroupingError when grouping is 'model' but category is provided", async () => {
            const testGrouping: string | null = "model";
            const testCategory: string | null = "Smartphone";
            const testModel: string | null = "Test Model";

            const controller = new ProductController();

            await expect(controller.getAvailableProducts(testGrouping, testCategory, testModel))
                .rejects
                .toThrow(InvalidModelGroupingError);
        });

        // test("It should throw ProductNotFoundError when no products are found for the given model", async () => {
        //     const testGrouping: string | null = "model";
        //     const testCategory: string | null = null;
        //     const testModel: string | null = "Nonexistent Model";

        //     jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([]);

        //     const controller = new ProductController();

        //     await expect(controller.getAvailableProducts(testGrouping, testCategory, testModel))
        //         .rejects
        //         .toThrow(ProductNotFoundError);
        // });
        });

        
    describe('registerProducts - controller', () => {
        const controller = new ProductController;


        test("it should registers the arrival of a set of products that have the same model.",async  () => {

            const mockRegisterProducts = jest.spyOn(ProductDAO.prototype, 'registerProduct').mockResolvedValueOnce();

            const responce = await controller.registerProducts(testProducts.model,testProducts.category,
                testProducts.quantity,testProducts.details,testProducts.sellingPrice,testProducts.arrivalDate);

            expect(mockRegisterProducts).toHaveBeenCalledTimes(1);
            expect(mockRegisterProducts).toHaveBeenCalledWith(testProducts.model,testProducts.category,
                testProducts.quantity,testProducts.details,testProducts.sellingPrice,testProducts.arrivalDate);

        })
        test("it should throw an error when the product already exists in the database ",async  () => {
            const mockError = new ProductAlreadyExistsError();

            const alreadyExistProduct = new Product(
                testProducts.sellingPrice, testProducts.model,Category.SMARTPHONE,
                testProducts.arrivalDate,testProducts.details,testProducts.quantity);
            // Mock the getProducts to test if product already exist to return 
            // a product already in the db with that model
            const mockGetProducts = jest.spyOn(ProductDAO.prototype, 'getProducts')
                .mockResolvedValueOnce([alreadyExistProduct]);

                
            await expect( controller.registerProducts(testProducts.model,testProducts.category,
                testProducts.quantity,testProducts.details,testProducts.sellingPrice,testProducts.arrivalDate)).rejects.toThrow(mockError);

            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model',undefined,testProducts.model);
            

        })

        test("it should throw an error when registerProduct fails",async  () => {
            const mockError = new Error('Database error');

            const mockRegisterProducts = jest.spyOn(ProductDAO.prototype, 'registerProduct').mockRejectedValueOnce(mockError);

            await expect(controller.registerProducts(testProducts.model,testProducts.category,
                testProducts.quantity,testProducts.details,testProducts.sellingPrice,testProducts.arrivalDate)).rejects.toThrow(mockError);

            expect(mockRegisterProducts).toHaveBeenCalledTimes(1);
            expect(mockRegisterProducts).toHaveBeenCalledWith(testProducts.model,testProducts.category,
                testProducts.quantity,testProducts.details,testProducts.sellingPrice,testProducts.arrivalDate);

        })
    })

    describe('changeProductQuantity - controller', () => {
        const controller = new ProductController;

        const mockChanges = {
            newQuantity: 3,
            changeDate: "2024-02-01"
        }


        test("it should increase the available quantity of a set of products",async  () => {

            const mockProduct = new Product(200,"iPhone13",Category.SMARTPHONE,"2024-01-01","",5);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([mockProduct]);

            const expectedValue = mockProduct.quantity + mockChanges.newQuantity;

            const mockUpdateProductQuantity = jest.spyOn(ProductDAO.prototype, 'updateProductQuantity').mockResolvedValueOnce(expectedValue);

            const responce = await controller.changeProductQuantity(mockProduct.model, mockChanges.newQuantity, mockChanges.changeDate);

            expect(mockUpdateProductQuantity).toHaveBeenCalledTimes(1);
            expect(mockUpdateProductQuantity).toHaveBeenCalledWith(mockProduct.model, mockChanges.newQuantity, mockChanges.changeDate);

            expect(mockGetProducts).toHaveBeenCalledTimes(1);

            expect(responce).toBe(expectedValue);

        })

        test("it should throw an error when DAO updateProductQuantity method throws an error",async  () => {

            const mockProduct = new Product(200,"iPhone13",Category.SMARTPHONE,"2024-01-01","",5);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([mockProduct]);

            const expectedValue = mockProduct.quantity + mockChanges.newQuantity;

            const mockUpdateProductQuantity = jest.spyOn(ProductDAO.prototype, 'updateProductQuantity').mockRejectedValueOnce(new Error("DAO error"));

            await expect(controller.changeProductQuantity(mockProduct.model, mockChanges.newQuantity, mockChanges.changeDate)).rejects.toThrow("DAO error")

            expect(mockUpdateProductQuantity).toHaveBeenCalledTimes(1);
            expect(mockUpdateProductQuantity).toHaveBeenCalledWith(mockProduct.model, mockChanges.newQuantity, mockChanges.changeDate);

        })



        
    })

    describe('sellProduct - controller', () => {
        const controller = new ProductController;

        const mockChanges = {
            newQuantity: 3,
            sellingDate: "2024-02-01"
        }


        test("it should decrease the available quantity of a set of products",async  () => {

            const mockProduct = new Product(200,"iPhone13",Category.SMARTPHONE,"2024-01-01","",5);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([mockProduct]);

            const expectedValue = mockProduct.quantity + mockChanges.newQuantity;

            const mockSellProduct = jest.spyOn(ProductDAO.prototype, 'sellProduct').mockResolvedValueOnce(expectedValue);

            const responce = await controller.sellProduct(mockProduct.model, mockChanges.newQuantity, mockChanges.sellingDate);

            expect(mockSellProduct).toHaveBeenCalledTimes(1);
            expect(mockSellProduct).toHaveBeenCalledWith(mockProduct.model, mockChanges.newQuantity, mockChanges.sellingDate);

            expect(mockGetProducts).toHaveBeenCalledTimes(1);


        })

        test("it should throw an error when DAO updateProductQuantity method throws an error",async  () => {

            const mockProduct = new Product(200,"iPhone13",Category.SMARTPHONE,"2024-01-01","",5);

            const mockGetProducts = jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([mockProduct]);

            const expectedValue = mockProduct.quantity + mockChanges.newQuantity;


            const mockSellProduct = jest.spyOn(ProductDAO.prototype, 'sellProduct').mockRejectedValueOnce(new Error("DAO error"));

            await expect(controller.sellProduct(mockProduct.model, mockChanges.newQuantity, mockChanges.sellingDate)).rejects.toThrow("DAO error")

            expect(mockSellProduct).toHaveBeenCalledTimes(1);
            expect(mockSellProduct).toHaveBeenCalledWith(mockProduct.model, mockChanges.newQuantity, mockChanges.sellingDate);

        })



        
    })
    describe('deleteAllProducts - controller', () =>{
        test("Admin deletes all carts of all users", async () =>{
            const productController = new ProductController();

            jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValueOnce();
            const products = await productController.deleteAllProducts();

            expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);
            
            expect(products).toBe(true);
        });
        test("It should throw an error when DAO deleteAllCarts method throws an error", async () => {
            const productController = new ProductController();

            jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockRejectedValueOnce(new Error("DAO error"));
            await expect(productController.deleteAllProducts()).rejects.toThrow("DAO error");

            expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);

        });
    })

    describe("deleteProduct-controller",()=>{
        productController= new ProductController()
        test("It should return true when the product is successfully deleted", async () => {
            const mockDeleteProduct = jest.spyOn(ProductDAO.prototype, 'deleteProduct').mockResolvedValueOnce();

            const response = await productController.deleteProduct("iPhone13");

            expect(mockDeleteProduct).toHaveBeenCalledTimes(1);
            expect(mockDeleteProduct).toHaveBeenCalledWith("iPhone13");
            expect(response).toBe(true);
        });

        test("It should throw ProductNotFoundError when the product does not exist", async () => {
            const mockError = new ProductNotFoundError();
            jest.spyOn(ProductDAO.prototype, 'deleteProduct').mockRejectedValueOnce(mockError);

            await expect(productController.deleteProduct("iPhone13")).rejects.toThrow(ProductNotFoundError);
            expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledWith("iPhone13");
        });
        test("It should throw an error when the DAO deleteProduct method throws an error", async () => {
            const mockError = new Error("DAO error");
            jest.spyOn(ProductDAO.prototype, 'deleteProduct').mockRejectedValueOnce(mockError);

            await expect(productController.deleteProduct("iPhone13")).rejects.toThrow("DAO error");
            expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledWith("iPhone13");
        });




    });

})