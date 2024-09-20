import { test, expect, afterEach, beforeEach, describe, afterAll, beforeAll } from "@jest/globals";
import db from "../../src/db/db";
import ProductDAO from "../../src/dao/productDAO";
import CartController from "../../src/controllers/cartController";
import { Role, User } from "../../src/components/user";
import { UnauthorizedUserError, UserAlreadyExistsError, UserIsAdminError, UserNotFoundError } from "../../src/errors/userError";
import CartDAO from "../../src/dao/cartDAO";
import dayjs from "dayjs";
import { Category, Product } from "../../src/components/product";
import { before } from "node:test";
import { Cart, ProductInCart } from "../../src/components/cart";
import crypto from "crypto";


const sqlInsertCarts = "INSERT INTO carts (id, customer, paid, paymentDate, total) VALUES (? ,?, ?, ?, ?)";
const sqlInsertProducts = "INSERT INTO products (model, sellingPrice, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)";
const sqlInsertProductsInCart = "INSERT INTO products_in_cart (cartId, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)";
const sqlInsertUser = "INSERT INTO users (username, name, surname, password, salt, role, address, birthDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
const sqlGetAllCarts = "SELECT c.id as cartId, c.customer, c.paid, c.paymentDate, c.total, p.model, p.quantity, p.category, p.price FROM carts c LEFT JOIN products_in_cart p ON c.id = p.cartId ";
const insertManager = (username: string) => {
    const salt = crypto.randomBytes(16);
    const hashedPassword = crypto.scryptSync('pw', salt, 16);
    db.run(sqlInsertUser, [username, "Test", "User", hashedPassword, salt, "Manager", "123 Main St", "1990-01-01"]);
}
const insertCustomer = (username: string) => {
    const salt = crypto.randomBytes(16);
    const hashedPassword = crypto.scryptSync('pw', salt, 16);
    db.run(sqlInsertUser, [username, "Test", "User", hashedPassword, salt, "Customer", "123 Main St", "1990-01-01"]);
}
describe("Cart DAO functions integration tests with Real Database", () => {
    let cartDAO = new CartDAO();
    let productDAO = new ProductDAO();
    let cartController = new CartController()

    beforeEach((done) => {
        db.serialize(() => {
            db.run("DELETE FROM products", done);
            db.run("DELETE FROM carts", done);
            db.run("DELETE FROM products_in_cart", done);
            db.run("DELETE FROM users", done);
        })
        
    },20000);

    afterEach((done) => {
        db.serialize(() => {
            db.run("DELETE FROM products", done);
            db.run("DELETE FROM carts", done);
            db.run("DELETE FROM products_in_cart", done);
            db.run("DELETE FROM users", done);
        })
    },20000);

    afterAll((done) => {
        db.serialize(() => {
            db.run("DELETE FROM products", done);
            db.run("DELETE FROM carts", done);
            db.run("DELETE FROM products_in_cart", done);
            db.run("DELETE FROM users", done);
        })
    });
    describe("getAllCart", () => {
        test("It should return an array of all carts with their products", async () =>{
            const testCart1 = new Cart('customer1', false, null, 10, [])
            const testCart2 = new Cart('customer2', false, null, 20, [])

            // Register 2 customer and create a cart for each customer
            // Then register the manager that has to run the getAllCarts
            db.serialize(() => {
                insertCustomer("customer1")
                insertCustomer("customer2")
                insertManager("manager");
                db.run(sqlInsertCarts, [1, testCart1.customer, testCart1.paid, testCart1.paymentDate, testCart1.total]);
                db.run(sqlInsertCarts, [2, testCart2.customer, testCart2.paid, testCart2.paymentDate, testCart2.total]);
            })
            const carts = await cartDAO.getAllCarts();
            expect(carts).toHaveLength(2);
        })
        test("It should return an empty array of carts", async () =>{
            
            const carts = await cartDAO.getAllCarts();
            console.log(carts)
            expect(carts).toEqual([]);
        })
    })
    describe("deleteAllcarts", () => {
        test("It should return an array of all carts with their products", async () =>{
            const testCart1 = new Cart('customer1', false, null, 10, [])
            const testCart2 = new Cart('customer2', false, null, 20, [])

            // Register 2 customer and create a cart for each customer
            // Then register the manager that has to run the getAllCarts
            db.serialize(() => {
                insertCustomer("customer1")
                insertCustomer("customer2")
                insertManager("manager");
                db.run(sqlInsertCarts, [1, testCart1.customer, testCart1.paid, testCart1.paymentDate, testCart1.total]);
                db.run(sqlInsertCarts, [2, testCart2.customer, testCart2.paid, testCart2.paymentDate, testCart2.total]);
            })
            await cartDAO.deleteAllCarts();
            
            const carts = await cartDAO.getAllCarts();
            expect(carts).toEqual([]);
        })
        
    })
    describe('updateCartTotal', () => {
        
        test('It should update the cart total', async () => {

            const testCart = new Cart('customer', false, null, 10, [])
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, ["customer", "Test", "User", hashedPassword, salt, "Customer", "123 Main St", "1990-01-01"]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
            })

            await cartDAO.updateCartTotal(1, 10)

            const carts = await cartDAO.getAllCarts()
            expect(carts[0].total).toBe(20)
        }) 

        
        test('It should not update the total of another cart', async () => {

            const testCart = new Cart('customer', false, null, 0, [])
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, ["customer", "Test", "User", hashedPassword, salt, "Customer", "123 Main St", "1990-01-01"]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
            })

            await cartDAO.updateCartTotal(9999, 10)

            const carts = await cartDAO.getAllCarts();
            expect(carts[0].total).toBe(0);
        });
    })

    
    describe('setPayementDate', () => {
        test('It should set the payment date', async () => {

            const testCart = new Cart('customer', false, null, 10, [])
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, ["customer", "Test", "User", hashedPassword, salt, "Customer", "123 Main St", "1990-01-01"]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
            })

            await cartDAO.setPaymentDate(1, dayjs().format('YYYY-MM-DD'))

            const carts = await cartDAO.getAllCarts()
            expect(carts[0].paymentDate).toBe(dayjs().format('YYYY-MM-DD'))
        }) 

        
        test('It should not set the payment date', async () => {

            const testCart = new Cart('customer', false, null, 10, [])
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, ["customer", "Test", "User", hashedPassword, salt, "Customer", "123 Main St", "1990-01-01"]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
            })

            await cartDAO.setPaymentDate(9999, dayjs().format('YYYY-MM-DD'))

            const carts = await cartDAO.getAllCarts()
            expect(carts[0].paymentDate).toBe(null)
        });

    })

    /************ */

    
    describe('resetCartTotal', () => {
        test('It should reset the cart total', async () => {

            const testCart = new Cart('customer', false, null, 10, [])
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, ["customer", "Test", "User", hashedPassword, salt, "Customer", "123 Main St", "1990-01-01"]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
            })
          
            await cartDAO.resetCartTotal(1)

            const carts = await cartDAO.getAllCarts()
            expect(carts[0].total).toBe(0)
        }) 

        
        test('It should not reset the cart total', async () => {

            const testCart = new Cart('customer', false, null, 10, [])

            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, ["customer", "Test", "User", hashedPassword, salt, "Customer", "123 Main St", "1990-01-01"]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
            })

            await cartDAO.resetCartTotal(999)

            const carts = await cartDAO.getAllCarts()
            expect(carts[0].total).toBe(10)
        });
    })

    
    describe('removeProductFromCart', () => {
        test('It should remove all the products of that model from the cart', async () => {

            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, testCustomer.address, testCustomer.birthdate]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })
            

            await cartDAO.removeProductFromCart(1, 'modello')

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].products.length).toBe(0)
        })

        

        test('It should remove the product from the cart', async () => {

            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testProduct1 = new Product(10, 'modello1', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 1, testProduct.category, testProduct.sellingPrice)
            const testProductInCart1 = new ProductInCart(testProduct1.model, 1, testProduct1.category, testProduct1.sellingPrice)
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, testCustomer.address, testCustomer.birthdate]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProducts, [testProduct1.model, testProduct1.sellingPrice, testProduct1.category, testProduct1.arrivalDate, testProduct1.details, testProduct1.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart1.model, testProductInCart1.quantity, testProductInCart1.category, testProductInCart1.price]);
            })
            
            await cartDAO.removeProductFromCart(1, testProduct.model)

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].products.length).toBe(1)
            expect(carts[0].products[0].model).toBe('modello1')
        })

        
        test('It should not remove the product from the cart when the cart id does not exists', async () => {

            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 1, testProduct.category, testProduct.sellingPrice)
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, testCustomer.address, testCustomer.birthdate]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })
            

            await cartDAO.removeProductFromCart(999, 'modello')

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].products.length).toBe(1)
        })

        test('It should not remove the product from the cart when the model is not present', async () => {

            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, testCustomer.address, testCustomer.birthdate]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })
            

            await cartDAO.removeProductFromCart(1, 'WrongModel')

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].products.length).toBe(1)
        })
        
        
    })

    
    
    describe('incrementProductQuantity', () => {
        test('It should increment the quantity of the product in the cart', async () => {

            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 1, testProduct.category, testProduct.sellingPrice)
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, testCustomer.address, testCustomer.birthdate]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })
            
            await cartDAO.incrementProductQuantity(1, 'modello')

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].products[0].quantity).toBe(2)
        })

        test('It should not increment the quantity of the product if the cart does not exists', async () => {

            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 1, testProduct.category, testProduct.sellingPrice)
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, testCustomer.address, testCustomer.birthdate]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })

            await cartDAO.incrementProductQuantity(999, 'modello')

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].products[0].quantity).toBe(1)
            
        })

        test('It should not increment the quantity of the product if it is not present in the cart', async () => {

            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 1, testProduct.category, testProduct.sellingPrice)
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, testCustomer.address, testCustomer.birthdate]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })

            await cartDAO.incrementProductQuantity(1, 'WrongModel')

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].products[0].quantity).toBe(1)
            
        })

    })

    

    describe('addProductToCart', () => {

        test('It should add the product to the cart', async () => {

            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);
            //const testProductInCart = new ProductInCart(testProduct.model, 1, testProduct.category, testProduct.sellingPrice)

            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, testCustomer.address, testCustomer.birthdate]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
            })
        
            await cartDAO.addProductToCart(1, testProduct)

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].products[0].quantity).toBe(1)
            expect(carts[0].products[0].model).toBe(testProduct.model)
        })
        
    })

    

    describe('clearProductsFromCart', () => {

        test('It should remove all products from the cart', async () => {

            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testProduct1 = new Product(10, 'modello1', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
            const testProductInCart1 = new ProductInCart(testProduct1.model, 2, testProduct1.category, testProduct1.sellingPrice)
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, testCustomer.address, testCustomer.birthdate]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
                //db.run(sqlInsertProductsInCart, [1, testProductInCart1.model, testProductInCart1.quantity, testProductInCart1.category, testProductInCart1.price]);
            })
            
            await cartDAO.clearProductsFromCart(1)

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].products).toHaveLength(0)
        })

        test('It should remove all products from the cart when there are many products', async () => {

            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testProduct1 = new Product(10, 'modello1', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
            const testProductInCart1 = new ProductInCart(testProduct1.model, 2, testProduct1.category, testProduct1.sellingPrice)
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, testCustomer.address, testCustomer.birthdate]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProducts, [testProduct1.model, testProduct1.sellingPrice, testProduct1.category, testProduct1.arrivalDate, testProduct1.details, testProduct1.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart1.model, testProductInCart1.quantity, testProductInCart1.category, testProductInCart1.price]);
            })
            
            await cartDAO.clearProductsFromCart(1)

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].products).toHaveLength(0)
        })

        test('It should success even if there are not products in the cart', async () => {

            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testProduct1 = new Product(10, 'modello1', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
            const testProductInCart1 = new ProductInCart(testProduct1.model, 2, testProduct1.category, testProduct1.sellingPrice)
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, testCustomer.address, testCustomer.birthdate]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total])
            })
            
            await cartDAO.clearProductsFromCart(1)

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].products).toHaveLength(0)
        })
    })

    describe('createCart', () => {
        test('It should create a cart for the user', async () => {
            
            const testCart = new Cart('customer', false, null, 0, [])
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

            db.serialize(() => {
                db.run(sqlInsertUser, ["customer", "Test", "User", hashedPassword, salt, "Customer", "123 Main St", "1990-01-01"]);
            })

            
            await cartDAO.createCart('customer')

            const carts = await cartDAO.getAllCarts()

            expect(carts.length).toBe(1)
        })
    })

    
    describe('decreaseCartTotal', () => {

        test('It should decrease the cart total', async () => {
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);
            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
           
            
            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, null, null]);
                db.run(sqlInsertCarts, [1, testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })
            

            await cartDAO.decreaseCartTotal(1, 5)

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].total).toBe(5)
        })

        test('It should not decrease the cart total if the cart does not exists', async () => {
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);
            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
            
            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, null, null]);
                db.run(sqlInsertCarts, [1,testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1,testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })
            

            await cartDAO.decreaseCartTotal(999, 5)

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].total).toBe(10)
            
        })
    })

    describe('getPaidCartByCustomer', () => {

        test('It should return 0 paid cart', async () => {
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);
            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
            
            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, null, null]);
                db.run(sqlInsertCarts, [1,testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })
            
            const carts = await cartDAO.getPaidCartByCustomer(testCustomer.username)

            expect(carts.length).toBe(0)
        })

        test('It should return 1 paid cart', async () => {
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);
            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, true, '2024-05-05', 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
            
            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, null, null]);
                db.run(sqlInsertCarts, [1,testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })
            
            const carts = await cartDAO.getPaidCartByCustomer(testCustomer.username)

            expect(carts.length).toBe(1)
        })

        
        test('It should return 2 paid cart', async () => {
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);
            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testProduct1 = new Product(10, 'modello1', Category.APPLIANCE, null, null, 2)
            const testPaidCart = new Cart(testCustomer.username, true, '2024-05-05', 10, [])
            const testPaidCart1 = new Cart(testCustomer.username, true, '2024-05-05', 10, [])
            const testUnpaidCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
            const testProductInCart1 = new ProductInCart(testProduct1.model, 2, testProduct1.category, testProduct1.sellingPrice)
            
            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, null, null]);
                db.run(sqlInsertCarts, [1,testPaidCart.customer, 1, testPaidCart.paymentDate, testPaidCart.total]);
                db.run(sqlInsertCarts, [2,testPaidCart1.customer, 1, testPaidCart1.paymentDate, testPaidCart1.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProducts, [testProduct1.model, testProduct1.sellingPrice, testProduct1.category, testProduct1.arrivalDate, testProduct1.details, testProduct1.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
                db.run(sqlInsertProductsInCart, [2, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })
            
            const carts = await cartDAO.getPaidCartByCustomer(testCustomer.username)

            expect(carts.length).toBe(2)
        })

        test('It should not return any cart if the user do not have paid any cart', async () => {
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);
            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testUnpaidCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
            
            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, null, null]);
                db.run(sqlInsertCarts, [1,testUnpaidCart.customer, testUnpaidCart.paid, testUnpaidCart.paymentDate, testUnpaidCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
                
            })
            
            const carts = await cartDAO.getPaidCartByCustomer(testCustomer.username)

            expect(carts.length).toBe(0)
            
        })
            
    })

    describe('getUnpaidCartByCustomer', () => {

        test('It should return 1 unpaid cart', async () => {
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);
            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
            
            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, null, null]);
                db.run(sqlInsertCarts, [1,testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })
            
            const carts = await cartDAO.getUnpaidCartByCustomer(testCustomer.username)

            expect(carts).toBeDefined()
        })

        test('It should not return any unpaid carts', async () => {
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);
            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, true, '2024-05-05', 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
            
            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, null, null]);
                db.run(sqlInsertCarts, [1,testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })
            
            const carts = await cartDAO.getUnpaidCartByCustomer(testCustomer.username)

            expect(carts).toBe(null)
        })

       
            
    })

    describe('decrementProductQuantity', () => {

        test('It should decrement the product quantity in the cart', async () => {
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);
            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
            
            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, null, null]);
                db.run(sqlInsertCarts, [1,testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })
            
            await cartDAO.decrementProductQuantity(1, testProductInCart.model)

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].products[0].quantity).toBe(1)
        })

        test('It should not decrement the product quantity if the cart does not exists', async () => {
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);
            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
            
            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, null, null]);
                db.run(sqlInsertCarts, [1,testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })
            
            await cartDAO.decrementProductQuantity(999, testProductInCart.model)

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].products[0].quantity).toBe(2)
        })

        test('It should not decrement the product quantity if the model is not in the cart', async () => {
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);
            const testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
            const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 2)
            const testCart = new Cart(testCustomer.username, false, null, 10, [])
            const testProductInCart = new ProductInCart(testProduct.model, 2, testProduct.category, testProduct.sellingPrice)
            
            db.serialize(() => {
                db.run(sqlInsertUser, [testCustomer.username, testCustomer.name, testCustomer.surname, hashedPassword, salt, testCustomer.role, null, null]);
                db.run(sqlInsertCarts, [1,testCart.customer, testCart.paid, testCart.paymentDate, testCart.total]);
                db.run(sqlInsertProducts, [testProduct.model, testProduct.sellingPrice, testProduct.category, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);
                db.run(sqlInsertProductsInCart, [1, testProductInCart.model, testProductInCart.quantity, testProductInCart.category, testProductInCart.price]);
            })
            
            await cartDAO.decrementProductQuantity(1, 'WrongModel')

            const carts = await cartDAO.getAllCarts()

            expect(carts[0].products[0].quantity).toBe(2)
        })
            
    })
        
    
})