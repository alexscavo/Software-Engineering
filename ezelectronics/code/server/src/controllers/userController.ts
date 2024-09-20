import { UnauthorizedUserError, UserNotFoundError, WrongParametersError, UserAlreadyExistsError, UserIsAdminError} from "../errors/userError";
import { User } from "../components/user"
import UserDAO from "../dao/userDAO"
import { DateError, Utility } from "../utilities"

/**
 * Represents a controller for managing users.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class UserController {
    private dao: UserDAO

    constructor() {
        this.dao = new UserDAO
    }

    /**
     * Creates a new user.
     * @param username - The username of the new user. It must not be null and it must not be already taken.
     * @param name - The name of the new user. It must not be null.
     * @param surname - The surname of the new user. It must not be null.
     * @param password - The password of the new user. It must not be null.
     * @param role - The role of the new user. It must not be null and it can only be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    async createUser(username: string, name: string, surname: string, password: string, role: string): Promise<boolean> {
        try{
            const user: any = await this.dao.createUser(username, name, surname, password, role);
            return user;
        } catch (error){
            throw error;
        }
    }

    /**
     * Returns all users.
     * @returns A Promise that resolves to an array of users.
     */
    async getUsers() :Promise<User[]>  { 
        try{
            const users: any = await this.dao.getUsers();
            return users
        } catch (error){

            throw error;
        }
    }

    /**
     * Returns all users with a specific role.
     * @param role - The role of the users to retrieve. It can only be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to an array of users with the specified role.
     */
    async getUsersByRole(role: string) :Promise<User[]>  {
        try{
            const ret: any = await this.dao.getUsersByRole(role);
            return ret
        } catch (error){
            throw error;
        }
     }

    /**
     * Returns a specific user.
     * The function has different behavior depending on the role of the user calling it:
     * - Admins can retrieve any user
     * - Other roles can only retrieve their own information
     * @param username - The username of the user to retrieve. The user must exist.
     * @returns A Promise that resolves to the user with the specified username.
     */
    async getUserByUsername(user: User, username: string) :Promise<User>  {
        // check utente da eliminare registrato nel db
        const checkUser = await this.dao.getUserByUsername(username);
        if(!checkUser)
            throw new UserNotFoundError();

        // if the use is not Admin can only information about his account
        if(!Utility.isAdmin(user)) {    
            if(user.username !== username)   
                throw new UnauthorizedUserError();
        }
        return checkUser;
     }

    /**
     * Deletes a specific user
     * The function has different behavior depending on the role of the user calling it:
     * - Admins can delete any non-Admin user
     * - Other roles can only delete their own account
     * @param username - The username of the user to delete. The user must exist.
     * @returns A Promise that resolves to true if the user has been deleted.
     */
    async deleteUser(user: User, username: string) :Promise<Boolean>  {
        try{
        // check utente da eliminare registrato nel db
        const checkUser = await this.dao.getUserByUsername(username);
        if(user.username !== username) {    // utenteA !== utenteB
            if(Utility.isAdmin(user)===false) {    // utenteA non e' admin

                throw new UnauthorizedUserError();  // un utente se non e' admin non puo' cancellare un altro utente
            }
            
            if(Utility.isAdmin(checkUser)) {    // utenteA e' un admin, utenteB e' un admin
                throw new UserIsAdminError();   // un admin puo' cancellare solo se stesso o un utente non admin
            }
        }

        return this.dao.deleteUser(username);}
        catch(err){
            throw err
        }
    }

    /**
     * Deletes all non-Admin users
     * @returns A Promise that resolves to true if all non-Admin users have been deleted.
     */
    async deleteAll():Promise<Boolean> { 
        try{
            await this.dao.deleteAll();
            return true
        }catch (error) {
            throw error;
        }
    }

    /**
     * Updates the personal information of one user. The user can only update their own information.
     * @param user The user who wants to update their information
     * @param name The new name of the user
     * @param surname The new surname of the user
     * @param address The new address of the user
     * @param birthdate The new birthdate of the user
     * @param username The username of the user to update. It must be equal to the username of the user parameter.
     * @returns A Promise that resolves to the updated user
     */
    async updateUserInfo(user: User, name: string, surname: string, address: string, birthdate: string, username: string) :Promise<User> { 

        // se l'utente non e' admin puo' eliminare solamente il suo account
        if(!Utility.isAdmin(user)) {    
            if(user.username !== username)   
                throw new UnauthorizedUserError();
        }

        // birthdate successiva alla data corrente
        if(!Utility.isAfterCurrentDate(birthdate))
            throw new DateError();

        // utente da aggiornare registrato nel db
        const checkUser = await this.dao.getUserByUsername(username);
        if(!checkUser)
            throw new UserNotFoundError();

        return this.dao.updateUserInfo(username, name, surname, address, birthdate);    // chiamo la funzione dal DAO e ne ritorno la Promise
    }
}

export default UserController