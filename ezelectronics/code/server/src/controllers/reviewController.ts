import { ProductReview } from "../components/review";
import { User } from "../components/user";
import ReviewDAO from "../dao/reviewDAO";
import ProductDAO from "../dao/productDAO";
import { InvalidCategoryGroupingError, InvalidGroupingError, InvalidModelGroupingError, ProductNotFoundError } from "../errors/productError";
import { Product } from "../components/product";
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError";
import dayjs from "dayjs";

class ReviewController {
    private dao: ReviewDAO
    private productDao: ProductDAO

    constructor() {
        this.dao = new ReviewDAO
        this.productDao = new ProductDAO
    }

    /**
     * Adds a new review for a product
     * @param model The model of the product to review
     * @param user The username of the user who made the review
     * @param score The score assigned to the product, in the range [1, 5]
     * @param comment The comment made by the user
     * @returns A Promise that resolves to nothing
     */
    async addReview(model: string, user: User, score: number, comment: string): Promise<void> {
        //controlla sel il modello corrisponde ad uno esistente nel db;
        const products = await this.productDao.getProducts('model', undefined, model);
        if (products.length === 0) {
            throw new ProductNotFoundError();
        }
        //controlla se l utente ha gia una review
        const existingReviews = await this.dao.getUserProductReview(model, user.username);
        if (existingReviews) {
            throw new ExistingReviewError();
        }
        //crea e salva la review
        const review = new ProductReview(model, user.username, score, dayjs().format('YYYY-MM-DD'), comment);
        await this.dao.addProductReview(review);

    }

    /**
     * Returns all reviews for a product
     * @param model The model of the product to get reviews from
     * @returns A Promise that resolves to an array of ProductReview objects
     */
    async getProductReviews(model: string): Promise<ProductReview[]> {
        // check if the model corresponds to an existing model in the database
        const products = await this.productDao.getProducts('model', undefined, model);
        if (products.length === 0) {
            throw new ProductNotFoundError();
        }

        return this.dao.getProductReviews(model);
    }

    /**
     * Deletes the review made by a user for a product
     * @param model The model of the product to delete the review from
     * @param user The user who made the review to delete
     * @returns A Promise that resolves to nothing
     */
    async deleteReview(model: string, user: User): Promise<void> {
        const products = await this.productDao.getProducts('model', undefined, model);
        if (products.length === 0) {
            throw new ProductNotFoundError();
        }
        //controlla se l utente ha una rewie per il prodotto
        const existingReviews = await this.dao.getUserProductReview(model, user.username);
        if (!existingReviews) {
            throw new NoReviewProductError();
        }

        //rimuovi review
        await this.dao.deleteUserProductReview(model, user.username);
    }

    /**
     * Deletes all reviews for a product
     * @param model The model of the product to delete the reviews from
     * @returns A Promise that resolves to nothing
     */
    async deleteReviewsOfProduct(model: string): Promise<void> {
        try {
            const products = await this.productDao.getProducts('model', undefined, model);
            if (products.length===0) {
                throw new ProductNotFoundError(); //status 404
            }
            await this.dao.deleteReviewsOfProduct(model);
        } catch (error) {
                //console.error('Error deleting reviews of product:', error);
                throw error;
            
        }
    } /**:Promise<void> */ 

    /**
     * Deletes all reviews of all products
     * @returns A Promise that resolves to nothing
     */
    async deleteAllReviews(): Promise<void> {
        try {
            await this.dao.deleteAllReviews();
        } catch (error) {
            //console.error('Error deleting all reviews:', error);
            throw error;
        }
    } /**:Promise<void> */ 
}

export default ReviewController;