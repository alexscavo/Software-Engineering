import express, { Router } from "express"
import ErrorHandler from "../helper"
import { body, check, param, query } from "express-validator"
import ProductController from "../controllers/productController"
import Authenticator from "./auth"
import { Product } from "../components/product"



const app = express();
const authenticator = new Authenticator(app);

/**
 * Represents a class that defines the routes for handling proposals.
 */
class ProductRoutes {
    private controller: ProductController
    private router: Router
    private errorHandler: ErrorHandler
    private authenticator: Authenticator

    /**
     * Constructs a new instance of the ProductRoutes class.
     * @param {Authenticator} authenticator - The authenticator object used for authentication.
     */
    constructor(authenticator: Authenticator) {
        this.authenticator = authenticator
        this.controller = new ProductController()
        this.router = express.Router()
        this.errorHandler = new ErrorHandler()
        this.initRoutes()
    }

    /**
     * Returns the router instance.
     * @returns The router instance.
     */
    getRouter(): Router {
        return this.router
    }

    /**
     * Initializes the routes for the product router.
     * 
     * @remarks
     * This method sets up the HTTP routes for handling product-related operations such as registering products, registering arrivals, selling products, retrieving products, and deleting products.
     * It can (and should!) apply authentication, authorization, and validation middlewares to protect the routes.
     * 
     */
    initRoutes() {

         /**
         * Route for registering the arrival of a set of products.
         * It requires the user to be logged in and to be either an admin or a manager.
         * It requires the following parameters:
         * - model: string. It cannot be empty and it cannot be repeated in the database.
         * - category: string (one of "Smartphone", "Laptop", "Appliance")
         * - quantity: number. It must be greater than 0.
         * - details: string. It can be empty.
         * - sellingPrice: number. It must be greater than 0.
         * - arrivalDate: string. It can be omitted. If present, it must be a valid date in the format YYYY-MM-DD that is not after the current date
         * It returns a 200 status code if the arrival was registered successfully.
         */
         this.router.post(
            "/",
            this.authenticator.isLoggedIn, // Middleware to check if the user is authenticated
            this.authenticator.isAdminOrManager, // Middleware to check if the user is a manager
            validateProductArrivalMiddleware, // Middleware to validate request parameters
            (req: any, res: any, next: any) => {
                const { model, category, quantity, details, sellingPrice, arrivalDate } = req.body;
                this.controller.registerProducts(model, category, quantity, details, sellingPrice, arrivalDate)
                    .then(() => res.status(200).end())
                    .catch((err) => next(err));
            }
        );

        // Middleware to validate request parameters
        function validateProductArrivalMiddleware(req: any, res: any, next: any) {
            const { model, category, quantity, sellingPrice, arrivalDate, details } = req.body;
            const categories = ["Smartphone", "Laptop", "Appliance"];
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        
            if (!model || typeof model !== 'string' || model.trim() === '') {
                return res.status(422).json({ message: 'Invalid model: It must be a non-empty string' });
            }
            if (!category || typeof category !== 'string' || !categories.includes(category)) {
                return res.status(422).json({ message: `Invalid category: It must be one of ${categories.join(', ')}` });
            }
            if (typeof quantity !== 'number' || quantity <= 0) {
                return res.status(422).json({ message: 'Invalid quantity: It must be a number greater than 0' });
            }
            if (typeof sellingPrice !== 'number' || sellingPrice <= 0) {
                return res.status(422).json({ message: 'Invalid sellingPrice: It must be a number greater than 0' });
            }
            if (arrivalDate) {
                if (!dateRegex.test(arrivalDate) || isNaN(Date.parse(arrivalDate))) {
                    return res.status(422).json({ message: 'Invalid arrivalDate: It must be a valid date in the format YYYY-MM-DD' });
                }
                if (new Date(arrivalDate) > new Date()) {
                    return res.status(400).json({ message: 'Invalid arrivalDate: It cannot be a future date' });
                }
            }
            if (details !== null && typeof details !== 'string') {
                return res.status(422).json({ message: 'Invalid details: It must be a string or null' });
            }
            next();
        }
        
        

        /**
         * Route for registering the increase in quantity of a product.
         * It requires the user to be logged in and to be either an admin or a manager.
         * It requires the product model as a request parameter. The model must be a string and cannot be empty, and it must represent an existing product.
         * It requires the following body parameters:
         * - quantity: number. It must be greater than 0. This number represents the increase in quantity, to be added to the existing quantity.
         * - changeDate: string. It can be omitted. If present, it must be a valid date in the format YYYY-MM-DD that is not after the current date and is after the arrival date of the product.
         * It returns the new quantity of the product.
         */
        this.router.patch(
            "/:model",
            this.authenticator.isLoggedIn, // Middleware to check if the user is authenticated
            this.authenticator.isAdminOrManager, // Middleware to check if the user is a manager
            validateProductQuantityMiddleware, // Middleware to validate request parameters
            (req: any, res: any, next: any) => {
                const { model } = req.params;
                const { quantity, changeDate } = req.body;
                this.controller.changeProductQuantity(model, quantity, changeDate)
                    .then((newQuantity: number) => res.status(200).json({ quantity: newQuantity }))
                    .catch((err) => next(err));
            }
        );

        // Middleware to validate request parameters
        // Middleware to validate request parameters
        function validateProductQuantityMiddleware(req: any, res: any, next: any) {
            const { quantity, changeDate } = req.body;
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            

            if (typeof quantity !== 'number' || quantity <= 0) {
                return res.status(422).json({ message: 'Invalid quantity: It must be a number greater than 0' });
            }

            if (changeDate) {
                
                const dateParts = changeDate.split("-");
                const y = parseInt(dateParts[0], 10);
                const m = parseInt(dateParts[1], 10) - 1; // Months are 0-based in JavaScript Date
                const d = parseInt(dateParts[2], 10);

                const date = new Date(y, m, d);

                if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) {
                    return res.status(422).json({ message: 'Invalid changeDate: It must be a valid date in the format YYYY-MM-DD' });
                } 

                if (!dateRegex.test(changeDate)) {
                    return res.status(422).json({ message: 'Invalid changeDate: It must be a valid date in the format YYYY-MM-DD' });
                }

                const [year, month, day] = changeDate.split('-').map(Number);
                if (isNaN(year) || isNaN(month) || isNaN(day) || day < 1 || day > 31 || new Date(changeDate) > new Date()) { //|| new Date(changeDate) < new Date(req.product.arrivalDate)
                    return res.status(400).json({ message: 'Invalid changeDate: It must be a valid date not after the current date' });
                }

                

                
            }

            next();
        }


