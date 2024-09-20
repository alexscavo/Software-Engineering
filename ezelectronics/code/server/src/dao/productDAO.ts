import { Category, Product } from "../components/product"
import db from "../db/db"
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError, DateAfterCurrentDateError } from "../errors/productError";

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {

    /**
     * Returns all the products present in the database, with optional filtering by either category or model
     * @param grouping optional filtering type: 'category' or 'model'
     * @param category if grouping == category then this field contains the category to filter
     * @param model if gouping == model then this fields contains the model to filter
     * @returns a Promise that resolves the list of products that satisfy the filter
     */
    getProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                let sql = "SELECT * FROM products";
                let params: any[] = [];
    
                if (grouping === 'category') {
                    sql += " WHERE category = ?";
                    params.push(category);
                } else if (grouping === 'model') {
                    sql += " WHERE model = ?";
                    params.push(model);
                }
    
                db.all(sql, params, (err: Error | null, rows: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        const products = rows.map((row: any) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                        resolve(products);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Returns all the available products present in the database, with optional filtering by either category or model
     * @param grouping optional filtering type: 'category' or 'model'
     * @param category if grouping == category then this field contains the category to filter
     * @param model if gouping == model then this fields contains the model to filter
     * @returns a Promise that resolves the list of available products that satisfy the filter
     */
    getAvailableProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                let sql = "SELECT * FROM products";
                let params: any[] = [];
    
                if (grouping === 'category') {
                    sql += " WHERE category = ?";
                    params.push(category);
                } else if (grouping === 'model') {
                    sql += " WHERE model = ?";
                    params.push(model);
                }
    
                db.all(sql, params, (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Filter out products with quantity <= 0
                        const availableProducts = rows.filter((row: any) => row.quantity > 0);
    
                        if (availableProducts.length === 0) { 
                            resolve([]); // Resolve with an empty array if no products are available
                        } else {
                            const products = availableProducts.map((row: any) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                            resolve(products);
                        }
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }


    /**
     * Method to reduce the available quantity of a product
     * @param model The model of the product
     * @param quantity The quantity to reduce
     * @returns Promise<void> A promise that resolves when the quantity has been reduced
     */
    public reduceProductQuantity(model: string, quantity: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE products SET quantity = quantity - ? WHERE model = ?";
            db.run(sql, [quantity, model], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
    * Registers a new product in the database.
    * @param model The model of the product.
    * @param category The category of the product.
    * @param quantity The quantity of the product.
    * @param details Additional details about the product.
    * @param sellingPrice The selling price of the product.
    * @param arrivalDate The arrival date of the product.
    * @returns A Promise that resolves when the product has been registered.
    */
    registerProduct(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<void> {
        const query = `
            INSERT INTO products (model, category, quantity, details, sellingPrice, arrivalDate)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [model, category, quantity, details, sellingPrice, arrivalDate];
        return new Promise<void>((resolve, reject) => {
            db.run(query, values, (err: Error | null) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    /**Customer
     * @param newQuantity The new quantity to be added.
     * @param changeDate The date when the change is made.
     * @returns A Promise that resolves to the updated quantity.
     */
    updateProductQuantity(model: string, newQuantity: number, changeDate: string | null): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            db.get('SELECT quantity FROM products WHERE model = ?', [model], (err: Error | null, row: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!row) {
                    reject(new ProductNotFoundError());
                    return;
                }
                const currentQuantity = row.quantity;
                const updatedQuantity = currentQuantity + newQuantity;

                db.run('UPDATE products SET quantity = ? WHERE model = ?', [updatedQuantity, model], (err: Error | null) => { //va qui changeDate????
                    if (err) { 
                        reject(err);
                        return;
                    }
                    resolve(updatedQuantity);
                });
            });
        });
    }

    /**
     * Sells a product by updating the quantity in the database.
     * @param model The model of the product.
     * @param quantity The quantity to be sold.
     * @param sellingDate The date when the selling is made.
     * @returns A Promise that resolves to the updated quantity.
     */
    sellProduct(model: string, quantity: number, sellingDate: string | null): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            db.get('SELECT quantity FROM products WHERE model = ?', [model], (err: Error | null, row: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!row) {
                    reject(new ProductNotFoundError());
                    return;
                }
                const currentQuantity = row.quantity;
    
                if (currentQuantity === 0) {
                    reject(new EmptyProductStockError());
                    return;
                }
    
                if (currentQuantity < quantity) {
                    reject(new LowProductStockError());
                    return;
                }
    
                const updatedQuantity = currentQuantity - quantity;
    
                // Optional: Check if the selling date is valid (if needed)
                if (sellingDate && new Date(sellingDate) > new Date()) {
                    reject(new DateAfterCurrentDateError());
                    return;
                }
    
                db.run('UPDATE products SET quantity = ? WHERE model = ?', [updatedQuantity, model], (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(updatedQuantity);
                });
            });
        });
    }
    

    /**
     * Deletes all products from the database.
     * @returns A Promise that resolves when all products have been deleted.
     */
    deleteAllProducts(): Promise<void> {
        const query = 'DELETE FROM products';
        return new Promise<void>((resolve, reject) => {
            db.run(query, (err: Error | null) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    /**
     * Deletes a product by model from the database.
     * @param model The model of the product.
     * @returns A Promise that resolves when the product has been deleted.
     */
    deleteProduct(model: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            db.get('SELECT model FROM products WHERE model = ?', [model], (err: Error | null, row: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!row) {
                    reject(new ProductNotFoundError());
                    return;
                }
                db.run('DELETE FROM products WHERE model = ?', [model], (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        });
    }

}

export default ProductDAO