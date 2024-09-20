import { test, expect, jest, afterEach, beforeEach, describe } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { Role, User } from "../../src/components/user";
import { UnauthorizedUserError, UserAlreadyExistsError, UserIsAdminError, UserNotFoundError } from "../../src/errors/userError";

jest.mock("../../src/dao/userDAO")
//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters
describe("User controller functions unit tests", () => {
    let userController: UserController;

    beforeEach(() => {
        userController = new UserController();
    },20000);

    afterEach(() => {
        jest.clearAllMocks();
    },20000);


    describe('getUserByUsername function', () => {
        test("Admin retrieves any user", async () => {
            userController = new UserController();
            const adminUser: User = {
                username: "admin",
                name: "Admin",
                surname: "Admin",
                address: "Admin Address",
                birthdate: "2000-01-01",
                role: Role.ADMIN
            };
            const mockUser: User = {
                username: "testUser",
                name: "Test",
                surname: "User",
                address: "Test Address",
                birthdate: "2000-01-01",
                role: Role.CUSTOMER
            };
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(mockUser);
            const response = await userController.getUserByUsername(adminUser, "testUser");
            expect(response).toEqual(mockUser);
        });
        
        test("Non-admin user retrieves own information", async () => {
            userController = new UserController();
            const nonAdminUser: User = {
                username: "testUser",
                name: "Test",
                surname: "User",
                address: "Test Address",
                birthdate: "2000-01-01",
                role: Role.CUSTOMER
            };
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(nonAdminUser);
            const response = await userController.getUserByUsername(nonAdminUser, "testUser");
            expect(response).toEqual(nonAdminUser);
        });
        
        test("Non-admin user cannot retrieve other user's information", async () => {
            userController = new UserController();
            const nonAdminUser: User = {
                username: "testUser1",
                name: "Test",
                surname: "User",
                address: "Test Address",
                birthdate: "2000-01-01",
                role: Role.CUSTOMER
            };
            const requestedUser: User = {
                username: "testUser2",
                name: "Test",
                surname: "User",
                address: "Test Address",
                birthdate: "2000-01-01",
                role: Role.CUSTOMER
            };
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(requestedUser);
            await expect(userController.getUserByUsername(nonAdminUser, "testUser2")).rejects.toThrow(UnauthorizedUserError);
        });
        
        test("User not found in the database", async () => {
            userController = new UserController();
            const adminUser: User = {
                username: "admin",
                name: "Admin",
                surname: "Admin",
                address: "Admin Address",
                birthdate: "2000-01-01",
                role: Role.ADMIN
            };
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValue(new UserNotFoundError());
            await expect(userController.getUserByUsername(adminUser, "nonExistentUser")).rejects.toThrow(UserNotFoundError);
        });
        
        
    });

    describe("updateUserInfo function", () => {
    test("User updates own information", async () => {
        userController = new UserController();
        const user: User = {
            username: "testUser",
            name: "Test",
            surname: "User",
            address: "Test Address",
            birthdate: "2000-01-01",
            role: Role.CUSTOMER
        };
        jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(user); // Mock the getUserByUsername method
        jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(user); // Mock the updateUserInfo method
    
        const updatedUser = await userController.updateUserInfo(user, "NewName", "NewSurname", "NewAddress", "2001-01-01", "testUser");
    
        // Check if the getUserByUsername and updateUserInfo methods were called with the correct parameters
        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("testUser");
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith("testUser", "NewName", "NewSurname", "NewAddress", "2001-01-01");
    
        // Check if the updated user is returned
        expect(updatedUser).toEqual(user);
    });
    
    test("Non-admin user cannot update other user's information", async () => {
        userController = new UserController();
        const nonAdminUser: User = {
            username: "testUser1",
            name: "Test",
            surname: "User",
            address: "Test Address",
            birthdate: "2000-01-01",
            role: Role.CUSTOMER
        };
    
        const requestedUser: User = {
            username: "testUser2",
            name: "Test",
            surname: "User",
            address: "Test Address",
            birthdate: "2000-01-01",
            role: Role.CUSTOMER
        };
    
        jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(requestedUser);
    
        await expect(userController.updateUserInfo(nonAdminUser, "NewName", "NewSurname", "NewAddress", "2001-01-01", "testUser2")).rejects.toThrow(UnauthorizedUserError);
    });
    


});
    describe("createUser", () => {
        test("It should return true", async () => {
            const testUser = { //Define a test user object
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }
            jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
            //Call the createUser method of the controller with the test user object
            const response = await userController.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);
            //Check if the createUser method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role);
            expect(response).toBe(true); //Check if the response is true
        });
        test("It should throw an error when DAO createUser method throws an error", async () => {
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }; 
            jest.spyOn(UserDAO.prototype, "createUser").mockRejectedValueOnce(new Error("DAO error"));
            await expect(userController.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role)).rejects.toThrow("DAO error");
            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role);
        });
        test("It should throw an UserArleadyExist erroe when DAO createUser method throws that error", async () => {
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }; 
            jest.spyOn(UserDAO.prototype, "createUser").mockRejectedValueOnce(new UserAlreadyExistsError);
            await expect(userController.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role)).rejects.toThrow(UserAlreadyExistsError);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role);
        });


    });

    describe("getUsers", () => {
        test("It should return a list of users", async () => {
            const mockUsers = [new User("Customer", "Customer", "Customer", Role.CUSTOMER, "Customer", "01/02/2001"), new User("Admin", "Admin", "Admin", Role.ADMIN, "Admin", "02/04/2002")];
            jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValue(mockUsers);
            const users = await userController.getUsers();
            expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
            expect(users).toEqual(mockUsers);
        });
        test("It should throw an error when DAO getUsers method throws an error", async () => {
            jest.spyOn(UserDAO.prototype, "getUsers").mockRejectedValueOnce(new Error("DAO error"));
            await expect(userController.getUsers()).rejects.toThrow("DAO error");
            expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
        });
    });

    describe("getUsersByRole", ()=>{
        test("It should return a list of customers", async () => {
            const mockUsers = [new User("Customer1", "Customer1", "Customer1", Role.CUSTOMER, "Customer1", "01/02/2001"), new User("Customer2", "Customer2", "Customer2", Role.CUSTOMER, "Customer2", "02/04/2002")];
            jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValue(mockUsers);
            const users = await userController.getUsersByRole("Customer");
            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
            expect(users).toEqual(mockUsers);
        });

        test("It should throw an error when DAO getUsers method throws an error", async () => {
            jest.spyOn(UserDAO.prototype, "getUsersByRole").mockRejectedValueOnce(new Error("DAO error"));
            await expect(userController.getUsersByRole("NonExistentRole")).rejects.toThrow("DAO error");
            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
        });

    });

    describe("deleteAll", ()=>{
        test("It should delete all users and return true", async () => {
            jest.spyOn(UserDAO.prototype, "deleteAll").mockResolvedValueOnce(true);

            const response = await userController.deleteAll();

            expect(UserDAO.prototype.deleteAll).toHaveBeenCalledTimes(1);
            expect(response).toBe(true);
        });
        test("It should throw an error when DAO deleteAll method throws an error", async () => {
            jest.spyOn(UserDAO.prototype, "deleteAll").mockRejectedValue(new Error("DAO error"));
            await expect(userController.deleteAll()).rejects.toThrow("DAO error");
            expect(UserDAO.prototype.deleteAll).toHaveBeenCalledTimes(1);
        });


    });
    describe("deleteUser",()=>{
       const testUserAdmin = new User("admin", "admin", "admin", Role.ADMIN,"","");
       const testUser = new User("user", "user", "user", Role.CUSTOMER, "", "");
       const testUserAdmin1 = new User("admin1", "admin1", "admin1", Role.ADMIN, "", "");
       
        test("it should delete the user and return true, Admin is traing to delete another non-admin user ",async ()=>{
            jest.spyOn(UserDAO.prototype,"getUserByUsername").mockResolvedValue(testUser)
            jest.spyOn(UserDAO.prototype,"deleteUser").mockResolvedValue(true);
            const result = await userController.deleteUser(testUserAdmin, testUser.username);
            expect(result).toBe(true);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(testUser.username);

        });
        test("it should delete the user and return true, user is traing to delete him self ",async ()=>{
            jest.spyOn(UserDAO.prototype,"getUserByUsername").mockResolvedValue(testUser)
            jest.spyOn(UserDAO.prototype,"deleteUser").mockResolvedValue(true);
            const result = await userController.deleteUser(testUser, testUser.username);
            expect(result).toBe(true);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(testUser.username);

        });

        test("should throw UserNotFoundError if the user does not exist", async ()=>{
            jest.spyOn(UserDAO.prototype,"getUserByUsername").mockRejectedValueOnce(new UserNotFoundError());
            await expect(userController.deleteUser(testUser,"nonexistingUser")).rejects.toThrow(UserNotFoundError);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(0);

        });
        test("should throw UnauthorizedUserError if the user is not admin and tries to delete another user",async ()=>{
            jest.spyOn(UserDAO.prototype,"getUserByUsername").mockResolvedValue(testUserAdmin);
            await expect(userController.deleteUser(testUser,testUserAdmin.username)).rejects.toThrow(UnauthorizedUserError);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(0);

            
        });

        test("should throw UserIsAdminError if an admin tries to delete another admin", async ()=>{
            jest.spyOn(UserDAO.prototype,"getUserByUsername").mockResolvedValue(testUserAdmin1);
            await expect(userController.deleteUser(testUserAdmin,testUserAdmin1.username)).rejects.toThrow(UserIsAdminError);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(0);
        });

    });

});











/*

test("It should return true", async () => {
    const testUser = { //Define a test user object
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    }
    jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the createUser method of the controller with the test user object
    const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);

    //Check if the createUser method of the DAO has been called once with the correct parameters
    expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role);
    expect(response).toBe(true); //Check if the response is true
});*/