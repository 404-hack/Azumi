<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getCurrentLocationWithOptions,
		getLocationAccuracyMessage,
		getLocationAccuracyColor,
		getLocationAccuracyIcon
	} from '$lib/utils/location';
	import { toast } from 'svelte-sonner';
	import { Loader2, MapPin, AlertCircle, CheckCircle, RotateCcw, Trash2 } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	interface TestResult {
		id: number;
		timestamp: Date;
		title: string;
		success: boolean;
		data?: any;
		error?: string;
		duration?: number;
	}

	let results: TestResult[] = $state([]);
	let isTestingBasic = $state(false);
	let isTestingEnhanced = $state(false);
	let resultCounter = 0;

	function addResult(
		title: string,
		success: boolean,
		data?: any,
		error?: string,
		duration?: number
	) {
		resultCounter++;
		const result: TestResult = {
			id: resultCounter,
			timestamp: new Date(),
			title,
			success,
			data,
			error,
			duration
		};
		results = [result, ...results];
	}

	async function testBasicGPS() {
		if (isTestingBasic) return;

		isTestingBasic = true;
		const startTime = Date.now();

		try {
			toast.info('🌍 Starting basic GPS test...');

			const result = await getCurrentLocationWithOptions({
				enableHighAccuracy: true,
				timeout: 15000,
				maximumAge: 60000,
				preferredSource: 'auto'
			});

			const duration = Date.now() - startTime;

			addResult('Basic GPS Test', true, result, undefined, duration);
			toast.success(`GPS location found in ${(duration / 1000).toFixed(1)}s`);
		} catch (error) {
			const duration = Date.now() - startTime;
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			addResult('Basic GPS Test', false, undefined, errorMessage, duration);
			toast.error(`GPS test failed: ${errorMessage}`);
		} finally {
			isTestingBasic = false;
		}
	}

	async function testEnhancedGPS() {
		if (isTestingEnhanced) return;

		isTestingEnhanced = true;
		const startTime = Date.now();

		try {
			toast.info('🎯 Starting enhanced GPS test with multiple attempts...');

			const result = await getCurrentLocationWithOptions({
				enableHighAccuracy: true,
				timeout: 25000,
				maximumAge: 0,
				preferredSource: 'google'
			});

			const duration = Date.now() - startTime;

			addResult('Enhanced GPS Test', true, result, undefined, duration);
			toast.success(`Enhanced GPS completed in ${(duration / 1000).toFixed(1)}s`);
		} catch (error) {
			const duration = Date.now() - startTime;
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			addResult('Enhanced GPS Test', false, undefined, errorMessage, duration);
			toast.error(`Enhanced GPS test failed: ${errorMessage}`);
		} finally {
			isTestingEnhanced = false;
		}
	}

	function clearResults() {
		results = [];
		resultCounter = 0;
		toast.info('Results cleared');
	}

	function formatDuration(ms: number): string {
		return `${(ms / 1000).toFixed(1)}s`;
	}

	function getAccuracyBadgeClass(accuracy: number): string {
		if (accuracy <= 10) return 'bg-green-100 text-green-800';
		if (accuracy <= 25) return 'bg-blue-100 text-blue-800';
		if (accuracy <= 50) return 'bg-yellow-100 text-yellow-800';
		if (accuracy <= 100) return 'bg-orange-100 text-orange-800';
		return 'bg-red-100 text-red-800';
	}
</script>