        /**
         * Route for selling a product.
         * It requires the user to be logged in and to be either an admin or a manager.
         * It requires the product model as a request parameter. The model must be a string and cannot be empty, and it must represent an existing product.
         * It requires the following body parameters:
         * - quantity: number. It must be greater than 0. This number represents the quantity of units sold. It must be less than or equal to the available quantity of the product.
         * - sellingDate: string. It can be omitted. If present, it must be a valid date in the format YYYY-MM-DD that is not after the current date and is after the arrival date of the product.
         * It returns the new quantity of the product.
         */
        this.router.patch(
            "/:model/sell",
            this.authenticator.isLoggedIn, // Middleware to check if the user is authenticated
            this.authenticator.isAdminOrManager, // Middleware to check if the user is a manager
            validateProductSaleMiddleware, // Middleware to validate request parameters
            (req: any, res: any, next: any) => {
                const { model } = req.params;
                const { quantity, sellingDate } = req.body;
                this.controller.sellProduct(model, quantity, sellingDate)
                    .then((newQuantity: number) => res.status(200).json({ quantity: newQuantity }))
                    .catch((err) => next(err));
            }
        );

        // Middleware to validate request parameters
        // Middleware to validate request parameters
        function validateProductSaleMiddleware(req: any, res: any, next: any) {
            const { quantity, sellingDate } = req.body;
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

            if (typeof quantity !== 'number' || quantity <= 0) {
                return res.status(422).json({ message: 'Invalid quantity: It must be a number greater than 0' });
            }

            if (sellingDate && (!dateRegex.test(sellingDate) || isNaN(Date.parse(sellingDate)))) {
                return res.status(422).json({ message: 'Invalid sellingDate: It must be a valid date in the format YYYY-MM-DD' });
            }

            next();
        }


        /**
         * Route for retrieving all products.
         * It requires the user to be logged in and to be either an admin or a manager
         * It can have the following optional query parameters:
         * - grouping: string. It can be either "category" or "model". If absent, then all products are returned and the other query parameters must also be absent.
         * - category: string. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
         * - model: string. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
         * It returns an array of Product objects.
         */
        this.router.get(
            "/",
            [
                check('grouping').optional().isString(),
                check('category').optional().isString(),
                check('model').optional().isString()
            ],
            this.errorHandler.validateRequest,
            this.authenticator.isLoggedIn, // Middleware to check if the user is authenticated
            this.authenticator.isAdminOrManager, // Middleware to check if the user is either an admin or a manager
            (req: any, res: any, next: any) => {
                this.controller.getProducts(
                    req.query.grouping? req.query.grouping : undefined,
                     req.query.category? req.query.category : undefined, 
                     req.query.model?req.query.model : undefined
                )
                .then((products: Product[]) => res.status(200).json(products))
                .catch((err) => {
                    next(err)
                })}
        )

        /**
         * Route for retrieving all available products.
         * It requires the user to be logged in.
         * It can have the following optional query parameters:
         * - grouping: string. It can be either "category" or "model". If absent, then all products are returned and the other query parameters must also be absent.
         * - category: string. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
         * - model: string. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
         * It returns an array of Product objects.
         */
        this.router.get(
            "/available",
            [
                check('grouping').optional().isString(),
                check('category').optional().isString(),
                check('model').optional().isString()
            ],
            this.errorHandler.validateRequest,
            this.authenticator.isLoggedIn, //dalle API -> Access Constraints: Can only be called by a logged in User
            (req: any, res: any, next: any) => this.controller.getAvailableProducts(req.query.grouping, req.query.category, req.query.model)
                .then((products: Product[]) => res.status(200).json(products))
                .catch((err) => next(err))
        )

        /**
         * Route for deleting all products.
         * It requires the user to be logged in and to be either an admin or a manager.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/",
            this.authenticator.isLoggedIn, // Middleware to check if the user is authenticated
            this.authenticator.isAdminOrManager, // Middleware to check if the user is either an admin or a manager
            (req: any, res: any, next: any) => {
                this.controller.deleteAllProducts()
                    .then(() => res.status(200).end())
                    .catch((err: any) => next(err));
            }
        );

        /**
         * Route for deleting a product.
         * It requires the user to be logged in and to be either an admin or a manager.
         * It requires the product model as a request parameter. The model must be a string and cannot be empty, and it must represent an existing product.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/:model",
            this.authenticator.isAdminOrManager,
            param("model").isString().isEmpty(),
            (req: any, res: any, next: any) => this.controller.deleteProduct(req.params.model)
                .then(() => res.status(200).end())
                .catch((err: any) => next(err))
        )


    }
}

export default ProductRoutes