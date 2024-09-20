import { describe, test, expect, beforeEach, afterEach,afterAll } from "@jest/globals";
import UserDAO from "../../src/dao/userDAO";
import db from "../../src/db/db";
import { UserAlreadyExistsError } from "../../src/errors/userError";
import crypto from "crypto";

describe("UserDAO integration test with Real Database", () => {
    let userDAO: UserDAO;

    beforeEach((done) => {
        // Create the users table before each test
        db.serialize(() => {
            db.run("DELETE FROM users", done);
        });
        userDAO = new UserDAO();
    },20000);

    afterEach((done) => {
        // Drop the users table after each test
        db.serialize(() => {
            db.run("DELETE FROM users", done);
        });
    },20000);

    describe("getIsUserAuthenticated",()=>{
        test("should resolve true when user is authenticated", async () => {
            const salt = crypto.randomBytes(16).toString("hex");
            const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);
            
            db.serialize(()=>{
                db.run("INSERT INTO users (username, name, surname, password, salt, role, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
                ["username", "Test", "User", hashedPassword, salt, "Customer", "123 Main St", "1990-01-01"]);
            })

            const isAuthenticated = await userDAO.getIsUserAuthenticated("username", "plainPassword");
            expect(isAuthenticated).toBe(true);
        });

        test("should resolve false when user is not found in database", async () => {
            const isAuthenticated = await userDAO.getIsUserAuthenticated("username", "plainPassword");
            expect(isAuthenticated).toBe(false);
        });

        test("should resolve false when user salt is not saved in the database", async () => {
            const hashedPassword = crypto.scryptSync("plainPassword", "salt", 16);


            db.run("INSERT INTO users (username, name, surname, password, role, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                ["username", "Test", "User", hashedPassword, "Customer", "123 Main St", "1990-01-01"]);  // Salt is missing

            const isAuthenticated = await userDAO.getIsUserAuthenticated("username", "plainPassword");
            expect(isAuthenticated).toBe(false);
        });

        test("should resolve false when password does not match", async () => {
            const salt = crypto.randomBytes(16).toString("hex");
            const differentHashedPassword = crypto.scryptSync("differentPassword", salt, 16);

            db.serialize(()=>{
                
            db.run("INSERT INTO users (username, name, surname, password, salt, role, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
                ["username", "Test", "User", differentHashedPassword, salt, "Customer", "123 Main St", "1990-01-01"]);

            })


            const isAuthenticated = await userDAO.getIsUserAuthenticated("username", "plainPassword");
            expect(isAuthenticated).toBe(false);
        });
    });



    describe("createUser", () => {
        test("createUser should add a new user to the database", async () => {
            await userDAO.createUser("testuser", "Test", "User", "password123", "Customer");

            const users = await userDAO.getUsers();
            expect(users).toHaveLength(1);
            expect(users[0]).toEqual(expect.objectContaining({
                username: "testuser",
                name: "Test",
                surname: "User",
                role: "Customer",
                address: null,
                birthdate: null
            }));
        });

        test("should throw UserAlreadyExistsError if username is taken", async () => {
            await userDAO.createUser("testuser", "Test", "User", "password123", "Customer");
            await expect(userDAO.createUser("testuser", "Test", "User", "password123", "Customer")).rejects.toThrow(new UserAlreadyExistsError);
        });
    });

   


describe("getUsers",()=>{
    test("getUsers should return all users", async () => {
        await userDAO.createUser("user1", "John", "Doe", "password1", "Customer");
        await userDAO.createUser("user2", "Jane", "Doe", "password2", "Manager");
    
        const users = await userDAO.getUsers();
        expect(users).toHaveLength(2);
        expect(users).toEqual([
            expect.objectContaining({ username: "user1", name: "John", surname: "Doe", role: "Customer" }),
            expect.objectContaining({ username: "user2", name: "Jane", surname: "Doe", role: "Manager" })
        ]);
    });

    test("getUsers dhould return [] in no users exist",async ()=>{
        const users = await userDAO.getUsers();
        expect(users).toHaveLength(0);
        expect(users).toEqual([]);

    });

});

describe("getUsersByRole",()=>{
    test("should return users with the specified role", async () => {
        await userDAO.createUser("user1", "John", "Doe", "password1", "Customer");
        await userDAO.createUser("user2", "Jane", "Doe", "password2", "Manager");

        const customers = await userDAO.getUsersByRole("Customer");
        expect(customers).toHaveLength(1);
        expect(customers[0]).toEqual(expect.objectContaining({ username: "user1", name: "John", surname: "Doe", role: "Customer" }));

        const managers = await userDAO.getUsersByRole("Manager");
        expect(managers).toHaveLength(1);
        expect(managers[0]).toEqual(expect.objectContaining({ username: "user2", name: "Jane", surname: "Doe", role: "Manager" }));
    });

    test("should return an empty array if no users with the specified role exist", async () => {
        const users = await userDAO.getUsersByRole("NonExistentRole");
        expect(users).toEqual([]);
    });
})


describe("deleteUser",()=>{
    test("deleteUser should remove a user from the database", async () => {
        await userDAO.createUser("testuser", "Test", "User", "password123", "Customer");
    
        await userDAO.deleteUser("testuser");
    
        const users = await userDAO.getUsers();
        expect(users).toHaveLength(0);
    });
    test("Deleting a user that doesn't exist shouldn't cause any problems (the user check is done in the controller) ",async ()=>{
        const bool=await userDAO.deleteUser("testuser");
        const users = await userDAO.getUsers();
        expect(users).toHaveLength(0);
        expect(bool).toBe(true)

    });
    
    
});

describe("deleteAll",()=>{
    test("should delete all non-admin users", async () => {
        await userDAO.createUser("admin", "Admin", "User", "password123", "Admin");
        await userDAO.createUser("customer1", "John", "Doe", "password123", "Customer");
        await userDAO.createUser("customer2", "Jane", "Doe", "password123", "Customer");

        await userDAO.deleteAll();

        const users = await userDAO.getUsers();
        expect(users).toHaveLength(1);
        expect(users[0]).toEqual(expect.objectContaining({
            username: "admin",
            role: "Admin"
        }));
    });

    test("should resolve to true if the users have been deleted", async () => {
        await userDAO.createUser("customer1", "John", "Doe", "password123", "Customer");
        await userDAO.createUser("customer2", "Jane", "Doe", "password123", "Customer");

        const result = await userDAO.deleteAll();
        expect(result).toBe(true);

        const users = await userDAO.getUsers();
        expect(users).toHaveLength(0);
    });

    test("It shouldn't cause any problems when there are no users present",async ()=>{
        const result= await userDAO.deleteAll()
        expect(result).toBe(true);
    });

})

describe("getUserByUsername function", () => {
    test("Admin retrieves any user", async () => {
        const salt = crypto.randomBytes(16).toString("hex");
        const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

        db.run("INSERT INTO users (username, name, surname, password, salt, role, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
            ["username", "Test", "User", hashedPassword, salt, "Admin", "123 Main St", "1990-01-01"]);

        const user = await userDAO.getUserByUsername("username");
        expect(user).toEqual(expect.objectContaining({ username: "username", name: "Test", surname: "User", role: "Admin" }));
    });

    test("Non-admin user retrieves own information", async () => {
        const salt = crypto.randomBytes(16).toString("hex");
        const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

        db.run("INSERT INTO users (username, name, surname, password, salt, role, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
            ["username", "Test", "User", hashedPassword, salt, "Customer", "123 Main St", "1990-01-01"]);

        const user = await userDAO.getUserByUsername("username");
        expect(user).toEqual(expect.objectContaining({ username: "username", name: "Test", surname: "User", role: "Customer" }));
    });

    test("Non-admin user cannot retrieve other user's information", async () => {
        const salt = crypto.randomBytes(16).toString("hex");
        const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

        db.run("INSERT INTO users (username, name, surname, password, salt, role, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
            ["username", "Test", "User", hashedPassword, salt, "Customer", "123 Main St", "1990-01-01"]);

        // Assuming that the function throws an error when a non-admin user tries to get another user's information
        await expect(userDAO.getUserByUsername("otherUsername")).rejects.toThrow();
    });

    test("User not found in the database", async () => {
        // Assuming that the function throws an error when the user is not found
        await expect(userDAO.getUserByUsername("nonexistentUsername")).rejects.toThrow();
    });
});


describe("updateUserInfo function", () => {
    test("User updates own information", async () => {
        const salt = crypto.randomBytes(16).toString("hex");
        const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

        db.run("INSERT INTO users (username, name, surname, password, salt, role, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
            ["username", "Test", "User", hashedPassword, salt, "Customer", "123 Main St", "1990-01-01"]);

        await userDAO.updateUserInfo("username", "Updated", "User", "456 Main St", "1990-01-01");

        const user = await userDAO.getUserByUsername("username");
        expect(user).toEqual(expect.objectContaining({ username: "username", name: "Updated", surname: "User", role: "Customer", address: "456 Main St", birthdate: "1990-01-01" }));
    });

    test("Non-admin user cannot update other user's information", async () => {
        const salt = crypto.randomBytes(16).toString("hex");
        const hashedPassword = crypto.scryptSync("plainPassword", salt, 16);

        db.run("INSERT INTO users (username, name, surname, password, salt, role, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
            ["username", "Test", "User", hashedPassword, salt, "Customer", "123 Main St", "1990-01-01"]);

        // Assuming that the function throws an error when a non-admin user tries to update another user's information
        await expect(userDAO.updateUserInfo("otherUsername", "Updated", "User", "456 Main St", "1990-01-01")).rejects.toThrow();
    });
});





});
