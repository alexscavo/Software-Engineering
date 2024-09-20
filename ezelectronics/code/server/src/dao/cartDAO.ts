import db from '../db/db';
import { Cart, ProductInCart } from '../components/cart';
import { Category, Product } from '../components/product';



/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {


    //FUNZIONI PER GET ezelectronics/carts
    /**
     * Function that returns a promise with an array containing the current cart object and the cart ID
     * @param customer The customer username
     * @returns Promise<[Cart, number]> A promise that resolves to an array with the Cart object and its ID
     */

    public getUnpaidCartByCustomer(customer: string): Promise<[Cart, number] | null> {
        return new Promise((resolve, reject) => {
            try {
                //seleziona il primo carrello del costumer loggato, con campo paid false(ce ne solo uno)
                const sql_cart = `SELECT id, customer, paid, paymentDate,total FROM carts WHERE customer = ? AND paid = 0`
                db.get(sql_cart, [customer], (err, row_cart: { id: number; customer: string; paid: boolean; paymentDate: string | null; total: number; }) => {
                    if (err) {
                        reject(err);
                    }
                    if (!row_cart) {
                        return resolve(null);
                    }

                    //seleziona tutti i prodotti inseriti nel carrello, facendo una query sulla tabella products_in_cart.(necessaria per la presenza del campo quantity e per consentire l updatate dei campi del prodotto in maniera pìu semplice)
                    const sql_productInCart = `SELECT model, quantity, category, price FROM products_in_cart WHERE cartId = ?`
                    db.all(sql_productInCart, [row_cart.id], (err, row_product: { model: string; quantity: number; category: string; price: number; }[]) => {
                        if (err) {
                            reject(err);
                        }
                        if (row_product.length === 0) {
                            resolve([new Cart(customer, false, null, 0, []), row_cart.id]);
                        }
                        const products = row_product.map(row => new ProductInCart(row.model, row.quantity, row.category as Category, row.price));
                        resolve([new Cart(row_cart.customer, row_cart.paid, row_cart.paymentDate, row_cart.total, products), row_cart.id]);

                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }


    //FUNZIONI PER POST ezelectronics/carts
    /**
     * Create the current cart for the user
     * @param customer The customer username
     * @returns  Promise<[Cart, number]> A promise that resolves to an array with the Cart object and its ID
     */

    public createCart(customer: string): Promise<[Cart, number]> {
        return new Promise((resolve, reject) => {
            try {
                const sql_createCart = "INSERT INTO carts (customer, paid) VALUES (?, 0)"
                db.run(sql_createCart, [customer], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve([new Cart(customer, false, null, 0, []), this.lastID]);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Increment the quantity field of the product in the products_in_cart table
     * @param cartId The ID of the cart
     * @param model The model of the product
     * @returns Promise<void> A promise that resolves when the quantity is incremented
     */

    public incrementProductQuantity(cardId: number, model: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const sql = "UPDATE products_in_cart SET quantity = quantity + 1 WHERE cartId = ? AND model = ?";
                db.run(sql, [cardId, model], function (err) {
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
     * Add a product to the products_in_cart table
     * @param cartId The ID of the cart
     * @param product The product to add
     * @returns Promise<void> A promise that resolves when the product is added
     */
    public addProductToCart(cartId: number, product: Product): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const sql = "INSERT INTO  products_in_cart (cartId,model,quantity,category,price) VALUES (?, ?, 1, ?, ?)";
                db.run(sql, [cartId, product.model, product.category, product.sellingPrice], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                })
            } catch (error) {
                reject(error);
            }

        })

    }
    /**
     * Update the total of the cart
     * @param cartId The ID of the cart
     * @param price The price to add to the total
     * @returns Promise<void> A promise that resolves when the total is updated
     */
    public updateCartTotal(cartId: number, price: number): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const sql = "UPDATE carts SET total=total+? WHERE id=?";
                db.run(sql, [price, cartId], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        //console.log(cartId, price)
                        resolve();
                    }
                });
            } catch (error) {
                reject(error);
            }
        })
    }

    //FUNZIONI PER GET ezelectronics/carts/history
    /**
     * Function that returns a promise with an array containing the paid carts of the user
     * @param customer The customer username
     * @returns Promise<Cart[]> A promise that resolves to an array of Cart objects
     */
    public getPaidCartByCustomer(customer: string): Promise<Cart[] | []> {
        return new Promise((resolve, reject) => {
            try {
                //seleziona tutti i carreli del custumer pagati con i relativi prodotti(le righe avranno tutte le infeormazioni sul carrello piu tutte quelle sul pordotto nel carrello)
                const sql = `SELECT c.id as cartId, c.customer, c.paid, c.paymentDate, c.total, p.model, p.quantity, p.category, p.price FROM carts c LEFT JOIN products_in_cart p ON c.id = p.cartId WHERE c.customer = ? AND c.paid = 1`;
                db.all(sql, [customer], (err, rows) => {
                    if (err) {
                        return reject(err);
                    }

                    if (rows.length === 0) {
                        return resolve([]);
                    }
                    //coppia chaive valore(mappa)
                    const cartMap = new Map<number, Cart>();
                    rows.forEach((row: { total: number; paymentDate: string; cartId: number; customer: string; paid: boolean; model: string; quantity: number; category: string; price: number; }) => {
                        //controlla se l'id è gia presente nella mappa(ho piu righe con stesso cartId)
                        if (!cartMap.has(row.cartId)) {
                            cartMap.set(row.cartId, new Cart(row.customer, row.paid, row.paymentDate, row.total, []))
                        }
                        const cart = cartMap.get(row.cartId);
                        //il carrello non sarà mai vuoto perchè è tra quelli pagati(puo essere utile per i test)
                        if (row.model) {
                            const product = new ProductInCart(row.model, row.quantity, row.category as Category, row.price);
                            cart.products.push(product);
                        }
                        //           else{
                        //             reject(new EmptyCartError());
                        //        }
                    });
                    resolve(Array.from(cartMap.values()));
                })
            } catch (error) {
                reject(error);
            }

        });
    }
    //FUNZIONI PER DELETE ezelectronics/carts/products/:model
    /**
     * Method to reduce the quantity of a product in the cart
     * @param cartId The ID of the cart
     * @param model The model of the product
     * @returns Promise<void> A promise that resolves when the quantity is decremented
     */
    public decrementProductQuantity(cartId: number, model: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const sql = "UPDATE products_in_cart SET quantity = quantity - 1 WHERE cartId = ? AND model = ?";
                db.run(sql, [cartId, model], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } catch (error) {
                reject(error)
            }
        })
    }


    /**
     * Method to remove a product from the cart
     * @param cartId The ID of the cart
     * @param model The model of the product
     * @returns Promise<void> A promise that resolves when the product is removed
     */
    public removeProductFromCart(cartId: number, model: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const sql = "DELETE FROM products_in_cart WHERE cartId = ? AND model = ?";
                db.run(sql, [cartId, model], function (err) {
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
    };

    /**
      * Method to update the total of the cart
     * @param cartId The ID of the cart
     * @param price The price to subtract from the total
     * @returns Promise<void> A promise that resolves when the total is updated
     */
    public decreaseCartTotal(cartId: number, price: number): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const sql = "UPDATE carts SET total = total - ? WHERE id = ?";
                db.run(sql, [price, cartId], function (err) {
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
    // FUNZIONI PER DELETE ezelectronics/carts/current
    /**
     * Method to remove all products from the cart
     * @param cartId The ID of the cart
     * @returns Promise<void> A promise that resolves when all products are removed
     */

    public clearProductsFromCart(cartId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const sql = "DELETE FROM products_in_cart WHERE cartId = ?"
                db.run(sql, [cartId], function (err) {
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
    * Method to set the total of the cart to 0
     * @param cartId The ID of the cart
     * @returns Promise<void> A promise that resolves when the total is reset
     */
    public resetCartTotal(cartId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const sql = "UPDATE carts SET total = 0 WHERE id = ?";
                db.run(sql, [cartId], function (err) {
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


    //FUNZIONI PER PATCH ezelectronics/carts
    /**
    * Method to set the payment date and the 'paid' flag in the cart
     * @param cartId The ID of the cart
     * @param paymentDate The date of payment 
     * @returns Promise<void> A promise that resolves when the payment date is set
     */

    public setPaymentDate(cartId: number, paymentDate: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const sql = "UPDATE carts SET paid = 1, paymentDate = ? WHERE id = ?";
                db.run(sql, [paymentDate, cartId], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } catch (error) {
                reject(error)
            }
        })

    }

/**
 * Deletes all carts and their associated products from the database.
 * @returns A Promise that resolves when all carts and their associated products have been deleted.
 */
    deleteAllCarts(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const deleteProductsQuery = 'DELETE FROM products_in_cart';
                const deleteCartsQuery = 'DELETE FROM carts';

                db.run(deleteProductsQuery, (err: Error | null) => {
                    if (err) {
                        return reject(err);
                    }

                    db.run(deleteCartsQuery, (err: Error | null) => {
                        if (err) {
                            return reject(err);
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
     * Retrieves all carts from the database.
     * @returns A Promise that resolves to an array of Cart objects.
     */
    getAllCarts(): Promise<Cart[]> {
        return new Promise((resolve, reject) => {
            try {
                //seleziona tutti i carreli del custumer pagati con i relativi prodotti(le righe avranno tutte le infeormazioni sul carrello piu tutte quelle sul pordotto nel carrello)
                const sql = `SELECT c.id as cartId, c.customer, c.paid, c.paymentDate, c.total, p.model, p.quantity, p.category, p.price FROM carts c LEFT JOIN products_in_cart p ON c.id = p.cartId `;
                db.all(sql, (err, rows) => {
                    if (err) {
                        return reject(err);
                    }

                    if (rows.length === 0) {
                        return resolve([]);
                    }
                    //coppia chaive valore(mappa)
                    const cartMap = new Map<number, Cart>();
                    rows.forEach((row: { total: number; paymentDate: string; cartId: number; customer: string; paid: boolean; model: string; quantity: number; category: string; price: number; }) => {
                        //controlla se l'id è gia presente nella mappa(ho piu righe con stesso cartId)
                        if (!cartMap.has(row.cartId)) {
                            cartMap.set(row.cartId, new Cart(row.customer, row.paid, row.paymentDate, row.total, []))
                        }
                        const cart = cartMap.get(row.cartId);

                        if (row.model) {
                            const product = new ProductInCart(row.model, row.quantity, row.category as Category, row.price);
                            cart.products.push(product);
                        }
                    });
                    resolve(Array.from(cartMap.values()));
                })
            } catch (error) {
                reject(error)
            }

        });
    }



}

export default CartDAO