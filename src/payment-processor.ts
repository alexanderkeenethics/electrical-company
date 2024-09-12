import customers from './customer-list.json';
const traceId = traceparent.make().toString();

import { Customer, sendMessage, statusReject } from "./message-service";
import { traceparent } from "tctx";


(async function() {
	for (let i = 0; i < customers.length; i++) {
		let customer = customers[i] as Customer;
		
		try {
			await processPayment(customer).then(() => {
				console.log('Successfully processed payment for customer', customer.id);
			});
		} catch (e) {
			console.error('The payment failed to process:', e);

			if (e.message === 'Payment Failed') {
				console.error('The payment failed to process:', e);
				
				const paymentMethod = customer.paymentMethods[customer.paymentMethods.defaultPaymentMethod];
				let last4Digits = '';
				
				if (customer.paymentMethods.defaultPaymentMethod === 'card') {
					last4Digits = paymentMethod.card.last4;
				} else if (customer.paymentMethods.defaultPaymentMethod === 'usBankAccount') {
					last4Digits = paymentMethod.usBankAccount.accountNumberLast4Digits;
				} else if (customer.paymentMethods.defaultPaymentMethod == 'eu_pay_by_bank') {
					last4Digits = paymentMethod.eu_pay_by_bank.iban_last_4;
				}
				
				sendMessage(customer, last4Digits);
			}
		}
	}
})();


function processPayment(customer: Customer) {
	return fetch('https://api.stripe.com/some-payment-endpoint', {
		method: 'POST',
		headers: {
			"Content-Type": "application/json",
			Traceparent: traceId,
			Authorization: 'Bearer ' + process.env.STRIPE_API_KEY
		},
		body: JSON.stringify({
			customerId: customer.id,
			paymentMethod: customer.paymentMethods[customer.paymentMethods.defaultPaymentMethod],
			amount: getCustomerPaymentAmount(customer.id)
		})
	}).then((res) => {
		if (res.ok) {
			return res.json().then((data) => {
				return data;
			});
		} else if (res.status == 403) {
			return Promise.reject(statusReject(res));
		} else {
			return res.json().then((data) => {
				return Promise.reject(data);
			});
		}
	}).catch((err) => {
		console.error('Error calling Stripe payment API:', err);
		return Promise.reject(err);
	});
}

function getCustomerPaymentAmount(customerId: number) {
	const amount = Math.floor(Math.random() * (100 - 50 + 1) + 50) + Math.random();
	return amount.toFixed(2);
}