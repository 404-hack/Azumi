<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
</script>

<div class="relative min-h-screen overflow-hidden bg-background">
	<!-- Background decoration -->
	<div
		class="absolute inset-x-0 top-0 -z-10 h-[30vh] bg-gradient-to-b from-primary/5 to-transparent"
		aria-hidden="true"
	></div>
	<div
		class="absolute inset-x-0 bottom-0 -z-10 h-[20vh] bg-gradient-to-t from-primary/5 to-transparent"
		aria-hidden="true"
	></div>
	<div
		class="absolute -left-40 -top-40 -z-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
		aria-hidden="true"
	></div>
	<div
		class="absolute -bottom-40 -right-40 -z-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
		aria-hidden="true"
	></div>

	<div class="container relative mx-auto max-w-screen-xl px-4 pb-24 pt-16">
		<!-- Hero Section -->
		<div class="mx-auto mb-16 max-w-3xl text-center md:mb-24">
			<Badge variant="outline" class="mb-4">About Azumi</Badge>
			<h1 class="mb-6 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl xl:text-6xl">
				<span class="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
					>Discover Azumi</span
				>
			</h1>
			<p class="mx-auto max-w-2xl text-xl leading-relaxed text-muted-foreground">
				Connecting African markets to the digital world through innovative technology and creating
				opportunities for vendors and customers alike.
			</p>
		</div>

		<!-- Main content with container queries -->
		<div class="@container">
			<!-- Mission & Vision Section -->
			<div class="@md:grid-cols-2 mx-auto mb-16 grid max-w-5xl grid-cols-1 gap-8">
				<div class="group rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
					<div class="mb-4 flex items-center gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-primary"
								><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg
							>
						</div>
						<h2 class="scroll-m-20 text-2xl font-semibold tracking-tight">Our Mission</h2>
					</div>
					<Separator class="mb-4" />
					<p class="mb-6 leading-7 text-muted-foreground">
						At Azumi, we're committed to transforming how people access African markets through
						technology. Our platform bridges the gap between traditional markets and digital
						convenience, empowering vendors and providing customers with seamless shopping
						experiences.
					</p>
					<div class="flex items-center gap-2">
						<div class="h-1 w-12 rounded-full bg-primary"></div>
						<div class="h-1 w-6 rounded-full bg-primary/60"></div>
						<div class="h-1 w-3 rounded-full bg-primary/30"></div>
					</div>
				</div>

				<div class="group rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
					<div class="mb-4 flex items-center gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-primary"
								><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path
									d="m4.93 4.93 1.41 1.41"
								/><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path
									d="m6.34 17.66-1.41 1.41"
								/><path d="m19.07 4.93-1.41 1.41" /></svg
							>
						</div>
						<h2 class="scroll-m-20 text-2xl font-semibold tracking-tight">Our Vision</h2>
					</div>
					<Separator class="mb-4" />
					<p class="mb-6 leading-7 text-muted-foreground">
						We envision a future where every African market is digitally accessible, where local
						businesses thrive in the global economy, and where customers can discover the rich
						diversity of African products with ease and confidence.
					</p>
					<div class="flex items-center gap-2">
						<div class="h-1 w-12 rounded-full bg-primary"></div>
						<div class="h-1 w-6 rounded-full bg-primary/60"></div>
						<div class="h-1 w-3 rounded-full bg-primary/30"></div>
					</div>
				</div>
			</div>

			<!-- About Us Content Section -->
			<div class="prose dark:prose-invert mx-auto mb-16 max-w-3xl">
				<h2 class="text-3xl font-semibold tracking-tight">Who We Are</h2>
				<p class="text-muted-foreground">
					Founded in 2023, Azumi has quickly grown from a small startup to a trusted marketplace
					platform serving thousands of vendors and customers across Africa. Our journey began with
					a simple idea: to connect local markets with the digital economy and create value for
					everyone involved.
				</p>
				<p class="text-muted-foreground">
					Today, Azumi is more than just a marketplace—it's a community where vendors can grow their
					businesses, customers can discover authentic African products, and technology brings
					people together in exciting new ways.
				</p>
				<div class="my-8 rounded-lg border border-border bg-card p-6">
					<blockquote class="border-l-4 border-primary pl-6 italic">
						"We believe that technology should serve people, not the other way around. Every feature
						we build is designed to make life easier for our users, whether they're selling
						handcrafted goods or ordering fresh produce."
						<footer class="mt-2 text-sm font-medium">— Azumi Founding Team</footer>
					</blockquote>
				</div>
			</div>

			<!-- Services Section -->
			<div class="mb-20">
				<div class="mb-12 text-center">
					<h2 class="mb-4 scroll-m-20 text-3xl font-semibold tracking-tight">What We Offer</h2>
					<p class="mx-auto max-w-xl text-muted-foreground">
						Our comprehensive suite of services designed to revolutionize the African market
						experience
					</p>
				</div>

				<div class="@sm:grid-cols-2 @lg:grid-cols-3 mx-auto grid max-w-6xl grid-cols-1 gap-6">
					<Card
						className="border bg-card text-card-foreground shadow-sm hover:shadow transition-all duration-300 overflow-hidden group"
					>
						<div
							class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"
						></div>
						<CardHeader className="pb-2 relative">
							<div
								class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="text-primary"
									><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path
										d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"
									/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /></svg
								>
							</div>
							<CardTitle className="text-xl">Marketplace</CardTitle>
						</CardHeader>
						<CardContent className="relative">
							<p class="text-muted-foreground">
								Our digital marketplace connects customers with authentic African products from
								verified vendors, ensuring quality and authenticity with every purchase.
							</p>
						</CardContent>
					</Card>

					<Card
						className="border bg-card text-card-foreground shadow-sm hover:shadow transition-all duration-300 overflow-hidden group"
					>
						<div
							class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"
						></div>
						<CardHeader className="pb-2 relative">
							<div
								class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="text-primary"
									><circle cx="12" cy="12" r="10" /><path d="m7 15 3-3 2 2 4-4" /><path
										d="m14 14 1-1 4 4"
									/></svg
								>
							</div>
							<CardTitle className="text-xl">Delivery Services</CardTitle>
						</CardHeader>
						<CardContent className="relative">
							<p class="text-muted-foreground">
								Fast and reliable delivery services ensure your products reach you safely and on
								time, with real-time tracking available throughout the delivery process.
							</p>
						</CardContent>
					</Card>

					<Card
						className="border bg-card text-card-foreground shadow-sm hover:shadow transition-all duration-300 overflow-hidden group"
					>
						<div
							class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"
						></div>
						<CardHeader className="pb-2 relative">
							<div
								class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="text-primary"
									><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle
										cx="9"
										cy="7"
										r="4"
									/><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path
										d="M16 3.13a4 4 0 0 1 0 7.75"
									/></svg
								>
							</div>
							<CardTitle className="text-xl">Vendor Support</CardTitle>
						</CardHeader>
						<CardContent className="relative">
							<p class="text-muted-foreground">
								We provide tools and resources to help vendors grow their businesses and reach more
								customers, including analytics, marketing support, and business insights.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>

			<!-- Key Features Section -->
			<div class="mx-auto mb-20 max-w-5xl">
				<h2 class="mb-8 scroll-m-20 text-center text-3xl font-semibold tracking-tight">
					Key Features
				</h2>
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div class="flex items-start gap-4 rounded-lg border bg-card/50 p-4">
						<div
							class="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg
							>
						</div>
						<div>
							<h3 class="mb-1 text-lg font-medium">Secure Transactions</h3>
							<p class="text-sm text-muted-foreground">
								End-to-end encryption and secure payment gateways to protect every transaction on
								our platform.
							</p>
						</div>
					</div>
					<div class="flex items-start gap-4 rounded-lg border bg-card/50 p-4">
						<div
							class="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-primary"
								><circle cx="12" cy="12" r="8" /><path d="M12 2v2" /><path d="M12 20v2" /><path
									d="m4.93 4.93 1.41 1.41"
								/><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path
									d="m6.34 17.66-1.41 1.41"
								/><path d="m19.07 4.93-1.41 1.41" /></svg
							>
						</div>
						<div>
							<h3 class="mb-1 text-lg font-medium">24/7 Availability</h3>
							<p class="text-sm text-muted-foreground">
								Shop anytime, anywhere with our always-on platform that never closes its doors to
								customers.
							</p>
						</div>
					</div>
					<div class="flex items-start gap-4 rounded-lg border bg-card/50 p-4">
						<div
							class="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-primary"
								><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></svg
							>
						</div>
						<div>
							<h3 class="mb-1 text-lg font-medium">Vendor Verification</h3>
							<p class="text-sm text-muted-foreground">
								Strict verification processes ensure only authentic and reliable vendors join our
								marketplace.
							</p>
						</div>
					</div>
					<div class="flex items-start gap-4 rounded-lg border bg-card/50 p-4">
						<div
							class="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-primary"
								><path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle
									cx="7"
									cy="7"
									r="3"
								/></svg
							>
						</div>
						<div>
							<h3 class="mb-1 text-lg font-medium">Smart Recommendations</h3>
							<p class="text-sm text-muted-foreground">
								AI-powered recommendations help you discover products you'll love based on your
								preferences.
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Team Section -->
			<div class="relative mb-16 overflow-hidden rounded-xl">
				<div
					class="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background"
				></div>
				<div class="@md:p-12 relative z-10 p-8">
					<div class="@container">
						<div
							class="@md:grid-cols-[2fr,1fr] mx-auto grid max-w-5xl grid-cols-1 items-center gap-8"
						>
							<div>
								<h2 class="mb-6 scroll-m-20 text-3xl font-semibold tracking-tight">
									Join Our Team
								</h2>
								<p class="mb-4 leading-relaxed text-muted-foreground">
									Azumi is powered by a passionate team of technology experts, market specialists,
									and customer service professionals dedicated to revolutionizing the African market
									experience.
								</p>
								<p class="mb-8 leading-relaxed text-muted-foreground">
									We're always looking for talented individuals who share our vision and want to
									make a meaningful impact on how people access markets across Africa.
								</p>
								<Button variant="default" class="group rounded-full">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="mr-2 transition-transform group-hover:translate-x-1"
										><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg
									>
									View Open Positions
								</Button>
							</div>
							<div class="@md:block hidden">
								<div
									class="flex aspect-square max-w-[300px] items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-5"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="120"
										height="120"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="0.5"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="text-primary/80"
										><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle
											cx="9"
											cy="7"
											r="4"
										></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path
											d="M16 3.13a4 4 0 0 1 0 7.75"
										></path></svg
									>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Contact Section -->
			<div class="mx-auto max-w-3xl text-center">
				<h2 class="mb-6 scroll-m-20 text-3xl font-semibold tracking-tight">Get In Touch</h2>
				<p class="mx-auto mb-8 max-w-xl text-muted-foreground">
					Have questions about Azumi? We'd love to hear from you and help you discover how our
					platform can meet your needs.
				</p>
				<div class="flex flex-wrap justify-center gap-4">
					<Button variant="default">Contact Us</Button>
					<Button variant="outline">Request Demo</Button>
				</div>
			</div>
		</div>
	</div>
</div>
