import { describe, test, expect, beforeAll, afterAll, jest, beforeEach, afterEach } from "@jest/globals"

import ReviewDAO from "../../src/dao/reviewDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { ProductReview } from "../../src/components/review"
import dayjs from "dayjs"
import { NoReviewProductError } from "../../src/errors/reviewError"


jest.mock("../../src/db/db.ts")


describe('Review DAO functions unit tests', () => {

    beforeEach(() => {
        jest.resetAllMocks()
        jest.restoreAllMocks()
    },20000);
      
    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
    },20000);

    describe("getProductReviews DAO test", () => {
        const reviewDAO = new ReviewDAO();
    
        test("recensioni trovate con successo", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [
                    { model: "model", user: "username1", score: 5, date: "2023-01-01", comment: "Great product" },
                    { model: "model", user: "username2", score: 4, date: "2023-01-02", comment: "Good product" }
                ]);
                return {} as any;
            });
    
            await expect(reviewDAO.getProductReviews("model")).resolves.toEqual( [
                { model: "model", user: "username1", score: 5, date: "2023-01-01", comment: "Great product" },
                { model: "model", user: "username2", score: 4, date: "2023-01-02", comment: "Good product" }
            ]);
    
            mockDBAll.mockRestore();
        });
    

        test("errore recensioni", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error());
                return {} as any;
            });
    
            await expect(reviewDAO.getProductReviews("model")).rejects.toThrow(Error);
    
            mockDBAll.mockRestore();
        });
    });

    describe("addProductReview - DAO", () => {
        test("Add a product review successfully", async () => {

            const reviewDAO = new ReviewDAO()
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
        
            const review = new ProductReview("modello1", "user1", 4, "29/05/2024", "");
            const result = await reviewDAO.addProductReview(review);    // e' un void
        
            // verifico che l'inserimento sia corretto
            const query = 'SELECT * FROM reviews WHERE model = ? AND user = ?';
            db.get(query, [review.model, review.user], (err, row: any) => {
                if (err) {
                    throw err;
                }
        
                expect(row.model).toBe(review.model);
                expect(row.user).toBe(review.user);
                expect(row.score).toBe(review.score);
                expect(row.comment).toBe(review.comment);
            });
        
            mockDBRun.mockRestore();
        })

        test("Reject with an error when db.run callback contains an error", async () => {

            const reviewDAO = new ReviewDAO()
            const mockError = new Error('Database error');
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });

            const review = new ProductReview("modello1", "user1", 4, "29/05/2024", "");
            
            await expect(reviewDAO.addProductReview(review)).rejects.toThrow('Database error');

            expect(mockDBRun).toHaveBeenCalledTimes(1);

            // Restore the original implementation
            mockDBRun.mockRestore();
        })

        test("Reject with an error when db.run throws an error", async () => {
            const reviewDAO = new ReviewDAO();
            
            // Mock the db.run method to simulate an error
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw new Error("Database error");
            });
        
            const review = new ProductReview("modello1", "user1", 4, "29/05/2024", "");
        
            // Verify that the error is caught and the Promise is rejected
            await expect(reviewDAO.addProductReview(review)).rejects.toThrow();
        
            // Restore the original implementation
            mockDBRun.mockRestore();
        });
        
    })

    describe("deleteUserProductReview - DAO", () => {
        test("It should delete the product from the DAO", async () => {
            const reviewDAO = new ReviewDAO();

            const testInput = {model: 'modello', user: 'user'}

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

            const result = await reviewDAO.deleteUserProductReview(testInput.model, testInput.user)

            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(result).toBe(undefined);

            mockDBRun.mockRestore();
        })

        test("Reject with an error when db.run callback contains an error", async () => {
            const reviewDAO = new ReviewDAO();

            const testInput = {model: 'modello', user: 'user'}
            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)

                
                return {} as Database
            })

            await expect(reviewDAO.deleteUserProductReview(testInput.model, testInput.user)).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);

            mockDBRun.mockRestore();
        })

        test("Reject with an error when db.all throws an error", async () => {
            const reviewDAO = new ReviewDAO();

            const testInput = {model: 'modello', user: 'user'}
            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw mockError;
            })

            await expect(reviewDAO.deleteUserProductReview(testInput.model, testInput.user)).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);

            mockDBRun.mockRestore();
        })
    })

    describe("getUserProductReview - DAO", () =>  {
        test("It should return a product review", async () => {

            const reviewDAO = new ReviewDAO()

            const mockReviewRow = {
                model: 'modello',
                user: 'utente',
                score: 4,
                date: '2024-05-05',
                comment: ''
            }

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, mockReviewRow)
                return {} as Database
            });
        
            const result = await reviewDAO.getUserProductReview('modello', 'utente');    // e' un void
        
            const expectedResult = new ProductReview(
                mockReviewRow.model,
                mockReviewRow.user,
                mockReviewRow.score,
                mockReviewRow.date,
                mockReviewRow.comment
            )

            expect(mockDBGet).toHaveBeenCalledTimes(1)
            expect(result).toEqual(expectedResult)
        
            mockDBGet.mockRestore();
        })

        test("It should return null", async () => {

            const reviewDAO = new ReviewDAO()

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null)
                return {} as Database
            });
        
            const result = await reviewDAO.getUserProductReview('modello', 'utente');    // e' un void

            expect(mockDBGet).toHaveBeenCalledTimes(1)
            expect(result).toBe(null)
        
            mockDBGet.mockRestore();
        })

        test("Reject with an error when db.get callback contains an error", async () => {

            const reviewDAO = new ReviewDAO()

            const mockError = new Error('Database error')

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(mockError)
                return {} as Database
            });
            await expect(reviewDAO.getUserProductReview('modello', 'utente')).rejects.toThrow();    // e' un void
            expect(mockDBGet).toHaveBeenCalledTimes(1)
     
            mockDBGet.mockRestore();
        })

        test("Reject with an error when db.get throws an error", async () => {

            const reviewDAO = new ReviewDAO()

            const mockError = new Error('Database error')

            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                throw mockError;
            });
            await expect(reviewDAO.getUserProductReview('modello', 'utente')).rejects.toThrow();    // e' un void
            expect(mockDBGet).toHaveBeenCalledTimes(1)
     
            mockDBGet.mockRestore();
        })
    })

    describe("deleteReviewsOfProduct - DAO", () => {
        test("It should delete all reviews of a specific product.", async () => {
            const reviewDAO = new ReviewDAO();

            const testInput = {model: 'modello'}
            // Sta roba non dovrebbe essere controllata
            const mockReviewRows = 
                [
                    {
                        model: "modello0",
                        user: "utente1",
                        score: 3,
                        date: dayjs().format('YYYY-MM-DD'),
                        comment: ''
                    },
                    {
                        model: "modello1",
                        user: "utente2",
                        score: 7,
                        date: "2024-01-01",
                        comment: 'bella'
                    }
                ]

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, mockReviewRows)

                return {} as Database
            })

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

        
            const result = await reviewDAO.deleteReviewsOfProduct(testInput.model)

            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            expect(result).toBe(undefined);

            mockDBRun.mockRestore();
            mockDBAll.mockRestore();
        })
        // This should be deleted
        test("Reject with an error when there are no reviews for a product", async () => {
            const reviewDAO = new ReviewDAO();

            const testInput = {model: 'modello'}
            
            
            // Sta roba non dovrebbe essere controllata
            const mockReviewRows = 
                [
                    {
                        model: "modello0",
                        user: "utente1",
                        score: 3,
                        date: dayjs().format('YYYY-MM-DD'),
                        comment: ''
                    },
                    {
                        model: "modello1",
                        user: "utente2",
                        score: 7,
                        date: "2024-01-01",
                        comment: 'bella'
                    }
                ]

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new NoReviewProductError())

                return {} as Database
            })

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

        
            await expect(reviewDAO.deleteReviewsOfProduct(testInput.model)).rejects.toThrow(new NoReviewProductError())

            expect(mockDBRun).toHaveBeenCalledTimes(0);
            expect(mockDBAll).toHaveBeenCalledTimes(1);

            mockDBRun.mockRestore();
            mockDBAll.mockRestore();
        })

        test("should reject with error in db.all", async () => {
            const reviewDAO = new ReviewDAO();

            const testInput = {model: 'modello'}
            
            
            const mockReviewRows = 
                [
                    {
                        model: "modello0",
                        user: "utente1",
                        score: 3,
                        date: dayjs().format('YYYY-MM-DD'),
                        comment: ''
                    },
                    {
                        model: "modello1",
                        user: "utente2",
                        score: 7,
                        date: "2024-01-01",
                        comment: 'bella'
                    }
                ]

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error("Generic error in db.all"));
                return {} as Database
            })

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

        
            await expect(reviewDAO.deleteReviewsOfProduct(testInput.model)).rejects.toThrow("Generic error in db.all")

            expect(mockDBRun).toHaveBeenCalledTimes(0);
            expect(mockDBAll).toHaveBeenCalledTimes(1);

            mockDBRun.mockRestore();
            mockDBAll.mockRestore();
        })
        test("should reject with error in db.all if there is an exception", async () => {
            const reviewDAO = new ReviewDAO();

            const testInput = {model: 'modello'}
            
            const mockError = new Error("Unexpected error");
            
            const mockReviewRows = 
                [
                    {
                        model: "modello0",
                        user: "utente1",
                        score: 3,
                        date: dayjs().format('YYYY-MM-DD'),
                        comment: ''
                    },
                    {
                        model: "modello1",
                        user: "utente2",
                        score: 7,
                        date: "2024-01-01",
                        comment: 'bella'
                    }
                ]

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                throw mockError; // Simula un'eccezione
            })

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

        
            await expect(reviewDAO.deleteReviewsOfProduct(testInput.model)).rejects.toThrow(mockError)

            expect(mockDBRun).toHaveBeenCalledTimes(0);
            expect(mockDBAll).toHaveBeenCalledTimes(1);

            mockDBRun.mockRestore();
            mockDBAll.mockRestore();
        })

        test("should reject with error in db.run", async () => {
            const reviewDAO = new ReviewDAO();

            const testInput = {model: 'modello'}
            
            
            const mockReviewRows = 
                [
                    {
                        model: "modello0",
                        user: "utente1",
                        score: 3,
                        date: dayjs().format('YYYY-MM-DD'),
                        comment: ''
                    },
                    {
                        model: "modello1",
                        user: "utente2",
                        score: 7,
                        date: "2024-01-01",
                        comment: 'bella'
                    }
                ]

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, mockReviewRows)

                return {} as Database

            })

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Generic error in db.run"));
                return {} as Database
            })

        
            await expect(reviewDAO.deleteReviewsOfProduct(testInput.model)).rejects.toThrow("Generic error in db.run")

            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(mockDBAll).toHaveBeenCalledTimes(1);

            mockDBRun.mockRestore();
            mockDBAll.mockRestore();
        })
        test("should reject with error in db.run if there is an exception", async () => {
            const reviewDAO = new ReviewDAO();

            const testInput = {model: 'modello'}
            
            const mockError = new Error("Unexpected error");
            
            const mockReviewRows = 
                [
                    {
                        model: "modello0",
                        user: "utente1",
                        score: 3,
                        date: dayjs().format('YYYY-MM-DD'),
                        comment: ''
                    },
                    {
                        model: "modello1",
                        user: "utente2",
                        score: 7,
                        date: "2024-01-01",
                        comment: 'bella'
                    }
                ]

            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, mockReviewRows)

                return {} as Database
            })

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw mockError
            })

        
            await expect(reviewDAO.deleteReviewsOfProduct(testInput.model)).rejects.toThrow(mockError)

            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(mockDBAll).toHaveBeenCalledTimes(1);

            mockDBRun.mockRestore();
            mockDBAll.mockRestore();
        })
    })

    describe("deleteAllReviews - DAO", () => {
        test("It should delete all reviews ", async () => {
            const reviewDAO = new ReviewDAO();

            const mockReviewRows = 
                [
                    {
                        model: "modello0",
                        user: "utente1",
                        score: 3,
                        date: dayjs().format('YYYY-MM-DD'),
                        comment: ''
                    },
                    {
                        model: "modello1",
                        user: "utente2",
                        score: 7,
                        date: "2024-01-01",
                        comment: 'bella'
                    }
                ]

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

        
            const result = await reviewDAO.deleteAllReviews()

            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(result).toBe(undefined);

            mockDBRun.mockRestore();
        })
        test("should reject with error in db.run", async () => {
            const reviewDAO = new ReviewDAO();

            const mockReviewRows = 
                [
                    {
                        model: "modello0",
                        user: "utente1",
                        score: 3,
                        date: dayjs().format('YYYY-MM-DD'),
                        comment: ''
                    },
                    {
                        model: "modello1",
                        user: "utente2",
                        score: 7,
                        date: "2024-01-01",
                        comment: 'bella'
                    }
                ]

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Generic error in db.run"));

                return {} as Database
            })

        
            await expect(reviewDAO.deleteAllReviews()).rejects.toThrow("Generic error in db.run");

            expect(mockDBRun).toHaveBeenCalledTimes(1);

            mockDBRun.mockRestore();
        })
        test("should reject with error in db.run if there is an exception", async () => {
            const reviewDAO = new ReviewDAO();
            const mockError = new Error("Unexpected error");
            const mockReviewRows = 
                [
                    {
                        model: "modello0",
                        user: "utente1",
                        score: 3,
                        date: dayjs().format('YYYY-MM-DD'),
                        comment: ''
                    },
                    {
                        model: "modello1",
                        user: "utente2",
                        score: 7,
                        date: "2024-01-01",
                        comment: 'bella'
                    }
                ]

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw mockError; // Simula un'eccezione
            })

        
            await expect(reviewDAO.deleteAllReviews()).rejects.toThrow(mockError);

            expect(mockDBRun).toHaveBeenCalledTimes(1);

            mockDBRun.mockRestore();
        })

    })
})