import { client } from '$lib/hc';

export const load = async () => {
	// Fetch list of banks from Paystack through our backend API
	const banksRes = await client.rider.banks.$get();
	const banks = await banksRes.json();
	// Fetch existing payment method
	const paymentMethodRes = await client.rider['payment-method'].$get();
	const paymentMethod = await paymentMethodRes.json();

	return {
		banks: banks.data,
		paymentMethod: paymentMethod.data
	};
};
