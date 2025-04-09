import { client } from '$lib/hc';

export const load = async () => {
	// Fetch list of banks from Paystack through our backend API
	const banksRes = await client.vendor.banks.$get();
	const banks = await banksRes.json();

	// Fetch existing payment methods
	const paymentMethodsRes = await client.vendor['payment-methods'].$get();
	const paymentMethods = await paymentMethodsRes.json();

	return {
		banks: banks.data,
		paymentMethods: paymentMethods.data || []
	};
};
