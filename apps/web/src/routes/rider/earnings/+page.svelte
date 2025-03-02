<script lang="ts">
	import { riderState } from '$lib/states/riderState.svelte';
	import { Card } from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Table from '$lib/components/ui/table';
	import { DollarSign, Package, Clock, TrendingUp } from 'lucide-svelte';
	import { formatCurrency, formatDate } from '$lib/utils';

	type WeeklyData = {
		total: number;
		deliveries: number;
		hours: number;
		avgPerDelivery: number;
		avgPerHour: number;
		dailyBreakdown: Array<{
			date: string;
			earnings: number;
			deliveries: number;
		}>;
	};

	type MonthlyData = {
		total: number;
		deliveries: number;
		hours: number;
		avgPerDelivery: number;
		avgPerHour: number;
		weeklyBreakdown: Array<{
			week: string;
			earnings: number;
			deliveries: number;
		}>;
	};

	type EarningsData = {
		week: WeeklyData;
		month: MonthlyData;
	};

	let selectedPeriod = $state<'week' | 'month'>('week');

	// Mock data for demonstration
	const earningsData = $state<EarningsData>({
		week: {
			total: 458.95,
			deliveries: 42,
			hours: 38,
			avgPerDelivery: 10.93,
			avgPerHour: 12.08,
			dailyBreakdown: [
				{ date: '2024-02-01', earnings: 75.5, deliveries: 7 },
				{ date: '2024-02-02', earnings: 82.45, deliveries: 8 },
				{ date: '2024-02-03', earnings: 68.0, deliveries: 6 },
				{ date: '2024-02-04', earnings: 95.25, deliveries: 9 },
				{ date: '2024-02-05', earnings: 71.75, deliveries: 7 },
				{ date: '2024-02-06', earnings: 66.0, deliveries: 5 }
			]
		},
		month: {
			total: 1875.5,
			deliveries: 168,
			hours: 152,
			avgPerDelivery: 11.16,
			avgPerHour: 12.34,
			weeklyBreakdown: [
				{ week: 'Week 1', earnings: 458.95, deliveries: 42 },
				{ week: 'Week 2', earnings: 482.3, deliveries: 44 },
				{ week: 'Week 3', earnings: 445.75, deliveries: 40 },
				{ week: 'Week 4', earnings: 488.5, deliveries: 42 }
			]
		}
	});

	let currentData = $derived(earningsData[selectedPeriod]);

	function isWeeklyData(data: WeeklyData | MonthlyData): data is WeeklyData {
		return 'dailyBreakdown' in data;
	}
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold">Earnings</h2>
		<Tabs.Root value={selectedPeriod} class="w-[400px]" onValueChange={(v) => (selectedPeriod = v)}>
			<Tabs.List class="grid w-full grid-cols-2">
				<Tabs.Trigger value="week">This Week</Tabs.Trigger>
				<Tabs.Trigger value="month">This Month</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	</div>

	<!-- Stats Overview -->
	<div class="grid gap-4 md:grid-cols-4">
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Total Earnings</span>
				<div class="flex items-center gap-2">
					<DollarSign class="h-4 w-4 text-green-500" />
					<span class="text-2xl font-bold">{formatCurrency(currentData.total)}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Deliveries</span>
				<div class="flex items-center gap-2">
					<Package class="h-4 w-4 text-blue-500" />
					<span class="text-2xl font-bold">{currentData.deliveries}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Hours Online</span>
				<div class="flex items-center gap-2">
					<Clock class="h-4 w-4 text-orange-500" />
					<span class="text-2xl font-bold">{currentData.hours}</span>
				</div>
			</div>
		</Card>
		<Card class="p-4">
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium text-muted-foreground">Avg. per Hour</span>
				<div class="flex items-center gap-2">
					<TrendingUp class="h-4 w-4 text-purple-500" />
					<span class="text-2xl font-bold">{formatCurrency(currentData.avgPerHour)}</span>
				</div>
			</div>
		</Card>
	</div>

	<!-- Earnings Breakdown -->
	<Card class="p-6">
		<h3 class="mb-6 font-semibold">Earnings Breakdown</h3>
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>{selectedPeriod === 'week' ? 'Date' : 'Week'}</Table.Head>
						<Table.Head>Deliveries</Table.Head>
						<Table.Head class="text-right">Earnings</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if isWeeklyData(currentData)}
						{#each currentData.dailyBreakdown as day}
							<Table.Row>
								<Table.Cell>{formatDate(new Date(day.date))}</Table.Cell>
								<Table.Cell>{day.deliveries}</Table.Cell>
								<Table.Cell class="text-right">{formatCurrency(day.earnings)}</Table.Cell>
							</Table.Row>
						{/each}
					{:else}
						{#each currentData.weeklyBreakdown as week}
							<Table.Row>
								<Table.Cell>{week.week}</Table.Cell>
								<Table.Cell>{week.deliveries}</Table.Cell>
								<Table.Cell class="text-right">{formatCurrency(week.earnings)}</Table.Cell>
							</Table.Row>
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>
		</div>
	</Card>

	<!-- Performance Insights -->
	<Card class="p-6">
		<h3 class="mb-4 font-semibold">Performance Insights</h3>
		<div class="grid gap-6 md:grid-cols-2">
			<div>
				<div class="text-sm font-medium text-muted-foreground">Average per Delivery</div>
				<div class="mt-1 text-2xl font-bold">{formatCurrency(currentData.avgPerDelivery)}</div>
				<p class="mt-1 text-sm text-muted-foreground">
					Based on {currentData.deliveries} deliveries
				</p>
			</div>
			<div>
				<div class="text-sm font-medium text-muted-foreground">Average per Hour</div>
				<div class="mt-1 text-2xl font-bold">{formatCurrency(currentData.avgPerHour)}</div>
				<p class="mt-1 text-sm text-muted-foreground">
					Based on {currentData.hours} hours online
				</p>
			</div>
		</div>
	</Card>
</div>
