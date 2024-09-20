import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals"

import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import ProductDAO from "../../src/dao/productDAO"
import { Product, Category } from "../../src/components/product";
import { ProductReview } from "../../src/components/review"
import { User, Role } from "../../src/components/user";
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError";
import { ProductNotFoundError } from "../../src/errors/productError";
import dayjs from "dayjs";

const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 1);
const testCustomer = new User('utente', 'utente', 'utente', Role.CUSTOMER, '', '');
const testReview = new ProductReview(testProduct.model, testCustomer.username, 3, dayjs().format('YYYY-MM-DD'), '')



jest.mock("../../src/dao/productDAO");
jest.mock("../../src/dao/reviewDAO");

describe('Review controller functions unit tests', () => {

    beforeEach(() => {
        jest.resetAllMocks()
        jest.restoreAllMocks()
    },20000);
      
    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
    },20000);

    describe('getProductReviews function tests', () => {
        test("It should return an array of reviews for a product model", async () => {
            // productDaoMock = new ProductDAO() as jest.Mocked<ProductDAO>;
            // reviewDaoMock = new ReviewDAO() as jest.Mocked<ReviewDAO>; inutili
            

            const testModel = "Test Model";

            const mockProduct = new Product(
                999,            // sellingPrice
                testModel,      // model
                Category.SMARTPHONE,    // category
                "2024-06-04",   // arrivalDate
                "Test Details", // details
                10              // quantity
            );

            const mockReviews: ProductReview[] = [
                new ProductReview(testModel, "user1", 5, "2024-06-01", "Good product"),
                new ProductReview(testModel, "user2", 3, "2024-06-02", "Not bad")
            ];

            jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([mockProduct]); //By spying on getProducts, Jest can monitor how many times it's called, what arguments are passed to it, and even intercept its return value. We're not just spying on the method but also providing a mock implementation. This means that when getProducts is called during the test, it won't actually execute the real method. Instead, it will return [mockProduct] as if it had retrieved that data from the database.
            jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockResolvedValueOnce(mockReviews);

            const reviewController = new ReviewController();
            const response = await reviewController.getProductReviews(testModel);
            
            expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith('model', undefined, testModel);
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(testModel);
            expect(response).toEqual(mockReviews);
        });

        test("It should throw ProductNotFoundError when the product model does not exist", async () => {
            
            const reviewController = new ReviewController();
            const testModel = "Nonexistent Model";

            jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([]); //By spying on getProducts, Jest can monitor how many times it's called, what arguments are passed to it, and even intercept its return value. We're not just spying on the method but also providing a mock implementation. This means that when getProducts is called during the test, it won't actually execute the real method. Instead, it will return [mockProduct] as if it had retrieved that data from the database.
            
            await expect(reviewController.getProductReviews(testModel)).rejects.toThrow(ProductNotFoundError);

            expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith('model', undefined, testModel);
            expect(ReviewDAO.prototype.getProductReviews).not.toHaveBeenCalled();
        });

    });

    describe('addReview - controller', () => {
        test("It should add the review", async () => { 
        
            jest.spyOn(ReviewDAO.prototype, 'addProductReview').mockResolvedValueOnce();
            const mockGetProducts = jest.spyOn(ProductDAO.prototype, 'getProducts').mockResolvedValueOnce([ testProduct ]);
            const mockGetUserProductReview = jest.spyOn(ReviewDAO.prototype, 'getUserProductReview').mockResolvedValueOnce(null);

        
            const controller = new ReviewController(); 
            const response = await controller.addReview(testReview.model, testCustomer, testReview.score, testReview.comment);
        
            //Check if the createUser method of the DAO has been called once with the correct parameters
            expect(ReviewDAO.prototype.addProductReview).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.addProductReview).toHaveBeenCalledWith(testReview);
        
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testReview.model);
            
            expect(mockGetUserProductReview).toHaveBeenCalledTimes(1);
            expect(mockGetUserProductReview).toHaveBeenCalledWith(testReview.model, testCustomer.username)
        
            expect(response).toBe(undefined);
        })
        
        test("It should throw ProductNotFoundError when the product is not found in the database", async () => {

            jest.spyOn(ReviewDAO.prototype, 'addProductReview').mockResolvedValueOnce();
            const mockGetProducts = jest.spyOn(ProductDAO.prototype, 'getProducts').mockResolvedValueOnce([]);
            const mockGetUserProductReview = jest.spyOn(ReviewDAO.prototype, 'getUserProductReview').mockResolvedValueOnce(null);
            const controller = new ReviewController(); 

            await expect(controller.addReview(testReview.model, testCustomer, testReview.score, testReview.comment)).rejects.toThrow(ProductNotFoundError);
    
            expect(ReviewDAO.prototype.addProductReview).toHaveBeenCalledTimes(0);
        
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testReview.model);
            
            expect(mockGetUserProductReview).toHaveBeenCalledTimes(0);
    
            
            jest.restoreAllMocks();
        })
    
        test("It should throw ExistingReviewError when the user has already left a review for the product", async () => {
    
            jest.spyOn(ReviewDAO.prototype, 'addProductReview').mockResolvedValueOnce();
            const mockGetProducts = jest.spyOn(ProductDAO.prototype, 'getProducts').mockResolvedValueOnce([ testProduct ]);
            const mockGetUserProductReview = jest.spyOn(ReviewDAO.prototype, 'getUserProductReview').mockResolvedValueOnce(testReview);
            const controller = new ReviewController(); 

            await expect(controller.addReview(testReview.model, testCustomer, testReview.score, testReview.comment)).rejects.toThrow(ExistingReviewError);
    
            expect(ReviewDAO.prototype.addProductReview).toHaveBeenCalledTimes(0);
        
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testReview.model);
            
            expect(mockGetUserProductReview).toHaveBeenCalledTimes(1);
            expect(mockGetUserProductReview).toHaveBeenCalledWith(testReview.model, testCustomer.username);
    
            
            jest.restoreAllMocks();
        })
    })
    
    describe('deleteUserProductReview - controller', () => {

        test("It should delete the review of the customer for the product", async () => {
            const mockDeleteUserProductReview = jest.spyOn(ReviewDAO.prototype, 'deleteUserProductReview').mockResolvedValueOnce();
            const mockGetProducts = jest.spyOn(ProductDAO.prototype, 'getProducts').mockResolvedValueOnce([ testProduct ]);
            const mockGetUserProductReview = jest.spyOn(ReviewDAO.prototype, 'getUserProductReview').mockResolvedValueOnce(testReview);

        
            const controller = new ReviewController(); 
            const response = await controller.deleteReview(testReview.model, testCustomer);
        
            //Check if the createUser method of the DAO has been called once with the correct parameters
            expect(mockDeleteUserProductReview).toHaveBeenCalledTimes(1);
            expect(mockDeleteUserProductReview).toHaveBeenCalledWith(testReview.model, testReview.user);
        
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testReview.model);
            
            expect(mockGetUserProductReview).toHaveBeenCalledTimes(1);
            expect(mockGetUserProductReview).toHaveBeenCalledWith(testReview.model, testCustomer.username)
        
            expect(response).toBe(undefined);
        })

        test("It should throw a ProductNotFoundError", async () => {
            const mockDeleteUserProductReview = jest.spyOn(ReviewDAO.prototype, 'deleteUserProductReview').mockResolvedValueOnce();
            const mockGetProducts = jest.spyOn(ProductDAO.prototype, 'getProducts').mockResolvedValueOnce([]);
            const mockGetUserProductReview = jest.spyOn(ReviewDAO.prototype, 'getUserProductReview').mockResolvedValueOnce(testReview);

        
            const controller = new ReviewController(); 
            await expect(controller.deleteReview(testReview.model, testCustomer)).rejects.toThrow(ProductNotFoundError);
        
            expect(mockDeleteUserProductReview).toHaveBeenCalledTimes(0);
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testReview.model)
            expect(mockGetUserProductReview).toHaveBeenCalledTimes(0);
        })

        test("It should throw a NoReviewProductError", async () => {
            const mockDeleteUserProductReview = jest.spyOn(ReviewDAO.prototype, 'deleteUserProductReview').mockResolvedValueOnce();
            const mockGetProducts = jest.spyOn(ProductDAO.prototype, 'getProducts').mockResolvedValueOnce([ testProduct ]);
            const mockGetUserProductReview = jest.spyOn(ReviewDAO.prototype, 'getUserProductReview').mockResolvedValueOnce(null);

        
            const controller = new ReviewController(); 
            await expect(controller.deleteReview(testReview.model, testCustomer)).rejects.toThrow(NoReviewProductError);        

            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testReview.model);

            expect(mockGetUserProductReview).toHaveBeenCalledTimes(1);
            expect(mockGetUserProductReview).toHaveBeenCalledWith(testReview.model, testCustomer.username)

            expect(mockDeleteUserProductReview).toHaveBeenCalledTimes(0);
        })
    })
})