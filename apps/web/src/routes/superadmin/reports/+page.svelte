<script lang="ts">
	import { adminState } from '$lib/states/adminState.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Input } from '$lib/components/ui/input';
	import {
		FileText,
		Download,
		Calendar,
		TrendingUp,
		DollarSign,
		ShoppingBag,
		Store,
		Bike
	} from 'lucide-svelte';
	import { formatCurrency, formatDate } from '$lib/utils';

	let selectedPeriod = $state<'daily' | 'weekly' | 'monthly'>('daily');
	let selectedDate = $state<string>(new Date().toISOString().split('T')[0]);

	// Mock data for reports
	const recentReports = [
		{
			id: 'REP-001',
			type: 'Sales Report',
			period: 'Daily',
			date: new Date('2024-02-01'),
			status: 'completed',
			downloadUrl: '#'
		},
		{
			id: 'REP-002',
			type: 'Vendor Performance',
			period: 'Weekly',
			date: new Date('2024-02-01'),
			status: 'completed',
			downloadUrl: '#'
		},
		{
			id: 'REP-003',
			type: 'Rider Performance',
			period: 'Monthly',
			date: new Date('2024-01-01'),
			status: 'completed',
			downloadUrl: '#'
		}
	];

	const reportTypes = [
		{
			id: 'sales',
			name: 'Sales Report',
			description: 'Detailed breakdown of sales, revenue, and transactions',
			icon: DollarSign
		},
		{
			id: 'vendors',
			name: 'Vendor Performance',
			description: 'Analysis of vendor performance, ratings, and revenue',
			icon: Store
		},
		{
			id: 'riders',
			name: 'Rider Performance',
			description: 'Delivery metrics, ratings, and rider efficiency',
			icon: Bike
		},
		{
			id: 'orders',
			name: 'Order Analytics',
			description: 'Order patterns, popular items, and peak hours',
			icon: ShoppingBag
		}
	];

	async function generateReport(type: string) {
		await adminState.generateReport(selectedPeriod);
		// Handle report generation
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">Reports</h2>
		<div class="flex items-center gap-4">
			<Tabs.Root value={selectedPeriod} onValueChange={(v) => (selectedPeriod = v)}>
				<Tabs.List>
					<Tabs.Trigger value="daily">Daily</Tabs.Trigger>
					<Tabs.Trigger value="weekly">Weekly</Tabs.Trigger>
					<Tabs.Trigger value="monthly">Monthly</Tabs.Trigger>
				</Tabs.List>
			</Tabs.Root>
			<input type="date" bind:value={selectedDate} class="rounded-md border px-2 py-1 text-sm" />
		</div>
	</div>

	<!-- Report Types -->
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
		{#each reportTypes as report}
			<Card class="p-6">
				<div class="flex flex-col gap-4">
					<div class="flex items-start justify-between">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
							<svelte:component this={report.icon} class="h-5 w-5 text-primary" />
						</div>
						<Button variant="outline" size="sm" onclick={() => generateReport(report.id)}>
							Generate
						</Button>
					</div>
					<div>
						<h3 class="font-semibold">{report.name}</h3>
						<p class="text-sm text-muted-foreground">{report.description}</p>
					</div>
				</div>
			</Card>
		{/each}
	</div>

	<!-- Recent Reports -->
	<Card class="p-6">
		<div class="flex items-center justify-between">
			<h3 class="font-semibold">Recent Reports</h3>
		</div>
		<div class="mt-6">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Report ID</Table.Head>
						<Table.Head>Type</Table.Head>
						<Table.Head>Period</Table.Head>
						<Table.Head>Generated</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each recentReports as report}
						<Table.Row>
							<Table.Cell class="font-medium">{report.id}</Table.Cell>
							<Table.Cell>{report.type}</Table.Cell>
							<Table.Cell>{report.period}</Table.Cell>
							<Table.Cell>{formatDate(report.date)}</Table.Cell>
							<Table.Cell>
								<Badge variant="outline">{report.status}</Badge>
							</Table.Cell>
							<Table.Cell class="text-right">
								<Button variant="ghost" size="sm" class="flex items-center gap-2">
									<Download class="h-4 w-4" />
									Download
								</Button>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</Card>
</div>
