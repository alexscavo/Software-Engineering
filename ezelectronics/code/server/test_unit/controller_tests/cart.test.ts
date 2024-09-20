import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals"
import CartController from "../../src/controllers/cartController";
import CartDAO from "../../src/dao/cartDAO";
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import ProductDAO from "../../src/dao/productDAO"
import { Product, Category } from "../../src/components/product";
import { ProductReview } from "../../src/components/review"
import { Cart, ProductInCart } from "../../src/components/cart"
import { User, Role } from "../../src/components/user";
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError} from "../../src/errors/cartError";
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError";
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../../src/errors/productError";

import dayjs from "dayjs";
import ProductController from "../../src/controllers/productController"
import { error } from "console"

const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 1);
const testCustomer = new User('utente', 'utente', 'utente', Role.CUSTOMER, '', '');
const testProductInCart = new ProductInCart(testProduct.model, 1, testProduct.category, 10)
const testUnpaidCart = new Cart(testCustomer.username, false, '', testProductInCart.price, [testProductInCart])
const testEmptyCart = new Cart(testCustomer.username, false, null, 0, [])
const testPaidCart = new Cart(testCustomer.username, true, '2024-05-05', testProductInCart.price, [testProductInCart])


jest.mock("../../src/dao/cartDAO");
jest.mock("../../src/db/db.ts");

