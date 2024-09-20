import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError"
import { Role, User } from "../../src/components/user";



/*
 Mock del modulo del database e di crypto: Iniziamo creando un mock del modulo del database. 
 Questo significa che, invece di utilizzare il vero modulo del database, Jest utilizzerà 
 un mock che possiamo controllare nei nostri test.
 */

jest.mock("crypto")
jest.mock("../../src/db/db.ts")




/*

Mock delle funzioni del database: Dobbiamo fare in modo che le funzioni 
del database (come db.all, db.get, db.run, ecc.) restituiscano i dati che vogliamo nei nostri test.
Implementazione delle funzioni mock: Usiamo jest.mockImplementation per specificare 
come le funzioni dovrebbero comportarsi nei nostri test

*/
describe('User DAO functions unit tests', () => {
    let userDAO: UserDAO;
    let mockDBRun: any;
    let mockDBGet: any;
    let mockDBAll: any;

    beforeEach(() => {
        userDAO = new UserDAO();
        mockDBRun = jest.spyOn(db, "run");
        mockDBGet = jest.spyOn(db, "get");
        mockDBAll = jest.spyOn(db, "all");
        /*.mockImplementation((sql, params, callback) => {
            callback(null, null); // Simula nessun errore
            return {} as Database; // Restituisce un oggetto vuoto come Database
        });*/
    },20000);

    afterEach(() => {
        jest.clearAllMocks();
    },20000);

    describe("GetUserByUsername DAO test", () => {

        const userDAO = new UserDAO()
    
        test("user non found", async ()=>{
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, undefined);
                return {} as any;
            });
        
            await expect(userDAO.getUserByUsername("user")).rejects.toThrow(new UserNotFoundError());
        
            mockDBGet.mockRestore();
        });
        test("errore Database", async () => {
            const mockDBRun = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error())
                return {} as any
            });
            await expect(userDAO.getUserByUsername("user")).rejects.toThrow(Error);
    
            mockDBRun.mockRestore()
        })
        
        test("User Returned correctly by Houser", async ()=>{
            const user: User = new User("username", "name", "surname", Role.ADMIN, "address", "1998-02-04")
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, user);
                return {} as any;
            });
        
            await expect(userDAO.getUserByUsername("username")).resolves.toEqual(user);
        
            mockDBGet.mockRestore();
        });
    })

    describe("updateUserInfo DAO test", () => {
        const userDAO = new UserDAO();
    
        test("Successful user information update", async () => {

            const user: User = new User("username", "name", "surname", Role.ADMIN, "address", "1998-02-04")
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, user);
                return {} as any;
            });
        
    
            const updatedUser = new User("username", "newName", "newSurname", Role.ADMIN, "newAddress", "2000-01-01");
    
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback.call({changes:1}, null); 
                return {} as any;
            });
    
            await expect(userDAO.updateUserInfo("username", "newName", "newSurname", "newAddress", "2000-01-01")).resolves.toEqual(updatedUser);
    
            mockDBRun.mockRestore();
        });
    
        test("Error when updating the user information", async () => {
            const user: User = new User("username", "name", "surname", Role.ADMIN, "address", "1998-02-04")
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, user);
                return {} as any;
            });
        
    
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Database error")); 
                return {} as any;
            });
    
            await expect(userDAO.updateUserInfo("username", "newName", "newSurname", "newAddress", "2000-01-01")).rejects.toThrow("Database error");
    
            mockDBRun.mockRestore();
        });
    
    });

    describe("getIsUserAuthenticated",()=>{
        test("should resolve true when user is authenticated", async () => {
        const mockHashedPassword=jest.spyOn(crypto,"timingSafeEqual")

            const mockUser = {
                username: 'username',
                password: 'hashedPassword', // Password già hashata
                salt: 'salt' // Salt associato alla password
            };
    
            mockDBGet.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, mockUser); // Simula un utente trovato nel database
                return {} as Database

            });
            mockHashedPassword.mockImplementation((a:any, b:any) => true);

            const isAuthenticated = await userDAO.getIsUserAuthenticated("username", "plainPassword");
            expect(isAuthenticated).toBe(true);
            mockHashedPassword.mockRestore();
        });
        test("should resolve false when user is not found in database", async () => {
            mockDBGet.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, null); // Simula utente non trovato nel database
                return {} as Database
            });
    
            const isAuthenticated = await userDAO.getIsUserAuthenticated("username", "plainPassword");
            expect(isAuthenticated).toBe(false);
        });
        test("should resolve false when user salt is not saved in the database", async () => {
            const mockUser = {
                username: 'username',
                password: 'hashedPassword' // Password già hashata
                // Salt mancante
            };
    
            mockDBGet.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, mockUser); // Simula un utente trovato nel database senza il campo "salt"
                return {} as Database

            });
    
            const isAuthenticated = await userDAO.getIsUserAuthenticated("username", "plainPassword");
            expect(isAuthenticated).toBe(false);
        });
    
        test("should resolve false when password does not match", async () => {
            const mockUser = {
                username: 'username',
                password: 'differentHashedPassword', // Password diversa
                salt: 'salt' // Salt associato alla password
            };
    
            mockDBGet.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, mockUser); // Simula un utente trovato nel database
                return {} as Database

            });
    
            const isAuthenticated = await userDAO.getIsUserAuthenticated("username", "plainPassword");
            expect(isAuthenticated).toBe(false);
        });
    
        test("should reject with an error if db.get fails", async () => {
            const mockError = new Error("Failed to retrieve user");
            mockDBGet.mockImplementation((sql: any, params: any, callback: any) => {
                callback(mockError); // Simula un errore nel recupero dell'utente
                return {} as Database

            });
    
            await expect(userDAO.getIsUserAuthenticated("username", "plainPassword")).rejects.toThrow(mockError);
        });

        test("should reject with an error if there is an exception", async () => {
            const mockError = new Error("Unexpected error");
            mockDBGet.mockImplementationOnce(() => {
                throw mockError; // Simula un'eccezione
            });
            await expect(userDAO.getIsUserAuthenticated("username", "plainPassword")).rejects.toThrow(mockError);

        });

        
      

    });

    describe("createUser", () => {

        test("It should resolve true when user is created", async () => {
            const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            mockDBRun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null); // Simula nessun errore
                return {} as Database; // Restituisce un oggetto vuoto come Database
            });

            const result = await userDAO.createUser("username", "name", "surname", "password", "role")
            expect(result).toBe(true)
            mockRandomBytes.mockRestore()
            mockScrypt.mockRestore()
        });

        test("should throw UserAlreadyExistsError if username is taken", async () => {
            //modifica il mock per simulare l'errore di unicità del database
            mockDBRun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(new Error("UNIQUE constraint failed: users.username"));
                return {} as Database

            });

            await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow(UserAlreadyExistsError);
        });

        test("should reject error", async () => {
            //modifica il mock per simulare un errore generico
            mockDBRun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(new Error("Generic error in db.run"));
                return {} as Database

            });
            await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow("Generic error in db.run");
        });

        test("should reject with an error if there is an exception", async () => {
            const mockError = new Error("Unexpected error");
            mockDBRun.mockImplementationOnce(() => {
                throw mockError; // Simula un'eccezione
            });
            await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow(mockError);

        });

    });


    describe('getUsers', () => {
        test("should resolve to an empty array when no users exist", async () => {
            mockDBAll.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, []);//Simula nessun risultato
                return {} as Database

            });
            const users = await userDAO.getUsers();
            expect(users).toEqual([]);
        });

        test("should resolve to an array of users", async () => {
            const mockUser = [
                { username: 'user1', name: 'John', surname: 'Doe', role: "Customer", address: '123 Main St', birthdate: '1990-01-01' },
                { username: 'user2', name: 'Jane', surname: 'Doe', role: "Manager", address: '456 Main St', birthdate: '1991-02-02' }
            ]
            mockDBAll.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, mockUser);
                return {} as Database

            });
            const users = await userDAO.getUsers();
            const expectedUsers = mockUser.map((row: { username: string; name: string; surname: string; role: string; address: string; birthdate: string; }) => new User(row.username, row.name, row.surname, row.role as Role, row.address, row.birthdate))

            expect(users).toEqual(
                expectedUsers
            );
        });

        test("should reject with error if db.all fails", async () => {
            mockDBAll.mockImplementation((sql: any, params: any, callback: any) => {
                callback(new Error("Database error"), null);
                return {} as Database
            });
            await expect(userDAO.getUsers()).rejects.toThrow("Database error")
        });

        test("should reject with an error if there is an exception", async () => {
            const mockError = new Error("Unexpected error");
            mockDBAll.mockImplementationOnce(() => {
                throw mockError; // Simula un'eccezione
            });
            await expect(userDAO.getUsers()).rejects.toThrow(mockError);
        });

    });

    describe("getUsersByRole", () => {
        test("should resolve to an array of users with the specified role", async () => {
            const mockUser = [
                { username: 'user1', name: 'John', surname: 'Doe', role: "Customer", address: '123 Main St', birthdate: '1990-01-01' },
                { username: 'user2', name: 'Jane', surname: 'Doe', role: "Customer", address: '456 Main St', birthdate: '1991-02-02' }
            ];
            mockDBAll.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, mockUser);
                return {} as Database

            });
            const users = await userDAO.getUsersByRole("Customer");
            const expectedUsers = mockUser.map((row: { username: string; name: string; surname: string; role: string; address: string; birthdate: string; }) => new User(row.username, row.name, row.surname, row.role as Role, row.address, row.birthdate));
            expect(users).toEqual(expectedUsers);
        });

        test("should reject with an error if db.all fails", async () => {
            mockDBAll.mockImplementation((sql: any, params: any, callback: any) => {
                callback(new Error("Database Error"), null);
                return {} as Database
            });
            await expect(userDAO.getUsersByRole("Customer")).rejects.toThrow("Database Error");
        });
        test("should resolve to an empty array no users with the specified role are found", async () => {
            mockDBAll.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null, []);
                return {} as Database
            });
            const users = await userDAO.getUsersByRole("NonExistentRole");
            expect(users).toEqual(users);
        });

        test("should reject with an error if there is an exception", async () => {
            const mockError = new Error("Unexpected error");
            mockDBAll.mockImplementationOnce(() => {
                throw mockError; // Simula un'eccezione
            });
            await expect(userDAO.getUsersByRole("NonExistentRole")).rejects.toThrow(mockError);
        });


    });

    describe("deleteUser", () => {
        test("should resolve true when user is successfully deleted", async () => {
            mockDBRun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null);//Simula nessun errore
                return {} as Database
            });
            const result = await userDAO.deleteUser("username");
            expect(result).toBe(true);
            expect(mockDBRun).toHaveBeenCalledWith(
                "DELETE FROM users WHERE username = ?",
                ["username"],
                expect.any(Function)
            );
        });

        test("should reject with an error if db.run fails", async () => {
            mockDBRun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(new Error("Failed to delete user"));//Simula nessun errore
                return {} as Database
            });
            await expect(userDAO.deleteUser("username")).rejects.toThrow("Failed to delete user")
        });

        test("should reject with an error if there is an exception", async () => {
            const mockError = new Error("Unexpected error");
            mockDBRun.mockImplementationOnce(() => {
                throw mockError; // Simula un'eccezione
            });
            await expect(userDAO.deleteUser("username")).rejects.toThrow(mockError);
        });

    });

    describe("deleteAll", () => {
        test('should resolve to true when all non-admin users are deleted successfully', async () => {
            mockDBRun.mockImplementation((sql: any, params: any, callback: any) => {
                callback(null);//Simula nessun errore
                return {} as Database
            });
            const result = await userDAO.deleteAll();
            expect(result).toBe(true);
            expect(mockDBRun).toHaveBeenCalledWith(
                "DELETE FROM users WHERE role != 'Admin'",
                [],
                expect.any(Function)
            );
        });
        test('should reject with error when database deletion fails', async () => {
            const errorMessage = 'Deletion failed';
            mockDBRun.mockImplementation((sql:any, params:any, callback:any) => {
                callback(new Error(errorMessage));
                return {} as Database
            });
    
            await expect(userDAO.deleteAll()).rejects.toThrow(errorMessage);
        });
        test("should reject with an error if there is an exception", async () => {
            const mockError = new Error("Unexpected error");
            mockDBRun.mockImplementationOnce(() => {
                throw mockError; // Simula un'eccezione
            });
            await expect(userDAO.deleteAll()).rejects.toThrow(mockError);
        });
   

    });


})






