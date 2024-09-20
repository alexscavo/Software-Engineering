import { InvalidNameGroupingError, ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError, InvalidCategoryGroupingError, InvalidModelGroupingError, InvalidGroupingError, ChangeDateBeforeArrivalDateError, } from "../errors/productError";
import ProductDAO from "../dao/productDAO";
import { Product } from "../components/product";

/**
 * Represents a controller for managing products.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class ProductController {
    private dao: ProductDAO

    constructor() {
        this.dao = new ProductDAO
    }

    /**
     * Registers a new product concept (model, with quantity defining the number of units available) in the database.
     * @param model The unique model of the product.
     * @param category The category of the product.
     * @param quantity The number of units of the new product.
     * @param details The optional details of the product.
     * @param sellingPrice The price at which one unit of the product is sold.
     * @param arrivalDate The optional date in which the product arrived.
     * @returns A Promise that resolves to nothing.
     */
    async registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<void> {
        try {
            // Check if the product already exists
            const existingProduct = await this.dao.getProducts('model', undefined, model);
            if (existingProduct && existingProduct.length!==0) {
                throw new ProductAlreadyExistsError(); //status 409
            }

            // Set arrivalDate to current date if not provided
            const actualArrivalDate = arrivalDate ? arrivalDate : new Date().toISOString().split('T')[0]; //format the date to YYYY-MM-DD without the time portion.

            await this.dao.registerProduct(model, category, quantity, details, sellingPrice, actualArrivalDate);
        } catch (error) {
            //console.error('Error registering product:', error);
            throw error;
        }
    }

    /**
     * Increases the available quantity of a product through the addition of new units.
     * @param model The model of the product to increase.
     * @param newQuantity The number of product units to add. This number must be added to the existing quantity, it is not a new total.
     * @param changeDate The optional date in which the change occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async changeProductQuantity(model: string, newQuantity: number, changeDate: string | null): Promise<number> {
        // Check if model is provided
        // console.log("modelll",model)
        // console.log(changeDate)
    
        if (!model || model.trim() === '') {
            throw new Error('Model is required.');
        }

        // Check if newQuantity is a valid number and non-negative
        if (typeof newQuantity !== 'number' || newQuantity < 0) {
            throw new Error('New quantity must be a non-negative number.');
        }


        if (changeDate) {
            // Check if changeDate is in a valid format 
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(changeDate)) {
                throw new Error('Change date must be in the format YYYY-MM-DD.');
            }
            // Check if changeDate is not after the current date
            const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
            if (changeDate > currentDate) {
                throw new Error('Change date cannot be after the current date.');
            }
        }
            
        try {
            //console.log(model)
            const products = await this.getProducts('model', undefined, model);
            //console.log(products)
            if (products && products.length===0) {
                throw new ProductNotFoundError(); //status 404
            }
            // Since i'm sure that products will be a list with one element
            // Check if changeDate is before arrival Date
            if ( products[0].arrivalDate > changeDate){
                throw new ChangeDateBeforeArrivalDateError();
            }
            return await this.dao.updateProductQuantity(model, newQuantity, changeDate);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Decreases the available quantity of a product through the sale of units.
     * @param model The model of the product to sell
     * @param quantity The number of product units that were sold.
     * @param sellingDate The optional date in which the sale occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async sellProduct(model: string, quantity: number, sellingDate: string | null): Promise<number> {
        try {
            const products = await this.getProducts('model', undefined, model);
            //Check if sellingDate is not before arrival date
            if(new Date(products[0].arrivalDate) > new Date(sellingDate)){
                throw new ChangeDateBeforeArrivalDateError();
            }
            const currentQuantity = await this.dao.sellProduct(model, quantity, sellingDate);
            return currentQuantity;
        } catch (error) {
            throw error;
        }
    }
    /**
     * Returns all products in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getProducts(grouping: string | null, category: string | null, model: string | null) :Promise<Product[]>  {
        // Check for invalid grouping with non-null category or model
        if (!grouping && (category || model)) {
            throw new InvalidGroupingError();
        }

        if(grouping && grouping!== 'category' && grouping != 'model'){
            throw new InvalidNameGroupingError();
        }

        // Check for invalid category grouping
        if (grouping === 'category') {
            if (!category || model || (category!=='Smartphone' && category!== 'Laptop' && category!=='Appliance')){
                throw new InvalidCategoryGroupingError();
            }
        }
        
        // Check for invalid model grouping
        if (grouping === 'model') {
            if (!model || category || model.trim() === '') {
                throw new InvalidModelGroupingError();
            }
        }

        // Check if model does not represent a product in the database (only when grouping is model)
        if (grouping === 'model') {
            const products = await this.dao.getProducts(grouping, category, model);
            if (products && products.length === 0) {
                throw new ProductNotFoundError();
            }
            return products;
        }

        // Return the products for other cases
        return this.dao.getProducts(grouping, category, model);
    }

    /**
     * Returns all available products (with a quantity above 0) in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getAvailableProducts(grouping: string | null, category: string | null, model: string | null) :Promise<Product[]> { 

        if (!grouping && (category || model)) {
            throw new InvalidGroupingError();
        }
        
        if(grouping && grouping!== 'category' && grouping != 'model'){
            throw new InvalidNameGroupingError();
        }

        if (!grouping && (category || model)) {
            throw new InvalidGroupingError();
        }

        // Check for invalid category grouping
        if (grouping === 'category') {
            if (!category || model || (category!=='Smartphone' && category!== 'Laptop' && category!=='Appliance')){
                throw new InvalidCategoryGroupingError();
            }
        }
        
        // Check for invalid model grouping
        if (grouping === 'model') {
            if (!model || category || model.trim() === '') {
                throw new InvalidModelGroupingError();
            }
            
        }

        // Check if model does not represent a product in the database (only when grouping is model)
        if (grouping === 'model') {
            // Check if the model exists
            const productsModel = await this.getProducts(grouping, category, model);
            const specificProduct = productsModel.find((product) => product.model === model);
            if (!specificProduct) {
                throw new ProductNotFoundError();
            }
            
            const products = await this.dao.getAvailableProducts(grouping, category, model);
            // if (products && products.length === 0) {
            //     throw new ProductNotFoundError();
            // }
            return products;
        }

        // Return the available products for other cases
        return this.dao.getAvailableProducts(grouping, category, model);

        
    }

    /**
     * Deletes all products.
     * @returns A Promise that resolves to `true` if all products have been successfully deleted.
     */
    async deleteAllProducts(): Promise<boolean> {
        try {
            await this.dao.deleteAllProducts();
            return true;
        } catch (error) {
            //console.error('Error deleting all products:', error);
            throw error;
        }
    }

    /**
     * Deletes one product, identified by its model
     * @param model The model of the product to delete
     * @returns A Promise that resolves to `true` if the product has been successfully deleted.
     */
    async deleteProduct(model: string): Promise<boolean> {
        try {
            await this.dao.deleteProduct(model);
            return true;
        } catch (error) {
            throw error;
        }
    }

}

export default ProductController;