describe('Cart controller functions unit tests', () => {
    let cartController: CartController;

    beforeEach(() => {
        jest.resetAllMocks()
        jest.restoreAllMocks()
    },20000);
      
    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
    },20000);

    describe('getCart - controller', () => {
        test("It should return the current cart of the user", async () => {
            const controller = new CartController();
            
            const mockGetUnpaiedCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testUnpaidCart, 1])
            
            const response = await controller.getCart(testCustomer)

            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledWith(testCustomer.username)

            expect(response).toEqual(testUnpaidCart)
            
        })

        
        test("It should return an empty cart", async () => {
            const controller = new CartController();
            
            const mockGetUnpaiedCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce(null)
            
            const response = await controller.getCart(testCustomer)

            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledWith(testCustomer.username)

            expect(response).toEqual(testEmptyCart)
            
        })
        // Codice duplicato?
        test("It should return an empty cart", async () => {
            const controller = new CartController();
            
            const mockGetUnpaiedCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testEmptyCart, 1])
            
            const response = await controller.getCart(testCustomer)

            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledWith(testCustomer.username)

            expect(response).toEqual(testEmptyCart)
            
        })

        test("It should throw an error", async () => {
            const controller = new CartController();
            const mockError = new Error('Database error')
            
            const mockGetUnpaiedCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockRejectedValueOnce(mockError)
            
            await expect(controller.getCart(testCustomer)).rejects.toThrow()

            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledWith(testCustomer.username)            
        })
    })

    describe('checkoutCart - controller', () => {
        test('It should return true', async () => {
            const controller = new CartController();

            const testCheckoutCart = {
                cart: testUnpaidCart,
                id: 1
            }

            const mockGetUnpaiedCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCheckoutCart.cart, testCheckoutCart.id])
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct])
            const mockReduceProductQuantity = jest.spyOn(ProductDAO.prototype, 'reduceProductQuantity').mockResolvedValueOnce()
            const mockSetPayementDate = jest.spyOn(CartDAO.prototype, 'setPaymentDate').mockResolvedValueOnce()

            const response = await controller.checkoutCart(testCustomer)

            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledWith(testCustomer.username)

            expect(mockGetProducts).toHaveBeenCalled()
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testCheckoutCart.cart.products[0].model)

            expect(mockReduceProductQuantity).toHaveBeenCalledTimes(1)
            expect(mockReduceProductQuantity).toHaveBeenCalledWith(testCheckoutCart.cart.products[0].model, testCheckoutCart.cart.products[0].quantity)

            expect(mockSetPayementDate).toHaveBeenCalledTimes(1)
            expect(mockSetPayementDate).toHaveBeenCalledWith(testCheckoutCart.id, dayjs().format('YYYY-MM-DD'))
            
            expect(response).toBe(true)

            jest.restoreAllMocks();
        })


        test('It should return a CartNotFoundError', async () => {
            const controller = new CartController();

            const mockGetUnpaiedCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce(null)
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct])
            const mockReduceProductQuantity = jest.spyOn(ProductDAO.prototype, 'reduceProductQuantity').mockResolvedValueOnce()
            const mockSetPayementDate = jest.spyOn(CartDAO.prototype, 'setPaymentDate').mockResolvedValueOnce()

            
            await expect(controller.checkoutCart(testCustomer)).rejects.toThrow(CartNotFoundError)

            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledWith(testCustomer.username)

            expect(mockGetProducts).toHaveBeenCalledTimes(0)
            expect(mockReduceProductQuantity).toHaveBeenCalledTimes(0)
            expect(mockSetPayementDate).toHaveBeenCalledTimes(0) 
            
            jest.restoreAllMocks();
        })

        test('It should throw an error when getUnpaidCartByCustomer fails', async () => {
            const controller = new CartController();

            const mockError = new Error('Database error')
            const mockGetUnpaiedCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockRejectedValueOnce(mockError)
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct])
            const mockReduceProductQuantity = jest.spyOn(ProductDAO.prototype, 'reduceProductQuantity').mockResolvedValueOnce()
            const mockSetPayementDate = jest.spyOn(CartDAO.prototype, 'setPaymentDate').mockResolvedValueOnce()

            
            await expect(controller.checkoutCart(testCustomer)).rejects.toThrow()

            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledWith(testCustomer.username)

            expect(mockGetProducts).toHaveBeenCalledTimes(0)
            expect(mockReduceProductQuantity).toHaveBeenCalledTimes(0)
            expect(mockSetPayementDate).toHaveBeenCalledTimes(0) 
            
            jest.restoreAllMocks();
        })

        test('It should return a EmptyCartError', async () => {
            const controller = new CartController();

            const testCheckoutCart = {
                cart: testEmptyCart,
                id: 1
            }

            const mockGetUnpaiedCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCheckoutCart.cart, testCheckoutCart.id])
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct])
            const mockReduceProductQuantity = jest.spyOn(ProductDAO.prototype, 'reduceProductQuantity').mockResolvedValueOnce()
            const mockSetPayementDate = jest.spyOn(CartDAO.prototype, 'setPaymentDate').mockResolvedValueOnce()


            await expect(controller.checkoutCart(testCustomer)).rejects.toThrow(EmptyCartError)

            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledWith(testCustomer.username)

            expect(mockGetProducts).toHaveBeenCalledTimes(0)
            expect(mockReduceProductQuantity).toHaveBeenCalledTimes(0)
            expect(mockSetPayementDate).toHaveBeenCalledTimes(0)  

            jest.restoreAllMocks();
        })


        test('It should return a EmptyProductStockError', async () => {
            const controller = new CartController();

            const testEmptyProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 0);

            const testCheckoutCart = {
                cart: testUnpaidCart,
                id: 1
            }

            const mockGetUnpaiedCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCheckoutCart.cart, testCheckoutCart.id])
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testEmptyProduct])
            const mockReduceProductQuantity = jest.spyOn(ProductDAO.prototype, 'reduceProductQuantity').mockResolvedValueOnce()
            const mockSetPayementDate = jest.spyOn(CartDAO.prototype, 'setPaymentDate').mockResolvedValueOnce()

            await expect(controller.checkoutCart(testCustomer)).rejects.toThrow(EmptyProductStockError)

            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledWith(testCustomer.username)

            expect(mockGetProducts).toHaveBeenCalled()
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testCheckoutCart.cart.products[0].model)

            expect(mockReduceProductQuantity).toHaveBeenCalledTimes(0)
            expect(mockSetPayementDate).toHaveBeenCalledTimes(0)

            jest.restoreAllMocks();
        })

        test('It should return a LowProductStockError', async () => {
            const controller = new CartController();

            const testProduct1 = new Product(10, 'modello', Category.APPLIANCE, null, null, 1);
            const testProductInCart1 = new ProductInCart(testProduct1.model, 2, testProduct1.category, 10)
            const testUnpaidCart1 = new Cart(testCustomer.username, false, '2024-05-05', testProductInCart1.price, [testProductInCart1])

            const testCheckoutCart = {
                cart: testUnpaidCart1,
                id: 1
            }

            const mockGetUnpaiedCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCheckoutCart.cart, testCheckoutCart.id])
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct1])
            const mockReduceProductQuantity = jest.spyOn(ProductDAO.prototype, 'reduceProductQuantity').mockResolvedValueOnce()
            const mockSetPayementDate = jest.spyOn(CartDAO.prototype, 'setPaymentDate').mockResolvedValueOnce()

            await expect(controller.checkoutCart(testCustomer)).rejects.toThrow(LowProductStockError)

            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledWith(testCustomer.username)

            expect(mockGetProducts).toHaveBeenCalled()
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testCheckoutCart.cart.products[0].model)

            expect(mockReduceProductQuantity).toHaveBeenCalledTimes(0)
            expect(mockSetPayementDate).toHaveBeenCalledTimes(0)

            jest.restoreAllMocks();
        })

        test('It should throw an error when getProducts fails', async () => {
            const controller = new CartController();

            const mockError = new Error('Generic error')

            const testProduct1 = new Product(10, 'modello', Category.APPLIANCE, null, null, 1);
            const testProductInCart1 = new ProductInCart(testProduct1.model, 2, testProduct1.category, 10)
            const testUnpaidCart1 = new Cart(testCustomer.username, false, '2024-05-05', testProductInCart1.price, [testProductInCart1])

            const testCheckoutCart = {
                cart: testUnpaidCart1,
                id: 1
            }

            const mockGetUnpaiedCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCheckoutCart.cart, testCheckoutCart.id])
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockRejectedValue(mockError)
            const mockReduceProductQuantity = jest.spyOn(ProductDAO.prototype, 'reduceProductQuantity').mockResolvedValueOnce()
            const mockSetPayementDate = jest.spyOn(CartDAO.prototype, 'setPaymentDate').mockResolvedValueOnce()

            await expect(controller.checkoutCart(testCustomer)).rejects.toThrow()

            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledWith(testCustomer.username)

            expect(mockGetProducts).toHaveBeenCalled()
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testCheckoutCart.cart.products[0].model)

            expect(mockReduceProductQuantity).toHaveBeenCalledTimes(0)
            expect(mockSetPayementDate).toHaveBeenCalledTimes(0)

            jest.restoreAllMocks();
        })
    
    
        test('It should throw an error when reduceProductQuantity fails', async () => {
            const controller = new CartController();

            const mockError = new Error('Database error')

            const testCheckoutCart = {
                cart: testUnpaidCart,
                id: 1
            }

            const mockGetUnpaiedCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCheckoutCart.cart, testCheckoutCart.id])
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct])
            const mockReduceProductQuantity = jest.spyOn(ProductDAO.prototype, 'reduceProductQuantity').mockRejectedValueOnce(mockError)
            const mockSetPayementDate = jest.spyOn(CartDAO.prototype, 'setPaymentDate').mockResolvedValueOnce()

            await expect(controller.checkoutCart(testCustomer)).rejects.toThrow()

            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledWith(testCustomer.username)

            expect(mockGetProducts).toHaveBeenCalled()
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testCheckoutCart.cart.products[0].model)

            expect(mockReduceProductQuantity).toHaveBeenCalledTimes(1)
            expect(mockReduceProductQuantity).toHaveBeenCalledWith(testCheckoutCart.cart.products[0].model, testCheckoutCart.cart.products[0].quantity)

            expect(mockSetPayementDate).toHaveBeenCalledTimes(0)

            jest.restoreAllMocks();
        })
        
        
        test('It should throw an error when setPaymentDate fails', async () => {
            const controller = new CartController();

            const testCheckoutCart = {
                cart: testUnpaidCart,
                id: 1
            }

            const mockError = new Error('Database error')

            const mockGetUnpaiedCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCheckoutCart.cart, testCheckoutCart.id])
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct])
            const mockReduceProductQuantity = jest.spyOn(ProductDAO.prototype, 'reduceProductQuantity').mockResolvedValueOnce()
            const mockSetPayementDate = jest.spyOn(CartDAO.prototype, 'setPaymentDate').mockRejectedValueOnce(mockError)

            await expect(controller.checkoutCart(testCustomer)).rejects.toThrow()

            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaiedCartByCustomer).toHaveBeenCalledWith(testCustomer.username)

            expect(mockGetProducts).toHaveBeenCalled()
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testCheckoutCart.cart.products[0].model)

            expect(mockReduceProductQuantity).toHaveBeenCalledTimes(1)
            expect(mockReduceProductQuantity).toHaveBeenCalledWith(testCheckoutCart.cart.products[0].model, testCheckoutCart.cart.products[0].quantity)

            expect(mockSetPayementDate).toHaveBeenCalledTimes(1)
            expect(mockSetPayementDate).toHaveBeenCalledWith(testCheckoutCart.id, dayjs().format('YYYY-MM-DD'))

            jest.restoreAllMocks();
        })
    })

    describe('clearCart - controller', () => {
        test('It should return true', async () => {
            const controller = new CartController();
    
            const testCheckoutCart = {
                cart: testUnpaidCart,
                id: 1
            }
    
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCheckoutCart.cart, testCheckoutCart.id])
            const mockClearProductsFromCart = jest.spyOn(CartDAO.prototype, 'clearProductsFromCart').mockResolvedValueOnce()
            const mockResetCartTotal = jest.spyOn(CartDAO.prototype, 'resetCartTotal').mockResolvedValueOnce()
    
            const response = await controller.clearCart(testCustomer)
    
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username)
    
            expect(mockClearProductsFromCart).toHaveBeenCalledTimes(1)
            expect(mockClearProductsFromCart).toHaveBeenCalledWith(testCheckoutCart.id)
    
            expect(mockResetCartTotal).toHaveBeenCalledTimes(1)
            expect(mockResetCartTotal).toHaveBeenCalledWith(testCheckoutCart.id)
            
            expect(response).toBe(true)
    
            jest.restoreAllMocks();
        })
    
        test('It should return a CartNotFoundError', async () => {
            const controller = new CartController();
    
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce(null)
            const mockClearProductsFromCart = jest.spyOn(CartDAO.prototype, 'clearProductsFromCart').mockResolvedValueOnce()
            const mockResetCartTotal = jest.spyOn(CartDAO.prototype, 'resetCartTotal').mockResolvedValueOnce()
    
            await expect(controller.clearCart(testCustomer)).rejects.toThrow(CartNotFoundError)
    
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username)
    
            expect(mockClearProductsFromCart).toHaveBeenCalledTimes(0)
            expect(mockResetCartTotal).toHaveBeenCalledTimes(0) 
            
            jest.restoreAllMocks();
        })
    
        test('It should throw an error when getUnpaidCartByCustomer fails', async () => {
            const controller = new CartController();
    
            const mockError = new Error('Database error')
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockRejectedValueOnce(mockError)
            const mockClearProductsFromCart = jest.spyOn(CartDAO.prototype, 'clearProductsFromCart').mockResolvedValueOnce()
            const mockResetCartTotal = jest.spyOn(CartDAO.prototype, 'resetCartTotal').mockResolvedValueOnce()
    
            await expect(controller.clearCart(testCustomer)).rejects.toThrow(mockError)
    
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username)
    
            expect(mockClearProductsFromCart).toHaveBeenCalledTimes(0)
            expect(mockResetCartTotal).toHaveBeenCalledTimes(0) 
            
            jest.restoreAllMocks();
        })
    
        test('It should throw an error when clearProductsFromCart fails', async () => {
            const controller = new CartController();
    
            const mockError = new Error('Database error')
            const testCheckoutCart = {
                cart: testUnpaidCart,
                id: 1
            }
    
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCheckoutCart.cart, testCheckoutCart.id])
            const mockClearProductsFromCart = jest.spyOn(CartDAO.prototype, 'clearProductsFromCart').mockRejectedValueOnce(mockError)
            const mockResetCartTotal = jest.spyOn(CartDAO.prototype, 'resetCartTotal').mockResolvedValueOnce()
    
            await expect(controller.clearCart(testCustomer)).rejects.toThrow(mockError)
    
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username)
    
            expect(mockClearProductsFromCart).toHaveBeenCalledTimes(1)
            expect(mockClearProductsFromCart).toHaveBeenCalledWith(testCheckoutCart.id)
    
            expect(mockResetCartTotal).toHaveBeenCalledTimes(0) 
            
            jest.restoreAllMocks();
        })
    
        test('It should throw an error when resetCartTotal fails', async () => {
            const controller = new CartController();
    
            const mockError = new Error('Database error')
            const testCheckoutCart = {
                cart: testUnpaidCart,
                id: 1
            }
    
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCheckoutCart.cart, testCheckoutCart.id])
            const mockClearProductsFromCart = jest.spyOn(CartDAO.prototype, 'clearProductsFromCart').mockResolvedValueOnce()
            const mockResetCartTotal = jest.spyOn(CartDAO.prototype, 'resetCartTotal').mockRejectedValueOnce(mockError)
    
            await expect(controller.clearCart(testCustomer)).rejects.toThrow(mockError)
    
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1)
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username)
    
            expect(mockClearProductsFromCart).toHaveBeenCalledTimes(1)
            expect(mockClearProductsFromCart).toHaveBeenCalledWith(testCheckoutCart.id)
    
            expect(mockResetCartTotal).toHaveBeenCalledTimes(1)
            expect(mockResetCartTotal).toHaveBeenCalledWith(testCheckoutCart.id) 
            
            jest.restoreAllMocks();
        })
    })

    describe('getCustomerCarts - controller', () => {
        test('It should return an array of carts', async () => {
            const controller = new CartController();

            const testPaidCart1 = new Cart(testCustomer.username, true, '2024-05-05', 10, [testProductInCart])
            const testPaidCart2 = new Cart(testCustomer.username, true, '2024-05-05', 10, [testProductInCart])
            
            const testCarts = [testPaidCart1, testPaidCart2]; // Assuming testPaidCart1 and testPaidCart2 are predefined Cart objects
    
            const mockGetPaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getPaidCartByCustomer").mockResolvedValueOnce(testCarts);
    
            const response = await controller.getCustomerCarts(testCustomer);
    
            expect(mockGetPaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetPaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);
            
            expect(response).toBe(testCarts);
    
            jest.restoreAllMocks();
        })
    
        test('It should return an empty array if no carts are found', async () => {
            const controller = new CartController();
    
            const mockGetPaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getPaidCartByCustomer").mockResolvedValueOnce([]);
    
            const response = await controller.getCustomerCarts(testCustomer);
    
            expect(mockGetPaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetPaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);
            
            expect(response).toEqual([]);
    
            jest.restoreAllMocks();
        })
    
        test('It should throw an error when getPaidCartByCustomer fails', async () => {
            const controller = new CartController();
    
            const mockError = new Error('Database error');
            const mockGetPaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getPaidCartByCustomer").mockRejectedValueOnce(mockError);
    
            await expect(controller.getCustomerCarts(testCustomer)).rejects.toThrow(mockError);
    
            expect(mockGetPaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetPaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);
    
            jest.restoreAllMocks();
        })
    })
    
    describe('removeProductFromCart - controller', () => {
        test('It should return true when a product is removed from the cart successfully', async () => {
            const controller = new CartController();
    
            const testProductModel = 'testModel';
            const testProduct = new Product(10, testProductModel, Category.APPLIANCE, null, null, 5);
            const testCartProduct = new ProductInCart(testProduct.model, 1, testProduct.category, 10);
            const testCart = new Cart(testCustomer.username, false, '2024-05-05', testCartProduct.price, [testCartProduct]);
            const testCartId = 1;
    
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCart, testCartId]);
            const mockRemoveProductFromCart = jest.spyOn(CartDAO.prototype, 'removeProductFromCart').mockResolvedValueOnce();
            const mockDecreaseCartTotal = jest.spyOn(CartDAO.prototype, 'decreaseCartTotal').mockResolvedValueOnce();
    
            const response = await controller.removeProductFromCart(testCustomer, testProductModel);
    
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProductModel);
    
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);
    
            expect(mockRemoveProductFromCart).toHaveBeenCalledTimes(1);
            expect(mockRemoveProductFromCart).toHaveBeenCalledWith(testCartId, testProductModel);
    
            expect(mockDecreaseCartTotal).toHaveBeenCalledTimes(1);
            expect(mockDecreaseCartTotal).toHaveBeenCalledWith(testCartId, testCartProduct.price);
    
            expect(response).toBe(true);
    
            jest.restoreAllMocks();
        })
    
        test('It should return true when a product quantity is decremented in the cart', async () => {
            const controller = new CartController();
    
            const testProductModel = 'testModel';
            const testProduct = new Product(10, testProductModel, Category.APPLIANCE, null, null, 5);
            const testCartProduct = new ProductInCart(testProduct.model, 2, testProduct.category, 10);
            const testCart = new Cart(testCustomer.username, false, '2024-05-05', testCartProduct.price, [testCartProduct]);
            const testCartId = 1;
    
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCart, testCartId]);
            const mockDecrementProductQuantity = jest.spyOn(CartDAO.prototype, 'decrementProductQuantity').mockResolvedValueOnce();
            const mockDecreaseCartTotal = jest.spyOn(CartDAO.prototype, 'decreaseCartTotal').mockResolvedValueOnce();
    
            const response = await controller.removeProductFromCart(testCustomer, testProductModel);
    
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProductModel);
    
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);
    
            expect(mockDecrementProductQuantity).toHaveBeenCalledTimes(1);
            expect(mockDecrementProductQuantity).toHaveBeenCalledWith(testCartId, testProductModel);
    
            expect(mockDecreaseCartTotal).toHaveBeenCalledTimes(1);
            expect(mockDecreaseCartTotal).toHaveBeenCalledWith(testCartId, testCartProduct.price);
    
            expect(response).toBe(true);
    
            jest.restoreAllMocks();
        })
    
        test('It should throw a CartNotFoundError when there is no unpaid cart for the user', async () => {
            const controller = new CartController();
    
            const testProductModel = 'testModel';
            const testProduct = new Product(10, testProductModel, Category.APPLIANCE, null, null, 5);
    
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce(null);
    
            await expect(controller.removeProductFromCart(testCustomer, testProductModel)).rejects.toThrow(CartNotFoundError);
    
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProductModel);
    
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);
    
            jest.restoreAllMocks();
        })

        test('It should throw an error when getUnpaidCartByCustomer fails', async () => {
            const controller = new CartController();
        
            const testProductModel = 'testModel';
            const mockError = new Error('Database error');
        
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([new Product(10, testProductModel, Category.APPLIANCE, null, null, 5)]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockRejectedValueOnce(mockError);
            const mockDecrementProductQuantity = jest.spyOn(CartDAO.prototype, 'decrementProductQuantity').mockResolvedValueOnce();
            const mockRemoveProductFromCart = jest.spyOn(CartDAO.prototype, 'removeProductFromCart').mockResolvedValueOnce();
            const mockDecreaseCartTotal = jest.spyOn(CartDAO.prototype, 'decreaseCartTotal').mockResolvedValueOnce();
        
            await expect(controller.removeProductFromCart(testCustomer, testProductModel)).rejects.toThrow(mockError);
        
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProductModel);
        
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);
        
            expect(mockDecrementProductQuantity).toHaveBeenCalledTimes(0);
            expect(mockRemoveProductFromCart).toHaveBeenCalledTimes(0);
            expect(mockDecreaseCartTotal).toHaveBeenCalledTimes(0);
        
            jest.restoreAllMocks();
        })
        
    
        test('It should throw a ProductNotInCartError when the product is not in the cart', async () => {
            const controller = new CartController();
    
            const testProductModel = 'testModel';
            const testProduct = new Product(10, testProductModel, Category.APPLIANCE, null, null, 5);
            const testCart = new Cart(testCustomer.username, false, '2024-05-05', 0, []);
    
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCart, 1]);
    
            await expect(controller.removeProductFromCart(testCustomer, testProductModel)).rejects.toThrow(ProductNotInCartError);
    
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProductModel);
    
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);
    
            jest.restoreAllMocks();
        })
    
        test('It should throw an error when getProducts fails', async () => {
            const controller = new CartController();
    
            const testProductModel = 'testModel';
            const mockError = new Error('Database error');
    
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockRejectedValueOnce(mockError);
    
            await expect(controller.removeProductFromCart(testCustomer, testProductModel)).rejects.toThrow(mockError);
    
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProductModel);
    
            jest.restoreAllMocks();
        })
    
        test('It should throw an error when decrementProductQuantity fails', async () => {
            const controller = new CartController();
    
            const testProductModel = 'testModel';
            const testProduct = new Product(10, testProductModel, Category.APPLIANCE, null, null, 5);
            const testCartProduct = new ProductInCart(testProduct.model, 2, testProduct.category, 10);
            const testCart = new Cart(testCustomer.username, false, '2024-05-05', testCartProduct.price, [testCartProduct]);
            const testCartId = 1;
            const mockError = new Error('Database error');
    
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCart, testCartId]);
            const mockDecrementProductQuantity = jest.spyOn(CartDAO.prototype, 'decrementProductQuantity').mockRejectedValueOnce(mockError);
    
            await expect(controller.removeProductFromCart(testCustomer, testProductModel)).rejects.toThrow(mockError);
    
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProductModel);
    
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);
    
            expect(mockDecrementProductQuantity).toHaveBeenCalledTimes(1);
            expect(mockDecrementProductQuantity).toHaveBeenCalledWith(testCartId, testProductModel);
    
            jest.restoreAllMocks();
        })
    
        test('It should throw an error when removeProductFromCart fails', async () => {
            const controller = new CartController();
    
            const testProductModel = 'testModel';
            const testProduct = new Product(10, testProductModel, Category.APPLIANCE, null, null, 5);
            const testCartProduct = new ProductInCart(testProduct.model, 1, testProduct.category, 10);
            const testCart = new Cart(testCustomer.username, false, '2024-05-05', testCartProduct.price, [testCartProduct]);
            const testCartId = 1;
            const mockError = new Error('Database error');
    
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCart, testCartId]);
            const mockRemoveProductFromCart = jest.spyOn(CartDAO.prototype, 'removeProductFromCart').mockRejectedValueOnce(mockError);
    
            await expect(controller.removeProductFromCart(testCustomer, testProductModel)).rejects.toThrow(mockError);
    
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProductModel);
    
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);
    
            expect(mockRemoveProductFromCart).toHaveBeenCalledTimes(1);
            expect(mockRemoveProductFromCart).toHaveBeenCalledWith(testCartId, testProductModel);
    
            jest.restoreAllMocks();
        })
    
        test('It should throw an error when decreaseCartTotal fails', async () => {
            const controller = new CartController();
    
            const testProductModel = 'testModel';
            const testProduct = new Product(10, testProductModel, Category.APPLIANCE, null, null, 5);
            const testCartProduct = new ProductInCart(testProduct.model, 1, testProduct.category, 10);
            const testCart = new Cart(testCustomer.username, false, '2024-05-05', testCartProduct.price, [testCartProduct]);
            const testCartId = 1;
            const mockError = new Error('Database error');
    
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testCart, testCartId]);
            const mockRemoveProductFromCart = jest.spyOn(CartDAO.prototype, 'removeProductFromCart').mockResolvedValueOnce();
            const mockDecreaseCartTotal = jest.spyOn(CartDAO.prototype, 'decreaseCartTotal').mockRejectedValueOnce(mockError);
    
            await expect(controller.removeProductFromCart(testCustomer, testProductModel)).rejects.toThrow(mockError);
    
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProductModel);
    
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);
    
            expect(mockRemoveProductFromCart).toHaveBeenCalledTimes(1);
            expect(mockRemoveProductFromCart).toHaveBeenCalledWith(testCartId, testProductModel);
    
            expect(mockDecreaseCartTotal).toHaveBeenCalledTimes(1);
            expect(mockDecreaseCartTotal).toHaveBeenCalledWith(testCartId, testCartProduct.price);
    
            jest.restoreAllMocks();
        })
    })

    describe('addToCart - controller', () => {
        test('It should return true when the product is added to the cart', async () => {
            const controller = new CartController();
        
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testUnpaidCart, 1]);
            const mockCreateCart = jest.spyOn(CartDAO.prototype, "createCart").mockResolvedValueOnce([testEmptyCart, 1]);
            const mockIncrementProductQuantity = jest.spyOn(CartDAO.prototype, 'incrementProductQuantity').mockResolvedValueOnce();
            const mockUpdateCartTotal = jest.spyOn(CartDAO.prototype, 'updateCartTotal').mockResolvedValueOnce();
            const mockAddProductToCart = jest.spyOn(CartDAO.prototype, 'addProductToCart').mockResolvedValueOnce();


            const response = await controller.addToCart(testCustomer, testProduct.model);
        
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProduct.model);

            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);

            expect(mockCreateCart).toHaveBeenCalledTimes(0)
        
            expect(mockIncrementProductQuantity).toHaveBeenCalledTimes(1);
            expect(mockIncrementProductQuantity).toHaveBeenCalledWith(1, testProduct.model);

            expect(mockAddProductToCart).toHaveBeenCalledTimes(0)

            expect(mockUpdateCartTotal).toHaveBeenCalledTimes(1);
            expect(mockUpdateCartTotal).toHaveBeenCalledWith(1, testProduct.sellingPrice);
        
            expect(response).toBe(true);
        
            jest.restoreAllMocks();
        });

        test('It should return true when a new product is successfully added to the cart', async () => {
            const controller = new CartController();

            const testUnpaidCart1 = new Cart(testCustomer.username, false, '2024-05-05', testProductInCart.price, [testProductInCart])
        
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testUnpaidCart1, 1]);
            const mockCreateCart = jest.spyOn(CartDAO.prototype, "createCart").mockResolvedValueOnce([testEmptyCart, 1]);
            const mockIncrementProductQuantity = jest.spyOn(CartDAO.prototype, 'incrementProductQuantity').mockResolvedValueOnce();
            const mockAddProductToCart = jest.spyOn(CartDAO.prototype, 'addProductToCart').mockResolvedValueOnce();
            const mockUpdateCartTotal = jest.spyOn(CartDAO.prototype, 'updateCartTotal').mockResolvedValueOnce();
        
            // Modify the cart to simulate the product not being in it
            testUnpaidCart1.products = [];
        
            const response = await controller.addToCart(testCustomer, testProduct.model);
        
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProduct.model);
        
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);

            expect(mockCreateCart).toHaveBeenCalledTimes(0)

            expect(mockIncrementProductQuantity).toHaveBeenCalledTimes(0);
        
            expect(mockAddProductToCart).toHaveBeenCalledTimes(1);
            expect(mockAddProductToCart).toHaveBeenCalledWith(1, testProduct);
        
            expect(mockUpdateCartTotal).toHaveBeenCalledTimes(1);
            expect(mockUpdateCartTotal).toHaveBeenCalledWith(1, testProduct.sellingPrice);
        
            expect(response).toBe(true);
        
            jest.restoreAllMocks();
        });

        test('It should create a new cart if there is no current unpaid cart and add the product to it', async () => {
            const controller = new CartController();
        
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce(null);
            const mockCreateCart = jest.spyOn(CartDAO.prototype, "createCart").mockResolvedValueOnce([testEmptyCart, 1]);
            const mockIncrementProductQuantity = jest.spyOn(CartDAO.prototype, 'incrementProductQuantity').mockResolvedValueOnce();
            const mockAddProductToCart = jest.spyOn(CartDAO.prototype, 'addProductToCart').mockResolvedValueOnce();
            const mockUpdateCartTotal = jest.spyOn(CartDAO.prototype, 'updateCartTotal').mockResolvedValueOnce();
        
            const response = await controller.addToCart(testCustomer, testProduct.model);
        
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProduct.model);
        
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);
        
            expect(mockCreateCart).toHaveBeenCalledTimes(1);
            expect(mockCreateCart).toHaveBeenCalledWith(testCustomer.username);

            expect(mockIncrementProductQuantity).toHaveBeenCalledTimes(0);
        
            expect(mockAddProductToCart).toHaveBeenCalledTimes(1);
            expect(mockAddProductToCart).toHaveBeenCalledWith(1, testProduct);
        
            expect(mockUpdateCartTotal).toHaveBeenCalledTimes(1);
            expect(mockUpdateCartTotal).toHaveBeenCalledWith(1, testProduct.sellingPrice);
        
            expect(response).toBe(true);
        
            jest.restoreAllMocks();
        });
        
        test('It should throw an EmptyProductStockError when the product is out of stock', async () => {
            const controller = new CartController();
        
            const outOfStockProduct = { ...testProduct, quantity: 0 };
        
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([outOfStockProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testUnpaidCart, 1]);
            const mockCreateCart = jest.spyOn(CartDAO.prototype, "createCart").mockResolvedValueOnce([testEmptyCart, 1]);
            const mockIncrementProductQuantity = jest.spyOn(CartDAO.prototype, 'incrementProductQuantity').mockResolvedValueOnce();
            const mockUpdateCartTotal = jest.spyOn(CartDAO.prototype, 'updateCartTotal').mockResolvedValueOnce();
            const mockAddProductToCart = jest.spyOn(CartDAO.prototype, 'addProductToCart').mockResolvedValueOnce();

            await expect(controller.addToCart(testCustomer, testProduct.model)).rejects.toThrow(EmptyProductStockError);
        
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProduct.model);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(0);        
            expect(mockCreateCart).toHaveBeenCalledTimes(0);
            expect(mockAddProductToCart).toHaveBeenCalledTimes(0);
            expect(mockUpdateCartTotal).toHaveBeenCalledTimes(0);

            jest.restoreAllMocks();
        });
        
        test('It should throw an error when getUnpaidCartByCustomer fails', async () => {
            const controller = new CartController();
        
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockRejectedValueOnce(new Error('Database error'));
            const mockCreateCart = jest.spyOn(CartDAO.prototype, "createCart").mockResolvedValueOnce([testEmptyCart, 1]);
            const mockIncrementProductQuantity = jest.spyOn(CartDAO.prototype, 'incrementProductQuantity').mockResolvedValueOnce();
            const mockUpdateCartTotal = jest.spyOn(CartDAO.prototype, 'updateCartTotal').mockResolvedValueOnce();
            const mockAddProductToCart = jest.spyOn(CartDAO.prototype, 'addProductToCart').mockResolvedValueOnce();

            await expect(controller.addToCart(testCustomer, testProduct.model)).rejects.toThrow();
        
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProduct.model);

            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);            
            
            expect(mockCreateCart).toHaveBeenCalledTimes(0);
            expect(mockAddProductToCart).toHaveBeenCalledTimes(0);
            expect(mockUpdateCartTotal).toHaveBeenCalledTimes(0);

            jest.restoreAllMocks();
        });

        test('It should throw an error when createCart fails', async () => {
            const controller = new CartController();
        
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce(null);
            const mockCreateCart = jest.spyOn(CartDAO.prototype, "createCart").mockRejectedValueOnce(new Error('Database error'));
            const mockIncrementProductQuantity = jest.spyOn(CartDAO.prototype, 'incrementProductQuantity').mockResolvedValueOnce();
            const mockUpdateCartTotal = jest.spyOn(CartDAO.prototype, 'updateCartTotal').mockResolvedValueOnce();
            const mockAddProductToCart = jest.spyOn(CartDAO.prototype, 'addProductToCart').mockResolvedValueOnce();


            await expect(controller.addToCart(testCustomer, testProduct.model)).rejects.toThrow()
        
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProduct.model);

            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);

            expect(mockCreateCart).toHaveBeenCalledTimes(1)
            expect(mockCreateCart).toHaveBeenCalledWith(testCustomer.username)
        
            expect(mockIncrementProductQuantity).toHaveBeenCalledTimes(0);

            expect(mockAddProductToCart).toHaveBeenCalledTimes(0)

            expect(mockUpdateCartTotal).toHaveBeenCalledTimes(0);

        
            jest.restoreAllMocks();
        });
        
        test('It should throw an error when incrementProductQuantity fails', async () => {
            const controller = new CartController();
        
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testUnpaidCart, 1]);
            const mockCreateCart = jest.spyOn(CartDAO.prototype, "createCart").mockResolvedValueOnce([testEmptyCart, 1]);
            const mockIncrementProductQuantity = jest.spyOn(CartDAO.prototype, 'incrementProductQuantity').mockRejectedValueOnce(new Error('Database error'));
            const mockUpdateCartTotal = jest.spyOn(CartDAO.prototype, 'updateCartTotal').mockResolvedValueOnce();
            const mockAddProductToCart = jest.spyOn(CartDAO.prototype, 'addProductToCart').mockResolvedValueOnce();


            await expect(controller.addToCart(testCustomer, testProduct.model)).rejects.toThrow()
        
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProduct.model);

            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);

            expect(mockCreateCart).toHaveBeenCalledTimes(0)
        
            expect(mockIncrementProductQuantity).toHaveBeenCalledTimes(1);
            expect(mockIncrementProductQuantity).toHaveBeenCalledWith(1, testProduct.model);

            expect(mockAddProductToCart).toHaveBeenCalledTimes(0)

            expect(mockUpdateCartTotal).toHaveBeenCalledTimes(0)
        
            jest.restoreAllMocks();
        })

        test('It should throw an error when addProductToCart fails', async () => {
            const controller = new CartController();
        
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce(null);
            const mockCreateCart = jest.spyOn(CartDAO.prototype, "createCart").mockResolvedValueOnce([testEmptyCart, 1]);
            const mockIncrementProductQuantity = jest.spyOn(CartDAO.prototype, 'incrementProductQuantity').mockResolvedValueOnce();
            const mockUpdateCartTotal = jest.spyOn(CartDAO.prototype, 'updateCartTotal').mockResolvedValueOnce();
            const mockAddProductToCart = jest.spyOn(CartDAO.prototype, 'addProductToCart').mockRejectedValueOnce(new Error('Database error'));


            await expect(controller.addToCart(testCustomer, testProduct.model)).rejects.toThrow()
        
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProduct.model);

            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);

            expect(mockCreateCart).toHaveBeenCalledTimes(1)
        
            expect(mockIncrementProductQuantity).toHaveBeenCalledTimes(0);

            expect(mockAddProductToCart).toHaveBeenCalledTimes(1)
            expect(mockAddProductToCart).toHaveBeenCalledWith(1, testProduct)

            expect(mockUpdateCartTotal).toHaveBeenCalledTimes(0);
        
            jest.restoreAllMocks();
        });

        test('It should throw an error if updateCartTotal fails', async () => {
            const controller = new CartController();
        
            const mockGetProducts = jest.spyOn(ProductController.prototype, 'getProducts').mockResolvedValueOnce([testProduct]);
            const mockGetUnpaidCartByCustomer = jest.spyOn(CartDAO.prototype, "getUnpaidCartByCustomer").mockResolvedValueOnce([testUnpaidCart, 1]);
            const mockCreateCart = jest.spyOn(CartDAO.prototype, "createCart").mockResolvedValueOnce([testEmptyCart, 1]);
            const mockIncrementProductQuantity = jest.spyOn(CartDAO.prototype, 'incrementProductQuantity').mockResolvedValueOnce();
            const mockUpdateCartTotal = jest.spyOn(CartDAO.prototype, 'updateCartTotal').mockRejectedValueOnce(new Error('Database error'));
            const mockAddProductToCart = jest.spyOn(CartDAO.prototype, 'addProductToCart').mockResolvedValueOnce();


            await expect(controller.addToCart(testCustomer, testProduct.model)).rejects.toThrow()
        
            expect(mockGetProducts).toHaveBeenCalledTimes(1);
            expect(mockGetProducts).toHaveBeenCalledWith('model', undefined, testProduct.model);

            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledTimes(1);
            expect(mockGetUnpaidCartByCustomer).toHaveBeenCalledWith(testCustomer.username);

            expect(mockCreateCart).toHaveBeenCalledTimes(0)
        
            expect(mockIncrementProductQuantity).toHaveBeenCalledTimes(1);
            expect(mockIncrementProductQuantity).toHaveBeenCalledWith(1, testProduct.model);

            expect(mockAddProductToCart).toHaveBeenCalledTimes(0)

            expect(mockUpdateCartTotal).toHaveBeenCalledTimes(1);
            expect(mockUpdateCartTotal).toHaveBeenCalledWith(1, testProduct.sellingPrice);
        
            jest.restoreAllMocks();
        });
        
        test('It should return true when all carts are successfully deleted', async () => {
            const controller = new CartController();
        
            const mockDeleteAllCarts = jest.spyOn(CartDAO.prototype, 'deleteAllCarts').mockResolvedValueOnce();
        
            const response = await controller.deleteAllCarts();
        
            expect(mockDeleteAllCarts).toHaveBeenCalledTimes(1);
            expect(response).toBe(true);
        
            jest.restoreAllMocks();
        });

        test('It should throw an error when failing to delete all carts', async () => {
            const controller = new CartController();
            const errorMessage = 'Failed to delete all carts';
        
            const mockDeleteAllCarts = jest.spyOn(CartDAO.prototype, 'deleteAllCarts').mockRejectedValueOnce(new Error(errorMessage));
        
            await expect(controller.deleteAllCarts()).rejects.toThrow(errorMessage);
        
            expect(mockDeleteAllCarts).toHaveBeenCalledTimes(1);
        
            jest.restoreAllMocks();
        });

        test('It should return an array of all carts when retrieval is successful', async () => {
            const controller = new CartController();
        
            const testCarts = [testUnpaidCart, testPaidCart];
        
            const mockGetAllCarts = jest.spyOn(CartDAO.prototype, 'getAllCarts').mockResolvedValueOnce(testCarts);
        
            const response = await controller.getAllCarts();
        
            expect(mockGetAllCarts).toHaveBeenCalledTimes(1);
            expect(response).toEqual(testCarts);
        
            jest.restoreAllMocks();
        });

        test('It should throw an error when failing to retrieve all carts', async () => {
            const controller = new CartController();
            const errorMessage = 'Failed to retrieve all carts';
        
            const mockGetAllCarts = jest.spyOn(CartDAO.prototype, 'getAllCarts').mockRejectedValueOnce(new Error(errorMessage));
        
            await expect(controller.getAllCarts()).rejects.toThrow(errorMessage);
        
            expect(mockGetAllCarts).toHaveBeenCalledTimes(1);
        
            jest.restoreAllMocks();
        });
        
        
        
        
    })
    describe('getAllCarts function', () =>{
        test("Admin retrieves all carts", async () =>{
            const cartController = new CartController();
            const mockCarts = [
                new Cart(
                    'customer1',
                    false,
                    '',
                    100,
                    [
                        new ProductInCart('model1', 2, Category['Appliance' as keyof typeof Category], 50),
                        new ProductInCart('model2', 1, Category['Appliance' as keyof typeof Category], 50)
                    ]
                ),
                new Cart(
                    'customer2',
                    true,
                    '2024-01-01',
                    200,
                    [
                        new ProductInCart('model3', 3, Category['Appliance' as keyof typeof Category], 200)
                    ]
                )
            ];

            jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValueOnce(mockCarts);
            const carts = await cartController.getAllCarts();

            expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledTimes(1);
            
            expect(carts).toBe(mockCarts);
        });
        test("It should throw an error when DAO getAllCarts method throws an error", async () => {
            const cartController = new CartController();
            const mockCarts = [
                new Cart(
                    'customer1',
                    false,
                    '',
                    100,
                    [
                        new ProductInCart('model1', 2, Category['Appliance' as keyof typeof Category], 50),
                        new ProductInCart('model2', 1, Category['Appliance' as keyof typeof Category], 50)
                    ]
                ),
                new Cart(
                    'customer2',
                    true,
                    '2024-01-01',
                    200,
                    [
                        new ProductInCart('model3', 3, Category['Appliance' as keyof typeof Category], 200)
                    ]
                )
            ];

            jest.spyOn(CartDAO.prototype, "getAllCarts").mockRejectedValueOnce(new Error("DAO error"));
            await expect(cartController.getAllCarts()).rejects.toThrow("DAO error");

            expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledTimes(1);

        });
    });

    describe('deleteAllCarts function', () =>{
        test("Admin deletes all carts of all users", async () =>{
            const cartController = new CartController();

            jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValueOnce();
            const carts = await cartController.deleteAllCarts();

            expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledTimes(1);
            
            expect(carts).toBe(true);
        });
        test("It should throw an error when DAO deleteAllCarts method throws an error", async () => {
            const cartController = new CartController();

            jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockRejectedValueOnce(new Error("DAO error"));
            await expect(cartController.deleteAllCarts()).rejects.toThrow("DAO error");

            expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledTimes(1);

        });
    });

    

    
})