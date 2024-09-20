import { describe, test, expect, beforeAll, afterAll, jest, beforeEach, afterEach } from "@jest/globals"

import { Role, User } from "../../src/components/user"
import {  } from "../../src/errors/cartError"
import { Category, Product } from "../../src/components/product"
import CartDAO from "../../src/dao/cartDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { Cart, ProductInCart } from "../../src/components/cart"


// mock the review controller and the auth
jest.mock('../../src/controllers/reviewController');
jest.mock('../../src/routers/auth')

let testCustomer = new User('customer', 'customer', 'customer', Role.CUSTOMER, '', '');
let testManager = new User('manager', 'manager', 'manager', Role.MANAGER, '', '');
const testProduct = new Product(10, 'modello', Category.APPLIANCE, null, null, 1);

describe('Cart DAO functions unit tests', () => {

    beforeEach(() => {
        jest.resetAllMocks()
        jest.restoreAllMocks()
    },20000);
      
    afterEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
    },20000);

    describe("getUnpaidCartByCustomer - DAO", () => {      

        test("It should return the unpaid cart and its ID", async () => {
            const cartDAO = new CartDAO();
        
            const mockCartRow = {
                id: 1,
                customer: 'customer1',
                paid: false,
                paymentDate: '',
                total: 100
            };
        
            const mockProductRows = [
                { model: 'model1', quantity: 2, category: 'Appliance', price: 50 },
                { model: 'model2', quantity: 1, category: 'Appliance', price: 50 }
            ];
        
            // Mock db.get to return the cart row
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {

                callback(null, mockCartRow);
                return {} as Database
            });
        
            // Mock db.all to return the product rows
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, mockProductRows);
                return {} as Database
            });
        
            const result = await cartDAO.getUnpaidCartByCustomer('customer1');
            const expectedCart = new Cart(
                mockCartRow.customer,
                mockCartRow.paid,
                mockCartRow.paymentDate,
                mockCartRow.total,
                mockProductRows.map(row => new ProductInCart(row.model, row.quantity, row.category as Category, row.price))
            );
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual([expectedCart, mockCartRow.id]);

            mockDBGet.mockRestore();
            mockDBAll.mockRestore();
        });

        test("Reject with an error when db.get callback contains an error", async () => {
            const cartDAO = new CartDAO();
        
            const mockProductRows = [
                { model: 'model1', quantity: 2, category: 'Appliance', price: 50 },
                { model: 'model2', quantity: 1, category: 'Appliance', price: 50 }
            ];

            const mockError = new Error('Database error in function get');
        
            // Mock db.get to return the cart row
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                
                callback(mockError);
                return {} as Database
            });
        
            // Mock db.all to return the product rows
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {

                callback(null, mockProductRows);
                return {} as Database
            });
 
            await expect(cartDAO.getUnpaidCartByCustomer('customer1')).rejects.toThrow();
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBAll).toHaveBeenCalledTimes(0);

            mockDBGet.mockRestore();
            mockDBAll.mockRestore();
        });
        
        
        test("Reject with an error when db.all callback contains an error", async () => {
            const cartDAO = new CartDAO();
        
            const mockCartRow = {
                id: 1,
                customer: 'customer1',
                paid: false,
                paymentDate: '',
                total: 100
            };

            const mockError = new Error('Database error in function get');
        
            // Mock db.get to return the cart row
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {

                callback(null, mockCartRow);
                return {} as Database
            });
        
            // Mock db.all to return the product rows
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(mockError);
                return {} as Database
            });
        
            await expect(cartDAO.getUnpaidCartByCustomer('customer1')).rejects.toThrow()
            
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBAll).toHaveBeenCalledTimes(1);

            mockDBGet.mockRestore();
            mockDBAll.mockRestore();
        });

        test("Reject with an error when db.get throws an error", async () => {
            const cartDAO = new CartDAO();
    
            const mockError = new Error('Database error in function get');
        
            // Mock db.get to return the cart row
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {

                throw mockError;
            });
        
            // Mock db.all to return the product rows
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                
                callback(mockError);
                return {} as Database
            });
        
            await expect(cartDAO.getUnpaidCartByCustomer('customer1')).rejects.toThrow()
            
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBAll).toHaveBeenCalledTimes(0);

            mockDBGet.mockRestore();
            mockDBAll.mockRestore();
        });

        test("Reject with an error when db.all throws an error", async () => {
            const cartDAO = new CartDAO();
        
            const mockCartRow = {
                id: 1,
                customer: 'customer1',
                paid: false,
                paymentDate: '',
                total: 100
            };

            const mockError = new Error('Database error in function get');
        
            // Mock db.get to return the cart row
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {

                callback(null, mockCartRow);
                return {} as Database
            });
        
            // Mock db.all to return the product rows
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                throw mockError;
            });
        
            await expect(cartDAO.getUnpaidCartByCustomer('customer1')).rejects.toThrow()
            
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBAll).toHaveBeenCalledTimes(1);

            mockDBGet.mockRestore();
            mockDBAll.mockRestore();
        });

        test("Customer doesn't have any unpaid cart", async () => {
            const cartDAO = new CartDAO();

            // Mock db.get to return the cart row
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {

                callback(null, null);
                return {} as Database
            });
        
            const result = await cartDAO.getUnpaidCartByCustomer('customer1');
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(result).toEqual(null);

            mockDBGet.mockRestore();
        });

        test("Unpayed cart without products", async () => {
            const cartDAO = new CartDAO();
        
            const mockCartRow = {
                id: 1,
                customer: 'customer1',
                paid: false,
                paymentDate: '',
                total: 100
            };
        
            const mockProductRows: any = [];
        
            // Mock db.get to return the cart row
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {

                callback(null, mockCartRow);
                return {} as Database
            });
        
            // Mock db.all to return the product rows
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, mockProductRows);
                return {} as Database
            });
        
            const result = await cartDAO.getUnpaidCartByCustomer('customer1');
            const expectedCart = new Cart(
                'customer1',
                false,
                null,
                0,
                []
            );
        
            expect(mockDBGet).toHaveBeenCalledTimes(1);
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual([expectedCart, mockCartRow.id]);

            mockDBGet.mockRestore();
            mockDBAll.mockRestore();
        });
    })
    
    describe("getPaidCartByCustomer - DAO", () => {
        
        test('1 paid cart with 1 product', async () => {
            const cartDAO = new CartDAO();
        
            const mockCartRow = {
                id: 1,
                customer: 'customer1',
                paid: true,
                paymentDate: "2024-05-05",
                total: 10
            };
        
            const productInCart = new ProductInCart('model', 1, 'Appliance' as Category, 10);
        
            const historyRows = [
                { cartId: 1, customer: 'customer1', paid: true, paymentDate: '2024-05-05', total: 10, model: 'model', category: 'Appliance', quantity: 1, price: 10 },
            ];
        
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, historyRows);
                return {} as Database
            });
        
            const result = await cartDAO.getPaidCartByCustomer('customer1');
        
            const expectedCart = new Cart(
                mockCartRow.customer,
                mockCartRow.paid,
                mockCartRow.paymentDate,
                mockCartRow.total,
                [productInCart]
            );
        
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual([expectedCart]);
        })

        test('1 paid cart with 2 products', async () => {
            const cartDAO = new CartDAO();
        
            const mockCartRow = {
                id: 1,
                customer: 'customer1',
                paid: true,
                paymentDate: "2024-05-05",
                total: 10
            };
        
            const productInCart = new ProductInCart('model', 1, 'Appliance' as Category, 10);
        
            const historyRows = [
                { cartId: 1, customer: 'customer1', paid: true, paymentDate: '2024-05-05', total: 10, model: 'model', category: 'Appliance', quantity: 1, price: 10 },
                { cartId: 1, customer: 'customer1', paid: true, paymentDate: '2024-05-05', total: 10, model: 'model', category: 'Appliance', quantity: 1, price: 10 }
            ];
        
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, historyRows);
                return {} as Database
            });
        
            const result = await cartDAO.getPaidCartByCustomer('customer1');
        
            const expectedCart = new Cart(
                mockCartRow.customer,
                mockCartRow.paid,
                mockCartRow.paymentDate,
                mockCartRow.total,
                [productInCart, productInCart]
            );
        
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual([expectedCart]);
        
            jest.restoreAllMocks();
        })

        test('0 paid carts', async () => {
            const cartDAO = new CartDAO();
        
            const mockCartRow = {
                id: 1,
                customer: 'customer1',
                paid: true,
                paymentDate: "2024-05-05",
                total: 10
            };
        
            const historyRows: any = [];
        
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, historyRows);
                return {} as Database
            });
        
            const result = await cartDAO.getPaidCartByCustomer('customer1');
        
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual([]);
        
            jest.restoreAllMocks();
        })
        
        test('Reject with an error when db.all callback contains an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error in function get');
        
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(mockError);
                return {} as Database
            });
        
            await expect(cartDAO.getPaidCartByCustomer('customer1')).rejects.toThrow();
        
            expect(mockDBAll).toHaveBeenCalledTimes(1);
        
            jest.restoreAllMocks();
        })

        test('Reject with an error when db.all throws an error', async () => {
            const cartDAO = new CartDAO();
        
            const mockCartRow = {
                id: 1,
                customer: 'customer1',
                paid: true,
                paymentDate: "2024-05-05",
                total: 10
            };

            const mockError = new Error('Database error in function get');
        
            const productInCart = new ProductInCart('model', 1, Category['Appliance' as keyof typeof Category], 10);
        
            const historyRows = [
                { cartId: 1, customer: 'customer1', paid: true, paymentDate: '2024-05-05', total: 10, model: 'model', category: 'Appliance', quantity: 1, price: 10 },
            ];
        
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                throw mockError;
            });
        
            await expect(cartDAO.getPaidCartByCustomer('customer1')).rejects.toThrow();
        
            expect(mockDBAll).toHaveBeenCalledTimes(1);
        
            jest.restoreAllMocks();
        })
    })
    
    describe("clearProductsFromCart - DAO", () => {

        test('It should return an empty Promise', async () => {
            const cartDAO = new CartDAO();

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

            const result = await cartDAO.clearProductsFromCart(1);

            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(result).toBe(undefined)
        }) 

        test('Reject with an error when db.run callback contains an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)

                return {} as Database
            })

            await expect(cartDAO.clearProductsFromCart(1)).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 

        test('Reject with an error when db.run throws an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw mockError;
            })

            await expect(cartDAO.clearProductsFromCart(1)).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 
    })

    describe("resetCartTotal - DAO", () => {

        test('It should return an empty Promise', async () => {
            const cartDAO = new CartDAO();

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

            const result = await cartDAO.resetCartTotal(1);

            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(result).toBe(undefined)
        })

        test('Reject with an error when db.run callback contains an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)

                return {} as Database
            })

            await expect(cartDAO.resetCartTotal(1)).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 

        test('Reject with an error when db.run throws an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw mockError;
            })

            await expect(cartDAO.resetCartTotal(1)).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 
    })

    describe("decrementProductQuantity - DAO", () => {

        test('It should return an empty Promise', async () => {
            const cartDAO = new CartDAO();

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

            const result = await cartDAO.decrementProductQuantity(1, 'modello');

            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(result).toBe(undefined)
        })

        test('Reject with an error when db.run callback contains an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)

                return {} as Database
            })

            await expect(cartDAO.decrementProductQuantity(1, 'modello')).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 

        test('Reject with an error when db.run throws an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw mockError;
            })

            await expect(cartDAO.decrementProductQuantity(1, 'modello')).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 
    })

    describe("removeProductFromCart - DAO", () => {
        test('It should return an empty Promise', async () => {
            const cartDAO = new CartDAO();

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

            const result = await cartDAO.removeProductFromCart(1, 'modello');

            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(result).toBe(undefined)
        }) 

        test('Reject with an error when db.run callback contains an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)

                return {} as Database
            })

            await expect(cartDAO.removeProductFromCart(1, 'modello')).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 

        test('Reject with an error when db.run throws an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw mockError;
            })

            await expect(cartDAO.removeProductFromCart(1, 'modello')).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 
    })

    describe("decreaseCartTotal - DAO", () => {
        test('It should return an empty Promise', async () => {
            const cartDAO = new CartDAO();

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

            const result = await cartDAO.decreaseCartTotal(1, 10);

            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(result).toBe(undefined)
        }) 

        test('Reject with an error when db.run callback contains an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)

                return {} as Database
            })

            await expect(cartDAO.decreaseCartTotal(1, 10)).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 

        test('Reject with an error when db.run throws an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw mockError;
            })

            await expect(cartDAO.decreaseCartTotal(1, 10)).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 
    })

    describe("setPayementDate - DAO", () => {

        test("It should return an empty Promise", async () => {
            const cartDAO = new CartDAO();

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

            const result = await cartDAO.setPaymentDate(1, '2024-05-05');

            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(result).toBe(undefined)
        })

        test('Reject with an error when db.run callback contains an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)

                return {} as Database
            })

            await expect(cartDAO.setPaymentDate(1, '2024-05-05')).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 

        test('Reject with an error when db.run throws an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw mockError;
            })

            await expect(cartDAO.setPaymentDate(1, '2024-05-05')).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 
    })

    describe("createCart - DAO", () => {
        test('It should return an empty Promise', async () => {
            const cartDAO = new CartDAO();
        
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                
                const context = { lastID: 1 };  // mock del contesto
                callback.call(context, null);
        
                return {} as Database;
            });
        
            const result = await cartDAO.createCart('customer');
        
            const expectedCart = new Cart('customer', false, null, 0, []);
        
            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(result).toEqual([expectedCart, 1]);
        })


        test('Reject with an error when db.run callback contains an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                const context = { lastID: 1 };  // mock del contesto
                callback(mockError)

                return {} as Database
            })

            await expect(cartDAO.createCart('customer')).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 

        test('Reject with an error when db.run throws an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                const context = { lastID: 1 };  // mock del contesto
                throw mockError;
            })

            await expect(cartDAO.createCart('customer')).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 
    })

    describe("incrementProductQuantity - DAO", () => {
        test('It should return an empty Promise', async () => {
            const cartDAO = new CartDAO();

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

            const result = await cartDAO.incrementProductQuantity(1, 'modello');

            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(result).toBe(undefined)
        }) 

        test('Reject with an error when db.run callback contains an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)

                return {} as Database
            })

            await expect(cartDAO.incrementProductQuantity(1, 'modello')).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 

        test('Reject with an error when db.run throws an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw mockError;
            })

            await expect(cartDAO.incrementProductQuantity(1, 'modello')).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 
    })

    describe("addProductToCart -DAO", () => {
        test('It should return an empty Promise', async () => {
            const cartDAO = new CartDAO();

            const mockProduct = new Product(100, 'modello', Category.APPLIANCE, null, null, 1)
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

            const result = await cartDAO.addProductToCart(1, mockProduct);

            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(result).toBe(undefined)
        }) 

        test('Reject with an error when db.run callback contains an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)

                return {} as Database
            })

            await expect(cartDAO.addProductToCart(1, testProduct)).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 

        test('Reject with an error when db.run throws an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw mockError;
            })

            await expect(cartDAO.addProductToCart(1, testProduct)).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 
    })

    describe("updateCartTotal - DAO", () => {
        test('It should return an empty Promise', async () => {
            const cartDAO = new CartDAO();

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)

                return {} as Database
            })

            const result = await cartDAO.updateCartTotal(1, 10);

            expect(mockDBRun).toHaveBeenCalledTimes(1);
            expect(result).toBe(undefined)
        }) 

        test('Reject with an error when db.run callback contains an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(mockError)

                return {} as Database
            })

            await expect(cartDAO.updateCartTotal(1, 10)).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 

        test('Reject with an error when db.run throws an error', async () => {
            const cartDAO = new CartDAO();

            const mockError = new Error('Database error')

            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw mockError;
            })

            await expect(cartDAO.updateCartTotal(1, 10)).rejects.toThrow();

            expect(mockDBRun).toHaveBeenCalledTimes(1);
        }) 
    })

    describe("getAllCarts - DAO", () => {      

        test("It should return an array of all carts with their products", async () => {
            const cartDAO = new CartDAO();
        
            const mockRows = [
                {
                    cartId: 1,
                    customer: 'customer1',
                    paid: false,
                    paymentDate: '',
                    total: 100,
                    model: 'model1',
                    quantity: 2,
                    category: 'Appliance',
                    price: 50
                },
                {
                    cartId: 1,
                    customer: 'customer1',
                    paid: false,
                    paymentDate: '',
                    total: 100,
                    model: 'model2',
                    quantity: 1,
                    category: 'Appliance',
                    price: 50
                },
                {
                    cartId: 2,
                    customer: 'customer2',
                    paid: true,
                    paymentDate: '2024-01-01',
                    total: 200,
                    model: 'model3',
                    quantity: 3,
                    category: 'Appliance',
                    price: 200
                }
            ];
        
            // Mock db.all to return the rows
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
                callback(null, mockRows);
                return {} as Database;
            });
        
            const result = await cartDAO.getAllCarts();
            
            const expectedCarts = [
                new Cart(
                    'customer1',
                    false,
                    '',
                    100,
                    [
                        new ProductInCart('model1', 2, Category.APPLIANCE ,50),
                        new ProductInCart('model2', 1, Category.APPLIANCE, 50)
                    ]
                ),
                new Cart(
                    'customer2',
                    true,
                    '2024-01-01',
                    200,
                    [
                        new ProductInCart('model3', 3, Category.APPLIANCE, 200)
                    ]
                )
            ];
        
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual(expectedCarts);
        
            mockDBAll.mockRestore();
        });
        
        test("Reject with an error when db.all callback contains an error", async () => {
            const cartDAO = new CartDAO();
        
            const mockError = new Error('Database error')
            const mockRows = [
                {
                    cartId: 1,
                    customer: 'customer1',
                    paid: false,
                    paymentDate: '',
                    total: 100,
                    model: 'model1',
                    quantity: 2,
                    category: 'Appliance',
                    price: 50
                },
                {
                    cartId: 1,
                    customer: 'customer1',
                    paid: false,
                    paymentDate: '',
                    total: 100,
                    model: 'model2',
                    quantity: 1,
                    category: 'Appliance',
                    price: 50
                },
                {
                    cartId: 2,
                    customer: 'customer2',
                    paid: true,
                    paymentDate: '2024-01-01',
                    total: 200,
                    model: 'model3',
                    quantity: 3,
                    category: 'Appliance',
                    price: 200
                }
            ];
        
            // Mock db.all to return the rows
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
                callback(mockError);
                return {} as Database;
            });
        
            await expect(cartDAO.getAllCarts()).rejects.toThrow()
            
            const expectedCarts = [
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
        
            expect(mockDBAll).toHaveBeenCalledTimes(1);
        
            mockDBAll.mockRestore();
        });

        test("Reject with an error when db.all throws an error", async () => {
            const cartDAO = new CartDAO();
        
            const mockError = new Error('Database error')
            const mockRows = [
                {
                    cartId: 1,
                    customer: 'customer1',
                    paid: false,
                    paymentDate: '',
                    total: 100,
                    model: 'model1',
                    quantity: 2,
                    category: 'Appliance',
                    price: 50
                },
                {
                    cartId: 1,
                    customer: 'customer1',
                    paid: false,
                    paymentDate: '',
                    total: 100,
                    model: 'model2',
                    quantity: 1,
                    category: 'Appliance',
                    price: 50
                },
                {
                    cartId: 2,
                    customer: 'customer2',
                    paid: true,
                    paymentDate: '2024-01-01',
                    total: 200,
                    model: 'model3',
                    quantity: 3,
                    category: 'Appliance',
                    price: 200
                }
            ];
        
            // Mock db.all to return the rows
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
                throw mockError;
            });
        
            await expect(cartDAO.getAllCarts()).rejects.toThrow()
        
            expect(mockDBAll).toHaveBeenCalledTimes(1);
        
            mockDBAll.mockRestore();
        });
        
        test("Resolves to an empty list", async () => {
            const cartDAO = new CartDAO();

            // Mock db.all to return the rows
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, callback) => {
                callback(null, []);
                return {} as Database;
            });
        
            const result = await cartDAO.getAllCarts();
        
            expect(mockDBAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual([]);
        
            mockDBAll.mockRestore();
        });

    })

    describe('deleteAllcarts - DAO', () => {
        test('It should return true when all carts are successfully deleted', async () => {
            const cartDAO = new CartDAO();
        
            const mockRun = jest.spyOn(db, 'run').mockImplementation((sql, callback) => {
                callback(null);
                return {} as Database;
            });
        
            const response = await cartDAO.deleteAllCarts();
        
            expect(mockRun).toHaveBeenCalledTimes(2); // Called twice, once for products_in_cart and once for carts
            expect(mockRun).toHaveBeenCalledWith('DELETE FROM products_in_cart', expect.any(Function));
            expect(mockRun).toHaveBeenCalledWith('DELETE FROM carts', expect.any(Function));
            expect(response).toBe(undefined);
        
            mockRun.mockRestore();
        });

        test('It should throw an error when the first run function fails', async () => {
            const cartDAO = new CartDAO();
            const errorMessage = 'Database error';
            const mockRun = jest.spyOn(db, 'run').mockImplementation((sql, callback) => {
                throw new Error(errorMessage)
            });
        
            await expect(cartDAO.deleteAllCarts()).rejects.toThrow()
        
            expect(mockRun).toHaveBeenCalledTimes(1); // Called twice, once for products_in_cart and once for carts
            expect(mockRun).toHaveBeenCalledWith('DELETE FROM products_in_cart', expect.any(Function));
        
            mockRun.mockRestore();
        });

        test('It should throw an error when the second run fails', async () => {
            const cartDAO = new CartDAO();
        
            const mockRun = jest.spyOn(db, 'run').mockImplementation((sql, callback) => {
                if (sql === 'DELETE FROM carts') {
                    throw new Error('Database error')
                } else {
                    callback(null);
                }
                return {} as Database;
            });
        
            await expect(cartDAO.deleteAllCarts()).rejects.toThrow();
        
            expect(mockRun).toHaveBeenCalledTimes(2);
            expect(mockRun).toHaveBeenCalledWith('DELETE FROM products_in_cart', expect.any(Function));
            expect(mockRun).toHaveBeenCalledWith('DELETE FROM carts', expect.any(Function));
        
            mockRun.mockRestore();
        });

        test('It should throw an error when failing to delete products in cart', async () => {
            const cartDAO = new CartDAO();
            const errorMessage = 'Failed to delete products in cart';
        
            const mockRun = jest.spyOn(db, 'run').mockImplementation((sql, callback) => {
                if (sql === 'DELETE FROM products_in_cart') {
                    callback(new Error(errorMessage));
                } else {
                    callback(null);
                }
                return {} as Database;
            });
        
            await expect(cartDAO.deleteAllCarts()).rejects.toThrow(errorMessage);
        
            expect(mockRun).toHaveBeenCalledTimes(1);
            expect(mockRun).toHaveBeenCalledWith('DELETE FROM products_in_cart', expect.any(Function));
        
            mockRun.mockRestore();
        });
        
        test('It should throw an error when failing to delete carts', async () => {
            const cartDAO = new CartDAO();
            const errorMessage = 'Failed to delete carts';
        
            const mockRun = jest.spyOn(db, 'run').mockImplementation((sql, callback) => {
                if (sql === 'DELETE FROM carts') {
                    callback(new Error(errorMessage));
                } else {
                    callback(null);
                }
                return {} as Database;
            });
        
            await expect(cartDAO.deleteAllCarts()).rejects.toThrow(errorMessage);
        
            expect(mockRun).toHaveBeenCalledTimes(2);
            expect(mockRun).toHaveBeenCalledWith('DELETE FROM products_in_cart', expect.any(Function));
            expect(mockRun).toHaveBeenCalledWith('DELETE FROM carts', expect.any(Function));
        
            mockRun.mockRestore();
        });
        
        
    })
})