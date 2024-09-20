import { resolve } from "path";
import { ProductReview } from "../components/review";
import db from "../db/db"
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError";

/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {

    /**
     * Function to retrieve all the reviews for a given product model
     * @param model the model for which we want to obtain all the reviews
     * @returns a Promise that resolves the list of ProductReviews for that model
     */
    getProductReviews(model: string): Promise<ProductReview[]> {
        return new Promise<ProductReview[]>((resolve, reject) => {
            const sql = 'SELECT * FROM reviews WHERE model = ?';
    
            db.all(sql, [model], (err: Error | null, rows: { model: string; user: string; score: number; date: string; comment: string }[]) => {
                if (err) {
                    reject(err); // Reject with the database error
                } else {
                    try {
                        const products = rows.map((row:any) => new ProductReview(row.model, row.user, row.score, row.date, row.comment));
                        resolve(products); // Resolve with the products array
                    } catch (error) {
                        reject(error); 
                    }
                }
            });
        });
    }
    // Funzioni per POST ezelectronics/reviews/:model

    //prende la review di un utente relativa ad un determinato prodotto prodotto
    /**
     * Method to retrieve a user's review for a specific product
    * @param model The model of the product
    * @param user The user who wrote the review
    * @returns Promise<ProductReview | null> A promise that resolves to the user's review if found, or null if not found
    */
    getUserProductReview(model: string, user: string): Promise<ProductReview | null> {
        return new Promise((resolve, reject) => {
            try {
                const sql = 'SELECT * FROM reviews WHERE model = ? AND user = ?';
                db.get(sql, [model, user], (err, row: any) => {
                    if (err) {
                        reject(err);
                    } else if (!row) {
                        resolve(null);
                    }
                    else {
                        const review = new ProductReview(row.model, row.user, row.score, row.date, row.comment);
                        resolve(review);
                    }
                });
            } catch (error) {
                reject(error)
            }
        });

    }

    /**
     * Method to add a new product review
     * @param review The review to be added
     * @returns Promise<void> A promise that resolves when the review has been added
     */
    addProductReview(review: ProductReview): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const sql = 'INSERT INTO reviews (model, user, score, date, comment) VALUES (?, ?, ?, ?, ?)';
                db.run(sql, [review.model, review.user, review.score, review.date, review.comment], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                })
            } catch (error) {
                reject(error);
            }

        });

    }

    //funzioni per GET ezelectronics/reviews/:model
    /**
    * Deletes a review for a specific product model by a specific user.
    * @param model The model of the product.
    * @param user The username of the user who wrote the review.
    * @returns A Promise that resolves when the review has been deleted.
    */
    deleteUserProductReview(model: string, user: string): Promise<void> {
        return new Promise((resolve, reject) => {

            try {
                const sql = "DELETE FROM reviews WHERE model = ? AND user = ?";
                db.run(sql, [model, user], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } catch (error) {
                reject(error)
            }
        });
    }


    /**
     * Retrieves all reviews for a given product model.
     * @param model The model of the product for which to retrieve reviews.
     * @returns A Promise that resolves to an array of ProductReview objects.
     */
    // getProductReviews(model: string): Promise<ProductReview[]> {

    // }

    /**
     * Deletes all reviews for a specific product model.
     * @param model The model of the product.
     * @returns A Promise that resolves when all reviews for the product have been deleted.
     */
    deleteReviewsOfProduct(model: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const checkQuery = 'SELECT * FROM reviews WHERE model = ?';
                db.all(checkQuery, [model], (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const deleteQuery = 'DELETE FROM reviews WHERE model = ?';
                    db.run(deleteQuery, [model], (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                });
            } catch (error) {
                reject(error)
            }
        });
    }

    /**
     * Deletes all reviews in the database.
     * @returns A Promise that resolves when all reviews have been deleted.
     */
    deleteAllReviews(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const query = 'DELETE FROM reviews';
                db.run(query, [], (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            } catch (error) {
                reject(error)
            }
        });
    }

}

export default ReviewDAO;