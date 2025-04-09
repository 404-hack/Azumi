<script lang="ts">
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	// Using Svelte 5 reactivity with $state
	let searchQuery = $state('');
	let faqs = $state([
		{
			question: 'What is Azumi?',
			answer:
				'Azumi is a digital platform that connects African markets to the online world, enabling vendors to sell their products and services to a wider audience while providing customers with convenient access to authentic African products.'
		},
		{
			question: 'How do I create a customer account?',
			answer:
				"You can create a customer account by clicking on the 'Sign Up' button on the homepage, filling in your details, and following the verification process. Once verified, you'll have access to browse, purchase, and track orders from vendors across various African markets."
		},
		{
			question: 'How do I become a vendor on Azumi?',
			answer:
				"To become a vendor, visit the 'Vendor Registration' page, complete the application form, and submit required documentation for verification. Our team will review your application and notify you once approved. You'll then be able to set up your shop and start selling your products."
		},
		{
			question: 'What payment methods are accepted on Azumi?',
			answer:
				'Azumi accepts various payment methods including credit/debit cards, mobile money, bank transfers, and digital wallets like PayPal. The available payment options may vary depending on your location.'
		},
		{
			question: 'How does delivery work?',
			answer:
				"Azumi partners with reliable logistics providers to ensure timely delivery of your orders. Delivery timeframes and costs depend on your location and the vendor's location. You can track your order in real-time through our app once it's dispatched."
		},
		{
			question: "What if I'm not satisfied with my order?",
			answer:
				"Azumi has a customer satisfaction policy. If you're not satisfied with your order, you can initiate a return or refund request within 7 days of receiving your order. Each case is reviewed according to our return policy and the specific vendor's terms."
		},
		{
			question: 'How does Azumi ensure product quality?',
			answer:
				'We have a vendor verification process and quality control measures in place. Additionally, our review system allows customers to rate products and vendors, helping maintain high standards across the platform.'
		},
		{
			question: 'Is Azumi available in all African countries?',
			answer:
				"We're continuously expanding our reach. Currently, Azumi operates in select African countries with plans to cover the entire continent. Check our 'Coverage' section for the most updated list of countries where our services are available."
		}
	]);

	// Computed value using Svelte 5's proper derived syntax
	const filteredFaqs = $derived(
		searchQuery
			? faqs.filter(
					(faq) =>
						faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
						faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: faqs
	);

	// Function to handle search query changes
	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;
	}
</script>

<div class="min-h-screen bg-black text-white">
	<div class="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
		<div class="mb-20 text-center">
			<h1
				class="bg-gradient-to-r from-white to-gray-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl md:text-7xl"
			>
				Frequently Asked Questions
			</h1>
			<p class="mx-auto mt-6 max-w-2xl text-xl text-gray-400">
				Find answers to common questions about using Azumi
			</p>
		</div>

		<div class="mx-auto mb-12 max-w-3xl">
			<div class="relative">
				<Input
					type="text"
					placeholder="Search for a question..."
					value={searchQuery}
					on:input={handleSearchInput}
					class="border-gray-800 bg-gray-900 py-6 pl-10 text-white ring-offset-black placeholder:text-gray-500 focus-visible:ring-gray-700"
				/>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>
		</div>

		<div class="mx-auto max-w-3xl">
			{#if filteredFaqs.length === 0}
				<div class="rounded-lg border border-gray-800 bg-gray-900 py-16 text-center">
					<p class="mb-6 text-lg text-gray-400">No results found for "{searchQuery}"</p>
					<Button
						variant="outline"
						on:click={() => (searchQuery = '')}
						class="border-gray-700 text-white hover:bg-gray-800"
					>
						Clear search
					</Button>
				</div>
			{:else}
				<Accordion
					type="single"
					collapsible
					class="w-full rounded-lg border border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800"
				>
					{#each filteredFaqs as faq, index}
						<AccordionItem
							value={`item-${index}`}
							class="border-b border-gray-800 px-6 last:border-0"
						>
							<AccordionTrigger
								class="py-6 text-left text-lg font-medium text-white hover:text-gray-300"
							>
								{faq.question}
							</AccordionTrigger>
							<AccordionContent class="pb-6">
								<p class="leading-relaxed text-gray-400">{faq.answer}</p>
							</AccordionContent>
						</AccordionItem>
					{/each}
				</Accordion>
			{/if}
		</div>

		<div class="mx-auto mt-20 max-w-3xl text-center">
			<div
				class="rounded-lg border border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800 p-12"
			>
				<h2
					class="mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-2xl font-bold text-transparent text-white"
				>
					Still have questions?
				</h2>
				<p class="mx-auto mb-8 max-w-xl text-lg text-gray-400">
					Can't find the answer you're looking for? Please contact our customer support team.
				</p>
				<Button variant="default" class="bg-white text-black hover:bg-gray-200"
					>Contact Support</Button
				>
			</div>
		</div>
	</div>
</div>
