import { User } from "../components/user";
import CartDAO from "../dao/cartDAO";
import { Cart } from "../components/cart";
import ProductController from './productController';
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../errors/cartError";
import { EmptyProductStockError, LowProductStockError } from "../errors/productError";
import dayjs from "dayjs";
import ProductDAO from "../dao/productDAO";

/**
 * Represents a controller for managing shopping carts.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class CartController {
    private dao: CartDAO
    private productController: ProductController
    private daoProduct: ProductDAO;

    constructor() {
        this.dao = new CartDAO
        this.productController = new ProductController
        this.daoProduct = new ProductDAO
    }

    /**
     * Adds a product to the user's cart. If the product is already in the cart, the quantity should be increased by 1.
     * If the product is not in the cart, it should be added with a quantity of 1.
     * If there is no current unpaid cart in the database, then a new cart should be created.
     * @param user - The user to whom the product should be added.
     * @param productId - The model of the product to add.
     * @returns A Promise that resolves to `true` if the product was successfully added.
     */
    async addToCart(user: User, model: string): Promise<boolean> {
        try {
            //dettagli del prodotto(utile per verifiacre che il prodotto esista)
            const product = await this.productController.getProducts('model', undefined, model);
            if (product[0].quantity === 0) {
                throw new EmptyProductStockError()
            }
            //prendi carrello non pagato corrente
            let cartTuple = await this.dao.getUnpaidCartByCustomer(user.username);
            //se non esiste lo crea carrello non pagato
            if (!cartTuple) {
                cartTuple = await this.dao.createCart(user.username);
            }
            //cerca il prodotto nel carrello corrente
            const cartProduct = cartTuple[0].products.find((product) => product.model === model);
            if (cartProduct) {
                await this.dao.incrementProductQuantity(cartTuple[1], model);
            } else {
                await this.dao.addProductToCart(cartTuple[1], product[0])
            }
            await this.dao.updateCartTotal(cartTuple[1], product[0].sellingPrice)

            return true;
        } catch (err) {
            throw err;
        }

    }
    /**
     * Retrieves the current cart for a specific user.
     * @param user - The user for whom to retrieve the cart.
     * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
     */
    async getCart(user: User): Promise<Cart> {
        try {
            const cartTuple = await this.dao.getUnpaidCartByCustomer(user.username);
            if (cartTuple === null) {
                return new Cart(user.username, false, null, 0, [])
            } else {
                return cartTuple[0];
            }

        } catch (e) {
            throw e;
        }
    }

    /**
     * Checks out the user's cart. We assume that payment is always successful, there is no need to implement anything related to payment.
     * @param user - The user whose cart should be checked out.
     * @returns A Promise that resolves to `true` if the cart was successfully checked out.
     * 
     */
    async checkoutCart(user: User) /**Promise<Boolean> */ {

        try {
            // Verifica se esiste un carrello non pagato per l'utente
            const cartTuple = await this.dao.getUnpaidCartByCustomer(user.username);
            if (!cartTuple) {
                throw new CartNotFoundError();
            }
            const [cart, cartId] = cartTuple;
            // Controlla se il carrello contiene prodotti
            if (cart.products.length === 0) {
                throw new EmptyCartError();
            }
            // Verifica le quantità disponibili per i prodotti nel carrello
            for (const productInCart of cart.products) {
                //prendo il prodotto dalla tabella dei prodotti per evitare contraddizioni con essa
                const product = (await this.productController.getProducts("model", undefined, productInCart.model))[0];
                if (product.quantity === 0) {
                    throw new EmptyProductStockError();
                } else if (productInCart.quantity > product.quantity) {
                    throw new LowProductStockError();
                } else {
                    // Riduci la quantità disponibile dei prodotti nel magazzino
                    await this.daoProduct.reduceProductQuantity(product.model, productInCart.quantity);
                }
            }
            // Imposta la data di pagamento del carrello
            const paymentDate = dayjs().format('YYYY-MM-DD');
            await this.dao.setPaymentDate(cartId, paymentDate);
            return true;

        }
        catch (err) {
            throw err
        }


    }

    /**
     * Retrieves all paid carts for a specific customer.
     * @param user - The customer for whom to retrieve the carts.
     * @returns A Promise that resolves to an array of carts belonging to the customer.
     * Only the carts that have been checked out should be returned, the current cart should not be included in the result.
     */
    async getCustomerCarts(user: User): Promise<Cart[]> {
        try {
            const carts = await this.dao.getPaidCartByCustomer(user.username);
            return carts
        } catch (err) {
            throw err;
        }

    }

    /**
     * Removes one product unit from the current cart. In case there is more than one unit in the cart, only one should be removed.
     * @param user The user who owns the cart.
     * @param product The model of the product to remove.
     * @returns A Promise that resolves to `true` if the product was successfully removed.
     */
    async removeProductFromCart(user: User, model: string): Promise<boolean> {

        try {
            //verifica se il prodotto esiste
            const product = await this.productController.getProducts('model', undefined, model);

            // Verifica se esiste un carrello non pagato per l'utente
            const cartTuple = await this.dao.getUnpaidCartByCustomer(user.username);
            if (!cartTuple) {
                throw new CartNotFoundError();
            }
            const [cart, cartId] = cartTuple;
            // Verifica se il prodotto è nel carrello
            const cartProduct = cart.products.find((product) => product.model === model);
            if (!cartProduct) {
                throw new ProductNotInCartError();
            }
            if (cartProduct.quantity > 1) {
                // Riduce la quantità del prodotto nel carrello
                await this.dao.decrementProductQuantity(cartId, model);
            } else {
                // Rimuove il prodotto dal carrello 
                await this.dao.removeProductFromCart(cartId, model);
            }
            // Aggiorna il totale del carrello
            await this.dao.decreaseCartTotal(cartId, cartProduct.price);
            return true;

        } catch (err) {
            throw err;
        }
    }


    /**
     * Removes all products from the current cart.
     * @param user - The user who owns the cart.
     * @returns A Promise that resolves to `true` if the cart was successfully cleared.
     */
    async clearCart(user: User): Promise<Boolean> {

        try {
            // Verifica se esiste un carrello non pagato per l'utente
            const cartTuple = await this.dao.getUnpaidCartByCustomer(user.username);
            if (!cartTuple) {
                throw new CartNotFoundError();
            }
            const [cart, cartId] = cartTuple;
            // Elimina tutti i prodotti dal carrello
            await this.dao.clearProductsFromCart(cartId);
            // Imposta il totale del carrello a 0
            await this.dao.resetCartTotal(cartId);

            return true;
        } catch (err) {
            throw err;
        }

    }

    /**
     * Deletes all carts of all users.
     * @returns A Promise that resolves to `true` if all carts were successfully deleted.
     */
    async deleteAllCarts(): Promise<boolean> {
        try {
            await this.dao.deleteAllCarts();
            return true;
        } catch (error) {
            //console.error('Error deleting all carts:', error);
            throw error;
        }
    } 

    /**
     * Retrieves all carts in the database.
     * @returns A Promise that resolves to an array of carts.
     */
    async getAllCarts(): Promise<Cart[]> {
        try {
            const carts = await this.dao.getAllCarts();
            return carts;
        } catch (error) {
            throw error;
        }
    } /*:Promise<Cart[]> */
}

export default CartController