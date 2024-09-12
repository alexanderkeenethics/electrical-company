import { traceparent } from "tctx";

type Card = {
	brand: string;
	last4: number;
}

interface UsBankAccount {
	bankName: string;
	accountType: string;
	accountNumberLast4Digits: string;
}

interface EuBank {
	organization_name: string;
	country_code: string;
	iban_last_4: string;
}

type PaymentMethods = {
	card: Card;
	usBankAccount: UsBankAccount;
	eu_pay_by_bank: EuBank;
	defaultPaymentMethod: string;
}

export type Customer = {
	id: number;
	name: string;
	email?: string;
	mobile?: string;
	mobileCarrier?: string;
	paymentMethods: PaymentMethods;
}

type Email = {
	from: string;
	to: string[];
	messageBody: string;
}



const traceId = traceparent.make().toString();

export function sendMessage(contact: Customer, accountNumberLast4: string) {
	let message = '';
	
	if (contact.paymentMethods.card !== undefined && contact.paymentMethods.card.last4.toString() === accountNumberLast4) {
		message = `Hello, ${contact.name},
		The scheduled payment for your electrical bill ending from your ${contact.paymentMethods.card.brand} credit card ending in ${contact.paymentMethods.card.last4} failed.		
		Please verify your payment details and try again.`;
	} else if (contact.paymentMethods.eu_pay_by_bank !== undefined && contact.paymentMethods.eu_pay_by_bank.iban_last_4 == accountNumberLast4) {
		let euBank = contact.paymentMethods.eu_pay_by_bank;
		message = `Hello, ${contact.name},
		The scheduled payment for your electrical bill ending from your ${euBank.organization_name} bank in ${euBank.iban_last_4} failed.		
		Please verify your payment details and try again.`;
	} else {
		let bankAccount = contact.paymentMethods.usBankAccount;
		message = `Hello, ${contact.name},
		The scheduled payment for your electrical bill ending from your ${bankAccount.bankName} account ending in ${bankAccount.accountNumberLast4Digits} failed.		
		Please verify your payment details and try again.`;
	}
	
	const emailPayload: Email = {
		from: 'paymentprocessing@aep.com',
		to: [],
		messageBody: message
	}
	
	if (contact.email !== null && contact.email !== undefined) {
		emailPayload.to = [contact.email];
	} else if (contact.mobile !== null && contact.mobile !== undefined) {
		
		// An SMS message may be sent to any phone number from an email via the carrier's gateway email address
		if (contact.mobileCarrier === 'at&t') {
			emailPayload.to.push(contact.email + '@text.att.net');
		} else if (contact.mobileCarrier === 'tmobile') {
			emailPayload.to.push(contact.mobile + '@tmomail.net');
		} else {
			// We don't know what carrier is used, so we need send the message to all carriers.
			// For purposes of this exercise, assume these are the only three carriers (AT&T, T-Mobile, & Verizon)
			emailPayload.to.push(contact.mobile + 'text.att.net');
			emailPayload.to.push(contact.mobile + '@tmomail.net');
			emailPayload.to.push(contact.mobile + '@vtext.com');
		}
	}
	
	
	fetch('https://some-email-api', {
		method: "POST",
		headers: {
			Accept: "application/json, */*",
			"Content-Type": "application/json",
			Traceparent: traceId,
			Authorization: "Bearer " + process.env.API_KEY
		},
		body: JSON.stringify(emailPayload)
	}).then((res) => {
		if (res.ok) {
			return res.json().then((data) => {
				return data;
			});
		} else if (res.status == 401) {
			return Promise.reject(statusReject(res));
		} else {
			return res.json().then((data) => {
				return Promise.reject(data);
			});
		}
	}).catch((err) => {
		console.warn('Error sending message to user');
		return Promise.reject(err);
	});
}

type ErrorResponse = {
	statusCode: number;
	statusMessage: string;
	unrecoverable: boolean;
}

export function statusReject(res: Response): ErrorResponse {
	var unrecoverable = res.status === 401;
	var statusText = null;
	
	switch (res.status) {
		case 401:
			statusText = 'Authentication Error';
			break;
		case 403:
			statusText = 'Authorization Error';
			break;
		case 404:
			statusText = 'Not Found';
			break;
		case 409:
			statusText = 'Conflict';
			break;
		default:
			statusText = 'Request Error';
			break;
	}
	
	var statusMessage = res.statusText;
	
	if (res.status == 400) {
		return {
			statusCode: res.status,
			statusMessage: statusMessage,
			unrecoverable: unrecoverable
		};
	} else {
		return {
			statusCode: res.status,
			statusMessage: statusText,
			unrecoverable: unrecoverable
		}
	}
}