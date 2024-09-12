

## Project Requirements
* Node v20+
* Run `npm install` to install the packages

## Project Details
This project is a simple representation of how an electrical company might process payments for its customers.

The main file ([src/payment-processor.ts](src/payment-processor.ts)) attempts to make payments for the list of customers defined in [src/customer-list.json](src/customer-list.json) to a representative _payment service provider_. If any of the payments fail, the payment-processor notifies the customer of the failure and requests that they verify their payment details. A customer may have an email and/or phone as their point of contact. An SMS message may be (sent to a phone via an email)[https://www.textmagic.com/blog/email-to-text-service/] by appending the gateway domain for the mobile carrier to the phone number. (See [src/message-service.ts](src/message-service.ts) line 75).


**Notice**: Everything in this project is mocked, or representational. None of the code is expected to be run at all.

## Instructions
The entire codebase contains messy, poorly written code and needs to be refactored.

Please refactor the entire project using your knowledge of programming best practices, clean code, readability, extensibility and maintainability. 

You may... 
* Refactor and restructure functions, files, and variables
* Rename functions, variables and properties for better readability and communication
* Install and use any new NPM packages you like
* Re-structure the JSON model for the customer-list
* Or otherwise make any other changes as you see necessary,

... as long as the core business use case remains unchanged. Again, please notice that there is no expectation of running any of this code. The assignment is simply about refactoring it.


## Estimated Time to Complete
This exercise should take around 30-45 minutes to complete.