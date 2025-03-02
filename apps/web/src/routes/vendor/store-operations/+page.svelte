<script lang="ts">
	import { Clock, Calendar, Clock4, Settings, Save } from 'lucide-svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';

	let isOpen = $state(true);
	let automaticStatus = $state(false);

	const weekDays = [
		{ day: 'Monday', openTime: '09:00', closeTime: '22:00', isOpen: true },
		{ day: 'Tuesday', openTime: '09:00', closeTime: '22:00', isOpen: true },
		{ day: 'Wednesday', openTime: '09:00', closeTime: '22:00', isOpen: true },
		{ day: 'Thursday', openTime: '09:00', closeTime: '22:00', isOpen: true },
		{ day: 'Friday', openTime: '09:00', closeTime: '23:00', isOpen: true },
		{ day: 'Saturday', openTime: '10:00', closeTime: '23:00', isOpen: true },
		{ day: 'Sunday', openTime: '10:00', closeTime: '22:00', isOpen: true }
	];

	let operatingHours = $state(weekDays);

	function updateStoreStatus() {
		// Here you would typically update the store status in your backend
		console.log('Store status updated:', isOpen);
	}

	function saveOperatingHours() {
		// Here you would typically save the operating hours to your backend
		console.log('Operating hours saved:', operatingHours);
	}
</script>

<div class="container mx-auto space-y-6 p-4">
	<h1 class="text-3xl font-bold">Store Operations</h1>

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Store Status Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center">
					<Clock class="mr-2 h-5 w-5" />
					Current Store Status
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<Label>Store Status</Label>
							<p class="text-sm text-muted-foreground">
								Toggle to change your store's availability
							</p>
						</div>
						<Switch checked={isOpen} onCheckedChange={updateStoreStatus} />
					</div>
					<div class="flex items-center justify-between">
						<div>
							<Label>Automatic Status Updates</Label>
							<p class="text-sm text-muted-foreground">
								Automatically update status based on operating hours
							</p>
						</div>
						<Switch checked={automaticStatus} />
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Quick Actions Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center">
					<Settings class="mr-2 h-5 w-5" />
					Quick Actions
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="grid gap-4">
					<Button variant="outline" class="w-full justify-start">
						<Clock4 class="mr-2 h-4 w-4" />
						Set Special Hours
					</Button>
					<Button variant="outline" class="w-full justify-start">
						<Calendar class="mr-2 h-4 w-4" />
						Schedule Holiday Closures
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Operating Hours Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center">
				<Clock class="mr-2 h-5 w-5" />
				Operating Hours
			</Card.Title>
			<Card.Description>Set your regular business hours for each day of the week</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="space-y-4">
				{#each operatingHours as { day, openTime, closeTime, isOpen }, index}
					<div class="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-4">
						<div class="flex items-center">
							<Switch
								checked={isOpen}
								onCheckedChange={(checked) => {
									operatingHours[index].isOpen = checked;
								}}
								class="mr-2"
							/>
							<Label>{day}</Label>
						</div>
						<div class="md:col-span-2">
							<div class="flex items-center gap-4">
								<div class="flex-1">
									<Label>Opening Time</Label>
									<Input
										type="time"
										value={openTime}
										on:input={(e) => {
											operatingHours[index].openTime = e.currentTarget.value;
										}}
										disabled={!isOpen}
									/>
								</div>
								<div class="flex-1">
									<Label>Closing Time</Label>
									<Input
										type="time"
										value={closeTime}
										on:input={(e) => {
											operatingHours[index].closeTime = e.currentTarget.value;
										}}
										disabled={!isOpen}
									/>
								</div>
							</div>
						</div>
					</div>
				{/each}
				<div class="flex justify-end">
					<Button on:click={saveOperatingHours}>
						<Save class="mr-2 h-4 w-4" />
						Save Changes
					</Button>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