<div class="mx-auto max-w-4xl p-6">
	<div class="mb-8">
		<h1 class="mb-4 text-3xl font-bold text-gray-900">🎯 Enhanced GPS Accuracy Testing</h1>
		<div class="mb-6 border-l-4 border-blue-400 bg-blue-50 p-4">
			<div class="flex">
				<div class="ml-3">
					<h3 class="text-sm font-medium text-blue-800">What's New?</h3>
					<div class="mt-2 text-sm text-blue-700">
						<ul class="list-inside list-disc space-y-1">
							<li>
								<strong>Enhanced GPS:</strong> Uses multiple attempts with different accuracy settings
								to get the best location
							</li>
							<li>
								<strong>No Caching:</strong> Sets maximumAge to 0 to ensure fresh GPS readings every
								time
							</li>
							<li>
								<strong>Smart Fallbacks:</strong> Falls back to different accuracy modes if high-accuracy
								fails
							</li>
							<li>
								<strong>Real-time Progress:</strong> Shows live accuracy improvements during location
								detection
							</li>
							<li>
								<strong>Coordinate Validation:</strong> Backend now validates coordinates before sending
								to WebSocket system
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
		<Button
			onclick={testBasicGPS}
			disabled={isTestingBasic || isTestingEnhanced}
			class="h-16 text-lg"
			variant="outline"
		>
			{#if isTestingBasic}
				<Loader2 class="mr-2 h-5 w-5 animate-spin" />
				Testing...
			{:else}
				<MapPin class="mr-2 h-5 w-5" />
				Basic GPS Test
			{/if}
		</Button>

		<Button
			onclick={testEnhancedGPS}
			disabled={isTestingBasic || isTestingEnhanced}
			class="h-16 text-lg"
		>
			{#if isTestingEnhanced}
				<Loader2 class="mr-2 h-5 w-5 animate-spin" />
				Testing...
			{:else}
				<CheckCircle class="mr-2 h-5 w-5" />
				Enhanced GPS Test
			{/if}
		</Button>

		<Button
			onclick={clearResults}
			disabled={isTestingBasic || isTestingEnhanced}
			variant="destructive"
			class="h-16 text-lg"
		>
			<Trash2 class="mr-2 h-5 w-5" />
			Clear Results
		</Button>
	</div>

	{#if results.length > 0}
		<div class="space-y-4">
			<h2 class="mb-4 text-xl font-semibold text-gray-800">
				Test Results ({results.length})
			</h2>

			{#each results as result (result.id)}
				<div
					class="rounded-lg border p-4 {result.success
						? 'border-green-200 bg-green-50'
						: 'border-red-200 bg-red-50'}"
				>
					<div class="mb-3 flex items-center justify-between">
						<div class="flex items-center space-x-2">
							{#if result.success}
								<CheckCircle class="h-5 w-5 text-green-600" />
							{:else}
								<AlertCircle class="h-5 w-5 text-red-600" />
							{/if}
							<h3 class="font-semibold text-gray-800">
								#{result.id} - {result.title}
							</h3>
						</div>
						<div class="text-sm text-gray-500">
							{result.timestamp.toLocaleTimeString()}
							{#if result.duration}
								• {formatDuration(result.duration)}
							{/if}
						</div>
					</div>

					{#if result.success && result.data}
						<div class="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<div class="space-y-1 text-sm">
									<div>
										<span class="font-medium">Latitude:</span>
										<span class="ml-1 font-mono">{result.data.coordinates.latitude.toFixed(6)}</span
										>
									</div>
									<div>
										<span class="font-medium">Longitude:</span>
										<span class="ml-1 font-mono"
											>{result.data.coordinates.longitude.toFixed(6)}</span
										>
									</div>
								</div>
							</div>

							<div>
								{#if result.data.accuracy}
									<div class="mb-2 flex items-center space-x-2">
										<span class="text-sm font-medium">Accuracy:</span>
										<span
											class="rounded-full px-2 py-1 text-xs font-semibold {getAccuracyBadgeClass(
												result.data.accuracy
											)}"
										>
											{Math.round(result.data.accuracy)}m
										</span>
									</div>
									<div class="text-sm {getLocationAccuracyColor(result.data.accuracy)}">
										{getLocationAccuracyIcon(result.data.accuracy)}
										{getLocationAccuracyMessage(result.data.accuracy)}
									</div>
								{/if}
							</div>
						</div>

						{#if result.data.address}
							<div class="mt-3 rounded-md bg-gray-100 p-3">
								<div class="text-sm">
									<div class="font-medium text-gray-700">Location:</div>
									<div class="text-gray-600">{result.data.name}</div>
									<div class="mt-1 text-xs text-gray-500">{result.data.address}</div>
								</div>
							</div>
						{/if}

						{#if result.data.source}
							<div class="mt-2 text-xs text-gray-500">
								Source: {result.data.source}
							</div>
						{/if}
					{:else if result.error}
						<div class="mt-3 rounded-md bg-red-100 p-3">
							<div class="text-sm text-red-700">
								<strong>Error:</strong>
								{result.error}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="py-12 text-center text-gray-500">
			<MapPin class="mx-auto mb-4 h-12 w-12 text-gray-300" />
			<p>No test results yet. Try running a GPS test above!</p>
		</div>
	{/if}
</div>
