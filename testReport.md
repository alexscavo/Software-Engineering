# Test Report


<The goal of this document is to explain how the application was tested, detailing how the test cases were defined and what they cover>

# Contents

- [Test Report](#test-report)
- [Contents](#contents)
- [Dependency graph](#dependency-graph)
- [Integration approach](#integration-approach)
- [Tests](#tests)
- [Coverage](#coverage)
  - [Coverage of FR](#coverage-of-fr)
  - [Coverage white box](#coverage-white-box)

# Dependency graph

     <report the here the dependency graph of EzElectronics>

# Integration approach

    Abbiamo seguito un approccio bottom-up testando inizialmente il funzionamento del database e del dao insieme, eseguendo successivamente API test per testare il funzionamento dell'intera applicazione nei vari scenari e casi d'uso, verificando il funzionamento di tutte le funzionalita' ed API.

    Step1: dao + db
    Step2: Routes + controller + dao + db

# Tests

<in the table below list the test cases defined For each test report the object tested, the test level (API, integration, unit) and the technique used to define the test case (BB/ eq partitioning, BB/ boundary, WB/ statement coverage, etc)> <split the table if needed>

### REVIEW DAO
|Id| Test case name | Object(s) tested | Test level | Technique used |
| :-: | :------------: | :--------------: | :--------: | :------------: |
|1.1.1| Add a product review successfully | addProductReview  | Unit | WB/ Statement Coverage |
|1.1.2| Reject with an error when db.run callback contains an error | addProductReview | Unit | WB/ Statement Coverage |
|1.1.3| Reject with an error when db.run throws an error | addProductReview  | Unit | WB/ Statement Coverage |
|1.2.1| It should delete the product from th | deleteUserProductReview  | Unit | WB/ Statement Coverage |
|1.2.2| Reject with an error when db.run callback contains an error (deleteUserProductReview) | deleteUserProductReview  | Unit | WB/ Statement Coverage |
|1.2.3| Reject with an error when db.run throws an error (deleteUserProductReview) | deleteUserProductReview  | Unit | WB/ Statement Coverage |
|1.3.1| It should return a product review | getUserProductReview  | Unit | WB/ Statement Coverage |
|1.3.2| It should return null | getUserProductReview | Unit | WB/ Statement Coverage |
|1.3.3| Reject with an error when db.get callback contains an error | getUserProductReview  | Unit | WB/ Statement Coverage |
|1.3.4| Reject with an error when db.get throws an error | getUserProductReview  | Unit | WB/ Statement Coverage |
|1.4.1| It should delete all reviews of a specific product. | deleteReviewsOfProduct  | Unit | WB/ Statement Coverage |
|1.4.2| this should be deleted | deleteReviewsOfProduct  | Unit | WB/ Statement Coverage |
|1.4.3| should reject with error in db.all | deleteReviewsOfProduct  | Unit | WB/ Statement Coverage |
|1.4.4| should reject with error in db.all if there is an exception | deleteReviewsOfProduct  | Unit | WB/ Statement Coverage |
|1.4.5| should reject with error in db.run | deleteReviewsOfProduct  | Unit | WB/ Statement Coverage |
|1.4.6| should reject with error in db.run if there is an exception | deleteReviewsOfProduct  | Unit | WB/ Statement Coverage |
|1.5.1| It should delete all reviews | deleteAllReviews  | Unit | WB/ Statement Coverage |
|1.5.2| should reject with error in db.run | deleteAllReviews  | Unit | WB/ Statement Coverage |
|1.5.3| should reject with error in db.run if there is an exception | deleteAllReviews  | Unit | WB/ Statement Coverage |



### CART DAO
|Id| Test case name | Object(s) tested | Test level | Technique used |
| :-: | :------------: | :--------------: | :--------: | :------------: |
|2.1.1| It should return the unpaid cart and its ID | getUnpaidCartByCustomer - DAO | Unit | WB/ Statement Coverage |
|2.1.2| Reject with an error when db.get callback contains an error | getUnpaidCartByCustomer - DAO | Unit | WB/ Statement Coverage |
|2.1.3| Reject with an error when db.all callback contains an error | getUnpaidCartByCustomer - DAO | Unit | WB/ Statement Coverage |
|2.1.4| Reject with an error when db.get throws an error | getUnpaidCartByCustomer - DAO | Unit | WB/ Statement Coverage |
|2.1.5| Reject with an error when db.all throws an error | getUnpaidCartByCustomer - DAO | Unit | WB/ Statement Coverage |
|2.1.6| Customer doesn't have any unpaid cart | getUnpaidCartByCustomer - DAO | Unit | WB/ Statement Coverage |
|2.1.7| Unpayed cart without products | getUnpaidCartByCustomer - DAO | Unit | WB/ Statement Coverage |
|2.2.1| 1 paid cart with 1 product | getPaidCartByCustomer - DAO | Unit | WB/ Statement Coverage |
|2.2.2| 1 paid cart with 2 products | getPaidCartByCustomer - DAO | Unit | WB/ Statement Coverage |
|2.2.3| 0 paid carts | getPaidCartByCustomer - DAO | Unit | WB/ Statement Coverage |
|2.2.4| Reject with an error when db.all callback contains an error | getPaidCartByCustomer - DAO | Unit | WB/ Statement Coverage |
|2.2.5| Reject with an error when db.all throws an error | getPaidCartByCustomer - DAO | Unit | WB/ Statement Coverage |
|2.3.1| It should return an empty Promise | clearProductsFromCart - DAO | Unit | WB/ Statement Coverage |
|2.3.2| Reject with an error when db.run callback contains an error | clearProductsFromCart - DAO | Unit | WB/ Statement Coverage |
|2.3.3| Reject with an error when db.run throws an error | clearProductsFromCart - DAO | Unit | WB/ Statement Coverage |
|2.4.1| It should return an empty Promise | resetCartTotal - DAO | Unit | WB/ Statement Coverage |
|2.4.2| Reject with an error when db.run callback contains an error | resetCartTotal - DAO | Unit | WB/ Statement Coverage |
|2.4.3| Reject with an error when db.run throws an error | resetCartTotal - DAO | Unit | WB/ Statement Coverage |
|2.5.1| It should return an empty Promise | decrementProductQuantity - DAO | Unit | WB/ Statement Coverage |
|2.5.2| Reject with an error when db.run callback contains an error | decrementProductQuantity - DAO | Unit | WB/ Statement Coverage |
|2.5.3| Reject with an error when db.run throws an error | decrementProductQuantity - DAO | Unit | WB/ Statement Coverage |
|2.6.1| It should return an empty Promise | removeProductFromCart - DAO | Unit | WB/ Statement Coverage |
|2.6.2| Reject with an error when db.run callback contains an error | removeProductFromCart - DAO | Unit | WB/ Statement Coverage |
|2.6.3| Reject with an error when db.run throws an error | removeProductFromCart - DAO | Unit | WB/ Statement Coverage |
|2.7.1| It should return an empty Promise | decreaseCartTotal - DAO | Unit | WB/ Statement Coverage |
|2.7.2| Reject with an error when db.run callback contains an error | decreaseCartTotal - DAO | Unit | WB/ Statement Coverage |
|2.7.3| Reject with an error when db.run throws an error | decreaseCartTotal - DAO | Unit | WB/ Statement Coverage |
|2.8.1| It should return an empty Promise | setPayementDate - DAO | Unit | WB/ Statement Coverage |
|2.8.2| Reject with an error when db.run callback contains an error | setPayementDate - DAO | Unit | WB/ Statement Coverage |
|2.8.3| Reject with an error when db.run throws an error | setPayementDate - DAO | Unit | WB/ Statement Coverage |
|2.9.1| It should return an empty Promise | createCart - DAO | Unit | WB/ Statement Coverage |
|2.9.2| Reject with an error when db.run callback contains an error | createCart - DAO | Unit | WB/ Statement Coverage |
|2.9.3| Reject with an error when db.run throws an error | createCart - DAO | Unit | WB/ Statement Coverage |
|2.10.1| It should return an empty Promise | incrementProductQuantity - DAO | Unit | WB/ Statement Coverage |
|2.10.2| Reject with an error when db.run callback contains an error | incrementProductQuantity - DAO | Unit | WB/ Statement Coverage |
|2.10.3| Reject with an error when db.run throws an error | incrementProductQuantity - DAO | Unit | WB/ Statement Coverage |
|2.11.1| It should return an empty Promise | addProductToCart -DAO | Unit | WB/ Statement Coverage |
|2.11.2| Reject with an error when db.run callback contains an error | addProductToCart -DAO | Unit | WB/ Statement Coverage |
|2.11.3| Reject with an error when db.run throws an error | addProductToCart -DAO | Unit | WB/ Statement Coverage |
|2.12.1| It should return an empty Promise | updateCartTotal - DAO | Unit | WB/ Statement Coverage |
|2.12.2| Reject with an error when db.run callback contains an error | updateCartTotal - DAO | Unit | WB/ Statement Coverage |
|2.12.3| Reject with an error when db.run throws an error | updateCartTotal - DAO | Unit | WB/ Statement Coverage |
|2.13.1| It should return an array of all carts with their products | getAllCarts - DAO | Unit | WB/ Statement Coverage |
|2.13.2| Reject with an error when db.all callback contains an error | getAllCarts - DAO | Unit | WB/ Statement Coverage |
|2.13.3| Reject with an error when db.all throws an error | getAllCarts - DAO | Unit | WB/ Statement Coverage |
|2.13.4| Resolves to an empty list | getAllCarts - DAO | Unit | WB/ Statement Coverage |
|2.14.1| It should return true when all carts are successfully deleted | deleteAllcarts - DAO | Unit | WB/ Statement Coverage |
|2.14.2| It should throw an error when the first run function fails | deleteAllcarts - DAO | Unit | WB/ Statement Coverage |
|2.14.3| It should throw an error when the second run fails | deleteAllcarts - DAO | Unit | WB/ Statement Coverage |
|2.14.4| It should throw an error when failing to delete products in cart | deleteAllcarts - DAO | Unit | WB/ Statement Coverage |
|2.14.5| It should throw an error when failing to delete carts | deleteAllcarts - DAO | Unit | WB/ Statement Coverage |


### PRODUCT DAO
|Id| Test case name | Object(s) tested | Test level | Technique used |
| :-: | :------------: | :--------------: | :--------: | :------------: |
|3.1.1| Remove all the products from the cart | reduceProductQuantity - DAO | Unit | WB/ Statement Coverage |
|3.1.2| Reject with an error when db.run callback contains an error | reduceProductQuantity - DAO | Unit | WB/ Statement Coverage |
|3.1.3| Reject with an error when db.run throws an error | reduceProductQuantity - DAO | Unit | WB/ Statement Coverage |
|3.2.1| Check Success | registerProduct - DAO | Unit | WB/ Statement Coverage |
|3.2.2| Reject with an error when db.run callback contains an error | registerProduct - DAO | Unit | WB/ Statement Coverage |
|3.2.3| Reject with an error when db.run throws an error | registerProduct - DAO | Unit | WB/ Statement Coverage |
|3.3.1| it should return a Promise with the updated quantity | updateProductQuantity - DAO | Unit | WB/ Statement Coverage |
|3.3.2| it should handle db.get error | updateProductQuantity - DAO | Unit | WB/ Statement Coverage |
|3.3.3| it should handle db.run error | updateProductQuantity - DAO | Unit | WB/ Statement Coverage |
|3.3.4| Reject with an error when db.run callback contains an error | updateProductQuantity - DAO | Unit | WB/ Statement Coverage |
|3.3.5| Reject with an error when db.get callback contains an error | updateProductQuantity - DAO | Unit | WB/ Statement Coverage |
|3.3.6| it should handle product not found | updateProductQuantity - DAO | Unit | WB/ Statement Coverage |
|3.4.1| It should return true when all products are successfully deleted | deleteAllProducts - DAO | Unit | WB/ Statement Coverage |
|3.4.2| should reject error | deleteAllProducts - DAO | Unit | WB/ Statement Coverage |
|3.4.3| should reject with an error if there is an exception | deleteAllProducts - DAO | Unit | WB/ Statement Coverage |
|3.5.1| it should return a Promise with the updated quantity | sellProduct - DAO | Unit | WB/ Statement Coverage |
|3.5.2| it should handle db.get error | sellProduct - DAO | Unit | WB/ Statement Coverage |
|3.5.3| it should handle db.run error | sellProduct - DAO | Unit | WB/ Statement Coverage |
|3.5.4| Reject with an error when db.run callback contains an error | sellProduct - DAO | Unit | WB/ Statement Coverage |
|3.5.5| Reject with an error when db.get callback contains an error | sellProduct - DAO | Unit | WB/ Statement Coverage |
|3.5.6| it should handle product not found | sellProduct - DAO | Unit | WB/ Statement Coverage |
|3.5.7| it should handle quantity of product associated to model equal 0 | sellProduct - DAO | Unit | WB/ Statement Coverage |
|3.5.8| it should handle quantity to sell greater than current quantity | sellProduct - DAO | Unit | WB/ Statement Coverage |
|3.5.9| it should selling Date after current date | sellProduct - DAO | Unit | WB/ Statement Coverage |


### CART ROUTES
|Id| Test case name | Object(s) tested | Test level | Technique used |
| :-: | :------------: | :--------------: | :--------: | :------------: |
|5.1.1| It should return a 200 success code when retrieving cart with one product | GET /carts | Unit | WB/ Statement Coverage |
|5.1.2| It should return a 503 error code when failing to retrieve cart | GET /carts  | Unit | WB/ Statement Coverage |
|5.1.3| It should return a 401 error code when user is not logged in | GET /carts  | Unit | WB/ Statement Coverage |
|5.1.4| It should return a 401 error code when user is not a customer | GET /carts  | Unit | WB/ Statement Coverage |
|5.2.1| It should return a 200 success code when the product has been added to the cart | POST /carts  | Unit | WB/ Statement Coverage |
|5.2.2| It should return a 401 code when the user is not logged in | POST /carts  | Unit | WB/ Statement Coverage |
|5.2.3| It should return a 401 code when the user is not a customer | POST /carts | Unit | WB/ Statement Coverage |
|5.2.4| It should return a 422 code when the request parameter is empty | POST /carts | Unit | WB/ Statement Coverage |
|5.2.5| It should return a 422 code when the request parameter is not a string | POST /carts | Unit | WB/ Statement Coverage |
|5.2.6| It should return a 404 code when the product is not registered | POST /carts | Unit | WB/ Statement Coverage |
|5.2.7| It should return a 409 code when the product is not available | POST /carts | Unit | WB/ Statement Coverage |
|5.3.1| It should return 200 status code when the cart has been deleted | DELETE /carts/current | Unit | WB/ Statement Coverage |
|5.3.2| It should return 401 status code when the user is not logged in | DELETE /carts/current | Unit | WB/ Statement Coverage |
|5.3.3| It should return 401 when user is not a customer | DELETE /carts/current  | Unit | WB/ Statement Coverage |
|5.3.4| It should return 404 status when there is not an unpaid cart for the user | DELETE /carts/current  | Unit | WB/ Statement Coverage |
|5.4.1| It should return a 200 success code when there is at least 1 paid cart | GET /carts/history | Unit | WB/ Statement Coverage |
|5.4.2| It should return a 401 code when the user is not logged in | GET /carts/history  | Unit | WB/ Statement Coverage |
|5.4.3| It should return a 401 code when the user is not a customer | GET /carts/history | Unit | WB/ Statement Coverage |
|5.4.4| It should return a 503 code whene there is an error | GET /carts/history | Unit | WB/ Statement Coverage |
|5.5.1| It should return a 200 success code when the cart has been checked out | PATCH /carts | Unit | WB/ Statement Coverage |
|5.5.2| It should return a 401 code when the user is not logged in | PATCH /carts | Unit | WB/ Statement Coverage |
|5.5.3| It should return a 401 code when the user is not a customer | PATCH /carts| Unit | WB/ Statement Coverage |
|5.5.4| It should return a 404 code when there is not an unpaid cart for the customer | PATCH /carts | Unit | WB/ Statement Coverage |
|5.5.5| It should return a 404 code when the cart is empty | PATCH /carts | Unit | WB/ Statement Coverage |
|5.5.6| It should return a 409 code when at least one product is out of stock | PATCH /carts  | Unit | WB/ Statement Coverage |
|5.5.7| It should return a 409 code when there is not enough quantity of the requested item in stock | PATCH /carts | Unit | WB/ Statement Coverage |
|5.6.1| It should return a 200 success code when the cart has been checked out | DELETE /carts/products/:model | Unit | WB/ Statement Coverage |
|5.6.2| It should return a 401 code when the user is not logged in | DELETE /carts/products/:model | Unit | WB/ Statement Coverage |
|5.6.3| It should return a 401 code when the user is not a customer | DELETE /carts/products/:model | Unit | WB/ Statement Coverage |
|5.6.4| It should return a 404 code if the model parameter is empty | DELETE /carts/products/:model | Unit | WB/ Statement Coverage |
|5.6.5| It should return a 404 code when the product is not in the cart | DELETE /carts/products/:model | Unit | WB/ Statement Coverage |
|5.7.1| It should return 200 status code when all the cart has been deleted | DELETE /carts | Unit | WB/ Statement Coverage |
|5.7.2| It should return a 401 code when the user is not logged in | DELETE /carts | Unit | WB/ Statement Coverage |
|5.7.3| It should return a 401 code when the user is not a manaer or an admin | DELETE /carts | Unit | WB/ Statement Coverage |
|5.7.4| It should return 503 code whene there is an error | DELETE /carts | Unit | WB/ Statement Coverage |
|5.8.1| It should return 200 status code when returns all carts of all users, both current and past | GET /carts/all | Unit | WB/ Statement Coverage |
|5.8.2| It should return a 401 code when the user is not logged in | GET /carts/all  | Unit | WB/ Statement Coverage |
|5.8.3| It should return a 401 code when the user is not a manaer or an admin | GET /carts/all | Unit | WB/ Statement Coverage |
|5.8.4| It should return 503 code whene there is an error | GET /carts/all | Unit | WB/ Statement Coverage |


### PRODUCT ROUTES
| Test case name | Object(s) tested | Test level | Technique used |
| :------------: | :--------------: | :--------: | :------------: |
| should return 200 for a valid request | PATCH /products | Unit | WB/ Statement Coverage |
| it should return a 401 when the user is not a manager | PATCH /products  | Unit | WB/ Statement Coverage |
| it should return a 401 when the user is not a logged in | PATCH /products | Unit | WB/ Statement Coverage |
| It should return a 404 error if model does not represent a product in the database | PATCH /products | Unit | WB/ Statement Coverage |
| It should return a 400 error if changeDate is after the current date | PATCH /products  | Unit | WB/ Statement Coverage |
| It should return a 400 error if changeDate is before the product's arrivalDate | PATCH /products | Unit | WB/ Statement Coverage |
| It should return a 400 error if changeDate is not in the format YYYY-MM-DD | PATCH /products | Unit | WB/ Statement Coverage |
| It should return a 400 error if the newQuantity is not a number | PATCH /products  | Unit | WB/ Statement Coverage |
| It should return a 400 error if the newQuantity is not greater than 0 | PATCH /products | Unit | WB/ Statement Coverage |
| should return 200 for a valid request | POST /products | Unit | WB/ Statement Coverage |
| should return 400 for an invalid category (not in Smartphone, Laptop, Appliance) | POST /products | Unit | WB/ Statement Coverage |
| should return 400 for an invalid model(empty string) | POST /products | Unit | WB/ Statement Coverage |
| should return 400 for an invalid quanity | POST /products | Unit | WB/ Statement Coverage |
| should return 400 for an invalid sellingPrice | POST /products | Unit | WB/ Statement Coverage |
| should return 400 for an invalid date format (YYYY-MM-DD) | POST /products| Unit | WB/ Statement Coverage |
| should return 400 for arrival date after current date | POST /products | Unit | WB/ Statement Coverage |
| it should return 409 code when already exist a product with that model in the database | POST /products | Unit | WB/ Statement Coverage |
| it should return 401 code when the user is not a Manager | POST /products | Unit | WB/ Statement Coverage |
| it should return 401 code when the user is not logged in | POST /products | Unit | WB/ Statement Coverage |
| should return 200 for a valid request | PATCH /:model/sell  | Unit | WB/ Statement Coverage |
| it should return a 401 when the user is not a manager | PATCH /:model/sell | Unit | WB/ Statement Coverage |
| it should return a 401 when the user is not a logged in | PATCH /:model/sell | Unit | WB/ Statement Coverage |
| It should return a 404 error if model does not represent a product in the database | PATCH /:model/sell | Unit | WB/ Statement Coverage |
| It should return a 400 error if sellingDate is after the current date | PATCH /:model/sell  | Unit | WB/ Statement Coverage |
| It should return a 400 error if sellingDate is before the product's arrivalDate | PATCH /:model/sell  | Unit | WB/ Statement Coverage |
| It should return a 400 error if changeDate is not in the format YYYY-MM-DD | PATCH /:model/sell  | Unit | WB/ Statement Coverage |
| It should return a 400 error if the newQuantity is not a number | PATCH /:model/sell | Unit | WB/ Statement Coverage |
| It should return a 400 error if the newQuantity is not greater than 0 | PATCH /:model/sell | Unit | WB/ Statement Coverage |
| It should return a 409 error if model represents a product whose available quantity is 0 | PATCH /:model/sell | Unit | WB/ Statement Coverage |
| It should return a 409 error if the available quantity of model is lower than the requested quantity | PATCH /:model/sell | Unit | WB/ Statement Coverage |
| should return 200 for a valid request | DELETE /products | Unit | WB/ Statement Coverage |
| It should return a 401 code when the user is not logged in | DELETE /products | Unit | WB/ Statement Coverage |
| It should return a 401 code when the user is not a manager or an admin | DELETE /products | Unit | WB/ Statement Coverage |
| It should return 503 code whene there is an error | DELETE /products | Unit | WB/ Statement Coverage |

### REVIEW ROUTES
| Test case name | Object(s) tested | Test level | Technique used |
| :------------: | :--------------: | :--------: | :------------: |
| It should return a 200 success code when the review is successfully added | POST /reviews/:model | Unit | WB/ Statement Coverage |
| It should return a 409 error code when there is already a review for the product from that user | POST /reviews/:model | Unit | WB/ Statement Coverage |
| It should return a 404 error code when product is not registered | POST /reviews/:model | Unit | WB/ Statement Coverage |
| It should return a 422 error code when the score is invalid | POST /reviews/:model | Unit | WB/ Statement Coverage |
| It should return a 422 error code when the comment has not been inserted | POST /reviews/:model | Unit | WB/ Statement Coverage |
| It should return a 401 error code when the user is not a customer | POST /reviews/:model | Unit | WB/ Statement Coverage |
| It should return a 401 error code when the user is not logged in | POST /reviews/:model | Unit | WB/ Statement Coverage |
| It should return a 200 success code when the review is removed by the current user for a specific product | DELETE /reviews/:model | Unit | WB/ Statement Coverage |
| It should return a 401 error code when the user is not a custome | DELETE /reviews/:model | Unit | WB/ Statement Coverage |
| It should return a 401 error code when the user is not logged in | DELETE /reviews/:model | Unit | WB/ Statement Coverage |
| It should return a 404 error code when the product is not registered | DELETE /reviews/:model | Unit | WB/ Statement Coverage |
| It should return a 200 success code when deletes all reviews of a specific product | DELETE /reviews/:model/all | Unit | WB/ Statement Coverage |
| It should return a 401 error code when the user is not an Admin or Manager | DELETE /reviews/:model/all | Unit | WB/ Statement Coverage |
| It should return a 401 error code when the user is not logged in | DELETE /reviews/:model/all | Unit | WB/ Statement Coverage |
| It should return a 404 error if model does not represent an existing product in the database | DELETE /reviews/:model/all | Unit | WB/ Statement Coverage |
| It should return a 200 success code when deletes all reviews of all existing products | DELETE /reviews | Unit | WB/ Statement Coverage |
| It should return a 401 error code when the user is not an Admin or Manager | DELETE /reviews | Unit | WB/ Statement Coverage |
| It should return a 401 error code when the user is not logged in | DELETE /reviews | Unit | WB/ Statement Coverage |



# Coverage

## Coverage of FR

<Report in the following table the coverage of functional requirements and scenarios(from official requirements) >

| Functional Requirement or scenario | Test(s) |
| :--------------------------------: | :-----: |
|                FRx                 |         |
|                FRy                 |         |
|                ...                 |         |

## Coverage white box

Report here the screenshot of coverage values obtained with jest-- coverage
