<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		ArrowLeft,
		Shield,
		Users,
		Headphones,
		CreditCard,
		Zap,
		CheckCircle,
		Clock,
		Heart,
		Star,
		TrendingUp,
		Globe
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Service Fee Information - Azumi</title>
	<meta
		name="description"
		content="Learn about Azumi's service fee structure and how it helps us provide better platform services."
	/>
</svelte:head>

<main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
	<nav class="mb-8">
		<Button
			variant="ghost"
			onclick={() => history.back()}
			class="text-muted-foreground hover:text-foreground gap-2"
		>
			<ArrowLeft class="h-4 w-4" />
			Back
		</Button>
	</nav>

	<article class="prose prose-lg mx-auto max-w-none">
		<header class="mb-8 text-center">
			<div
				class="text-primary mb-3 flex items-center justify-center gap-2 text-xs font-medium sm:text-sm"
			>
				<Clock class="h-3 w-3 sm:h-4 sm:w-4" />
				3 min read
			</div>
			<h1 class="text-foreground mb-4 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
				Service Fee Information
			</h1>
			<p class="text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed sm:text-lg">
				Understanding how our service fee works and what it covers
			</p>
		</header>
		<section class="mb-8">
			<h2 class="text-foreground mb-6 text-xl font-bold sm:text-2xl">How Our Service Fee Works</h2>

			<div class="bg-card mb-6 rounded-lg border p-4 shadow-sm sm:p-6">
				<div class="mb-3 flex items-center gap-3">
					<CreditCard class="text-primary h-5 w-5 sm:h-6 sm:w-6" />
					<h3 class="text-card-foreground text-lg font-semibold sm:text-xl">
						Simple. Fair. Transparent.
					</h3>
				</div>
				<p class="text-card-foreground mb-4 text-sm sm:text-base">
					Our service fee is <strong class="text-primary"
						>10% of your order subtotal, capped at ₦1,000</strong
					>. That's it. No hidden charges, no surprise fees.
				</p>

				<div class="bg-primary/10 border-primary/20 rounded-lg border p-3 sm:p-4">
					<h4 class="text-foreground mb-2 text-sm font-semibold sm:mb-3 sm:text-base">Examples:</h4>
					<div class="grid gap-1 text-xs sm:gap-2 sm:text-sm">
						<div class="flex items-center justify-between py-1">
							<span class="text-muted-foreground">₦2,000 order</span>
							<span class="text-foreground font-medium">Fee: ₦200</span>
						</div>
						<div class="flex items-center justify-between py-1">
							<span class="text-muted-foreground">₦5,000 order</span>
							<span class="text-foreground font-medium">Fee: ₦500</span>
						</div>
						<div class="flex items-center justify-between py-1">
							<span class="text-muted-foreground">₦15,000 order</span>
							<span class="text-foreground font-medium">Fee: ₦1,000 (capped!)</span>
						</div>
						<div class="flex items-center justify-between py-1">
							<span class="text-muted-foreground">₦50,000 order</span>
							<span class="text-foreground font-medium">Fee: ₦1,000 (capped!)</span>
						</div>
					</div>
				</div>
			</div>

			<div class="bg-accent rounded-lg border p-4 sm:p-6">
				<div class="flex items-start gap-3 sm:gap-4">
					<TrendingUp class="text-primary h-6 w-6 sm:h-8 sm:w-8" />
					<div>
						<h3 class="text-accent-foreground mb-2 text-base font-semibold sm:text-lg">
							Larger orders save more
						</h3>
						<p class="text-accent-foreground/80 text-sm sm:text-base">
							You'll never pay more than ₦1,000 in service fees, no matter how large your order.
						</p>
					</div>
				</div>
			</div>
		</section>
		<section class="mb-8">
			<h2 class="text-foreground mb-6 text-xl font-bold sm:text-2xl">
				What Your Service Fee Covers
			</h2>
			<p class="text-muted-foreground mb-6 text-sm sm:text-base">
				We believe you deserve to know exactly how your money helps build a better experience for
				everyone.
			</p>

			<div class="grid gap-4 sm:gap-6 md:grid-cols-2">
				<div class="bg-card group rounded-lg border p-4 transition-all hover:shadow-lg sm:p-6">
					<div class="mb-3 flex items-center gap-3 sm:mb-4">
						<div class="bg-primary/10 rounded-full p-2">
							<Headphones class="text-primary h-4 w-4 sm:h-5 sm:w-5" />
						</div>
						<h3 class="text-card-foreground text-base font-semibold sm:text-lg">24/7 Support</h3>
					</div>
					<p class="text-muted-foreground text-sm sm:text-base">
						Round-the-clock customer assistance for any issues with your orders or deliveries.
					</p>
				</div>

				<div class="bg-card group rounded-lg border p-4 transition-all hover:shadow-lg sm:p-6">
					<div class="mb-3 flex items-center gap-3 sm:mb-4">
						<div class="bg-primary/10 rounded-full p-2">
							<Shield class="text-primary h-4 w-4 sm:h-5 sm:w-5" />
						</div>
						<h3 class="text-card-foreground text-base font-semibold sm:text-lg">
							Security & Safety
						</h3>
					</div>
					<p class="text-muted-foreground text-sm sm:text-base">
						Advanced security measures to protect your personal data and payment information.
					</p>
				</div>

				<div class="bg-card group rounded-lg border p-4 transition-all hover:shadow-lg sm:p-6">
					<div class="mb-3 flex items-center gap-3 sm:mb-4">
						<div class="bg-primary/10 rounded-full p-2">
							<Users class="text-primary h-4 w-4 sm:h-5 sm:w-5" />
						</div>
						<h3 class="text-card-foreground text-base font-semibold sm:text-lg">
							Quality Assurance
						</h3>
					</div>
					<p class="text-muted-foreground text-sm sm:text-base">
						Monitoring vendor quality and ensuring food safety standards across the platform.
					</p>
				</div>

				<div class="bg-card group rounded-lg border p-4 transition-all hover:shadow-lg sm:p-6">
					<div class="mb-3 flex items-center gap-3 sm:mb-4">
						<div class="bg-primary/10 rounded-full p-2">
							<Zap class="text-primary h-4 w-4 sm:h-5 sm:w-5" />
						</div>
						<h3 class="text-card-foreground text-base font-semibold sm:text-lg">
							Platform Innovation
						</h3>
					</div>
					<p class="text-muted-foreground text-sm sm:text-base">
						Continuous development of new features and platform improvements.
					</p>
				</div>
			</div>
		</section>
		<section class="mb-8">
			<h2 class="text-foreground mb-6 text-xl font-bold sm:text-2xl">Frequently Asked Questions</h2>

			<div class="space-y-4 sm:space-y-6">
				<div class="bg-card rounded-lg border p-4 sm:p-6">
					<h3 class="text-card-foreground mb-2 text-base font-semibold sm:mb-3 sm:text-lg">
						"Why can't you just include it in the delivery fee?"
					</h3>
					<p class="text-muted-foreground text-sm sm:text-base">
						Great question! Delivery fees go to our riders (they work hard and deserve fair pay),
						while service fees keep the platform running. We keep them separate so you know exactly
						where your money goes.
					</p>
				</div>

				<div class="bg-card rounded-lg border p-4 sm:p-6">
					<h3 class="text-card-foreground mb-2 text-base font-semibold sm:mb-3 sm:text-lg">
						"What if I'm not happy with my order?"
					</h3>
					<p class="text-muted-foreground text-sm sm:text-base">
						If we mess up (and you need a full refund), we refund everything—including the service
						fee. No questions asked, no fine print. Your satisfaction is literally what we're paid
						to ensure.
					</p>
				</div>

				<div class="bg-card rounded-lg border p-4 sm:p-6">
					<h3 class="text-card-foreground mb-2 text-base font-semibold sm:mb-3 sm:text-lg">
						"How do I know you're being fair?"
					</h3>
					<p class="text-muted-foreground text-sm sm:text-base">
						This page exists for exactly that reason! We believe in radical transparency because
						trust is earned, not demanded. Plus, our ₦1,000 cap means larger orders actually get
						better value.
					</p>
				</div>

				<div class="bg-card rounded-lg border p-4 sm:p-6">
					<h3 class="text-card-foreground mb-2 text-base font-semibold sm:mb-3 sm:text-lg">
						"Can I avoid the service fee somehow?"
					</h3>
					<p class="text-muted-foreground text-sm sm:text-base">
						Not without losing the service! Think of it like a gym membership—you pay for access to
						everything that makes the experience possible. But we've worked hard to make it as fair
						and affordable as possible.
					</p>
				</div>
			</div>
		</section>
		<section class="mb-12">
			<div class="bg-accent rounded-lg border p-8">
				<div class="mx-auto max-w-2xl text-center">
					<Star class="text-primary mx-auto mb-4 h-10 w-10" />
					<h2 class="text-accent-foreground mb-4 text-2xl font-bold">Thank You for Reading</h2>
					<p class="text-accent-foreground/80 mb-6 text-lg">
						Transparency isn't just a buzzword for us—it's how we build trust, one order at a time.
						Your service fee helps us create something we're all proud to be part of.
					</p>
					<div class="flex flex-col justify-center gap-3 sm:flex-row">
						<Button variant="default" onclick={() => history.back()}>Continue Shopping</Button>
						<Button
							variant="outline"
							onclick={() => (window.location.href = 'mailto:support@azumi.ng')}
						>
							<Headphones class="mr-2 h-4 w-4" />
							Questions? Let's Chat
						</Button>
					</div>
				</div>
			</div>
		</section>
	</article>
</main>
