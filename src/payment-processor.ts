import customers from './customer-list.json';
import {type Customer, sendMessage, statusReject} from "./message-service";
import {traceparent} from "tctx";

const traceId = traceparent.make().toString();

const API_URL = "https://api.stripe.com/some-payment-endpoint";
const AUTHORIZATION_KEY = `Bearer ${process.env.STRIPE_API_KEY}`;


type CustomersRecord = Customer & typeof customers[number];
type PaymentMethod = CustomersRecord['paymentMethods'];

const processCustomerPayments = async () => {
	await Promise.all(customers.map(async (customer:CustomersRecord) => {
		try {
			await processPayment(customer)
					.then(() => console.log('Successfully processed payment for customer', customer.id));
		} catch (err) {
			console.error('The payment failed to process:', err);

			if (err.message === 'Payment Failed') {
				console.error('The payment failed to process:', err);

				const paymentMethod: PaymentMethod = customer.paymentMethods[customer.paymentMethods.defaultPaymentMethod];
				let last4Digits = obtainLast4Digits(customer, paymentMethod);

				sendMessage(customer, last4Digits);
			}
		}
	}))
}

function obtainLast4Digits(customer: Customer, paymentMethod: PaymentMethod) {
	let last4Digits = '';

	switch (customer.paymentMethods.defaultPaymentMethod) {
		case 'card':
			last4Digits = paymentMethod.card.last4.toString();
			break;
		case 'usBankAccount':
			last4Digits = paymentMethod.usBankAccount.accountNumberLast4Digits;
			break;
		case 'eu_pay_by_bank':
			last4Digits = paymentMethod.eu_pay_by_bank.iban_last_4;
	}

	return last4Digits;
}

async function processPayment(customer: Customer): Promise<any> {
	const body = {
		customerId: customer.id,
		paymentMethod: customer.paymentMethods[customer.paymentMethods.defaultPaymentMethod],
		amount: getCustomerPaymentAmount(customer.id)
	}

	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				"Content-Type": "application/json",
				Traceparent: traceId,
				Authorization: AUTHORIZATION_KEY
			},
			body: JSON.stringify(body)
		});

		const data = await response.json();

		if (!response.ok) {
			throw statusReject(response);
		}

		return data;
	} catch (err) {
		console.error('Error calling Stripe payment API:', err);
		throw err;
	}
}

function getCustomerPaymentAmount(customerId: number) {
	const amount = Math.floor(Math.random() * (100 - 50 + 1) + 50) + Math.random();
	return amount.toFixed(2);
}


(async function () {
	await processCustomerPayments();
})();
