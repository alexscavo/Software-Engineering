import { test, expect, afterEach, beforeEach, describe, afterAll } from "@jest/globals";
import db from "../../src/db/db";
import UserDAO from "../../src/dao/userDAO";
import UserController from "../../src/controllers/userController";
import { Role, User } from "../../src/components/user";
import { UnauthorizedUserError, UserAlreadyExistsError, UserIsAdminError, UserNotFoundError } from "../../src/errors/userError";

describe("User controller functions integration tests with Real Database", () => {
    let userDAO: UserDAO;
    let userController: UserController;

    beforeEach((done) => {
        db.serialize(() => {
            db.run("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, name TEXT, surname TEXT, password TEXT, salt TEXT, role TEXT, address TEXT, birthdate TEXT)", done);
        });
        userDAO = new UserDAO();
        userController = new UserController();
    },20000);

    afterEach((done) => {
        db.serialize(() => {
            db.run("DELETE FROM users", done);
        });
    },20000);

    afterAll((done) => {
        db.serialize(() => {
            db.run("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, name TEXT, surname TEXT, password TEXT, salt TEXT, role TEXT, address TEXT, birthdate TEXT)", done);
        });
    });

    describe("createUser", () => {
        test("It should return true", async () => {
            const response = await userController.createUser("test", "test", "test", "test", Role.MANAGER);
            expect(response).toBe(true);

            const users = await userDAO.getUsers();
            expect(users).toHaveLength(1);
            expect(users[0]).toEqual(expect.objectContaining({
                username: "test",
                name: "test",
                surname: "test",
                role: "Manager"
            }));
        });
        test("should throw UserAlreadyExistsError if username is taken", async () => {
            await userDAO.createUser("testuser", "Test", "User", "password123", "Customer");
            
            await expect(userDAO.createUser("testuser", "Test", "User", "password123", "Customer"))
                .rejects.toThrow(UserAlreadyExistsError);
        });
  
    });

    describe("getUsers", () => {
        test("It should return a list of users", async () => {
            await userDAO.createUser("Customer", "Customer", "Customer", "Customer", "Customer");
            await userDAO.createUser("Admin", "Admin", "Admin", "Admin", "Admin");

            const users = await userController.getUsers();
            expect(users).toHaveLength(2);
        });
        test("It should return [] if there are no users", async () => {
            const users = await userController.getUsers();
            expect(users).toHaveLength(0);
        });

      
    });

    describe("getUsersByRole", () => {
        test("It should return a list of customers", async () => {
            await userDAO.createUser("Customer1", "Customer1", "Customer1", "Customer1", "Customer");
            await userDAO.createUser("Customer2", "Customer2", "Customer2", "Customer2", "Customer");

            const users = await userController.getUsersByRole("Customer");
            expect(users).toHaveLength(2);
            expect(users).toEqual([
                expect.objectContaining({ username: "Customer1", name: "Customer1", surname: "Customer1", role: "Customer" }),
                expect.objectContaining({ username: "Customer2", name: "Customer2", surname: "Customer2", role: "Customer" })
            ])
        });
        test("It should return [] when the role is not between customer admin or manager ", async () => {
            await userDAO.createUser("Customer1", "Customer1", "Customer1", "Customer1", "Customer");
            await userDAO.createUser("Customer2", "Customer2", "Customer2", "Customer2", "Customer");

            const users = await userController.getUsersByRole("InvalidRole");
            expect(users).toHaveLength(0);
        });
        test("It should return [] when there is no user ", async () => {
            await userDAO.createUser("Customer1", "Customer1", "Customer1", "Customer1", "Customer");
            await userDAO.createUser("Customer2", "Customer2", "Customer2", "Customer2", "Customer");

            const users = await userController.getUsersByRole("Admin");
            expect(users).toHaveLength(0);
        });


    });

    describe("deleteAll", () => {
        test("It should delete all non-Admin and return true", async () => {
            await userDAO.createUser("Admin", "Admin", "Admin", "Admin", "Admin");
            await userDAO.createUser("Customer1", "Customer1", "Customer1", "Customer1", "Customer");
            await userDAO.createUser("Customer2", "Customer2", "Customer2", "Customer2", "Customer");

            const response = await userController.deleteAll();
            expect(response).toBe(true); // Assuming deleteAll returns void

            const users = await userDAO.getUsers();
            expect(users).toHaveLength(1);
            expect(users).toEqual([
                expect.objectContaining({ username: "Admin", name: "Admin", surname: "Admin", role: "Admin" })
            ])

        });

       
    });


    describe("deleteUser", () => {
        const testUserAdmin = new User("admin", "admin", "admin", Role.ADMIN,"","");
       const testUser = new User("user", "user", "user", Role.CUSTOMER, "", "");
       const testUserAdmin1 = new User("admin1", "admin1", "admin1", Role.ADMIN, "", "");

        beforeEach(async () => {
            await userDAO.createUser(testUserAdmin.username, testUserAdmin.name, testUserAdmin.surname,"password",testUserAdmin.role);
            await userDAO.createUser(testUser.username, testUser.name, testUser.surname,"password", testUser.role);
            await userDAO.createUser(testUserAdmin1.username, testUserAdmin1.name, testUserAdmin1.surname, "password",testUserAdmin1.role);
            
        });

        test("it should delete the user and return true, Admin is trying to delete another non-admin user", async () => {
            const result = await userController.deleteUser(testUserAdmin, testUser.username);
            expect(result).toBe(true);

            const users = await userDAO.getUsers();
            expect(users).toHaveLength(2);
            expect(users.find(user => user.username === testUser.username)).toBeUndefined();
        });

        test("it should delete the user and return true, user is trying to delete himself", async () => {
            const result = await userController.deleteUser(testUser, testUser.username);
            expect(result).toBe(true);

            const users = await userDAO.getUsers();
            expect(users).toHaveLength(2);
            expect(users.find(user => user.username === testUser.username)).toBeUndefined();
        });

        test("should throw UserNotFoundError if the user does not exist", async () => {
            await expect(userController.deleteUser(testUser, "nonexistingUser")).rejects.toThrow(UserNotFoundError);
        });

        test("should throw UnauthorizedUserError if the user is not admin and tries to delete another user", async () => {
            await expect(userController.deleteUser(testUser, testUserAdmin.username)).rejects.toThrow(UnauthorizedUserError);
        });

        test("should throw UserIsAdminError if an admin tries to delete another admin", async () => {
            await expect(userController.deleteUser(testUserAdmin, testUserAdmin1.username)).rejects.toThrow(UserIsAdminError);
        });
    });
});
