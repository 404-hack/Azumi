<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Facebook, Twitter, Instagram, ChevronRight } from 'lucide-svelte';
</script>

<footer class="border-t bg-background">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
			<div class="space-y-3">
				<h3 class="text-sm font-medium">Company</h3>
				<ul class="space-y-1">
					<li>
						<a href="/about" class="text-sm text-muted-foreground hover:text-primary">About us</a>
					</li>
					<li>
						<a href="/careers" class="text-sm text-muted-foreground hover:text-primary">Careers</a>
					</li>
					<li>
						<a href="/press" class="text-sm text-muted-foreground hover:text-primary">Press</a>
					</li>
				</ul>
			</div>

			<div class="space-y-3">
				<h3 class="text-sm font-medium">Partner with us</h3>
				<ul class="space-y-1">
					<li>
						<a href="/create-a-page" class="text-sm text-muted-foreground hover:text-primary"
							>For restaurants</a
						>
					</li>
					<li>
						<a href="/stores" class="text-sm text-muted-foreground hover:text-primary">For stores</a
						>
					</li>
					<li>
						<a href="/business" class="text-sm text-muted-foreground hover:text-primary"
							>For companies</a
						>
					</li>
				</ul>
			</div>

			<div class="space-y-3">
				<h3 class="text-sm font-medium">Support</h3>
				<ul class="space-y-1">
					<li>
						<a href="/help" class="text-sm text-muted-foreground hover:text-primary">Help center</a>
					</li>
					<li>
						<a href="/faq" class="text-sm text-muted-foreground hover:text-primary">FAQ</a>
					</li>
					<li>
						<a href="/contact" class="text-sm text-muted-foreground hover:text-primary"
							>Contact us</a
						>
					</li>
				</ul>
			</div>

			<div class="space-y-3 sm:col-span-2 lg:col-span-1">
				<h3 class="text-sm font-medium">Get the app</h3>
				<!-- <div class="flex gap-4">
					<Button variant="outline" class="h-10 w-full gap-2 text-xs sm:w-auto">
						<span>App Store</span>
						<ChevronRight class="h-4 w-4" />
					</Button>
					<Button variant="outline" class="h-10 w-full gap-2 text-xs sm:w-auto">
						<span>Play Store</span>
						<ChevronRight class="h-4 w-4" />
					</Button>
				</div> -->
				<div class="flex gap-4 pt-2">
					<a
						href="#"
						class="text-muted-foreground transition-colors hover:text-primary"
						aria-label="Facebook"
					>
						<Facebook class="h-5 w-5" />
					</a>
					<a
						href="#"
						class="text-muted-foreground transition-colors hover:text-primary"
						aria-label="Twitter"
					>
						<Twitter class="h-5 w-5" />
					</a>
					<a
						href="#"
						class="text-muted-foreground transition-colors hover:text-primary"
						aria-label="Instagram"
					>
						<Instagram class="h-5 w-5" />
					</a>
				</div>
			</div>
		</div>

		<div class="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
			<p class="text-sm text-muted-foreground">© 2024 Azumi. All rights reserved.</p>
			<div class="flex gap-4">
				<a href="/privacy" class="text-sm text-muted-foreground hover:text-primary">Privacy</a>
				<a href="/terms" class="text-sm text-muted-foreground hover:text-primary">Terms</a>
				<a href="/cookies" class="text-sm text-muted-foreground hover:text-primary">Cookies</a>
			</div>
		</div>
	</div>
</footer>
