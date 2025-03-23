<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	// Mock data - replace with actual API call
	let menu: any = null;
	let loading = true;
	let error = null;

	onMount(async () => {
		try {
			// Replace with actual API call
			await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate loading
			menu = {
				id: $page.params.menuId,
				name: 'Jollof Rice Special',
				description: 'Traditional West African rice dish with tomatoes, peppers and spices',
				price: 12.99,
				category: 'Main Dishes',
				availability: true,
				image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?q=80&w=2000',
				ingredients: ['Rice', 'Tomatoes', 'Peppers', 'Onions', 'Spices'],
				nutritionalInfo: {
					calories: 450,
					protein: '12g',
					carbs: '65g',
					fat: '15g'
				},
				averageRating: 4.8,
				totalReviews: 124,
				createdAt: '2023-05-15T10:30:00Z',
				updatedAt: '2023-09-22T14:45:00Z'
			};
			loading = false;
		} catch (e) {
			error = e;
			loading = false;
		}
	});

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};
</script>

<div class="menu-details-page">
	{#if loading}
		<div class="loading-container" in:fade>
			<div class="loader"></div>
			<p>Loading menu information...</p>
		</div>
	{:else if error}
		<div class="error-container" in:fade>
			<h2>Error</h2>
			<p>Failed to load menu information. Please try again.</p>
			<button class="primary-button">Retry</button>
		</div>
	{:else}
		<div class="page-container" in:fade>
			<header>
				<div class="breadcrumb">
					<a href="/vendor/menu">Menus</a> / <span>{menu.name}</span>
				</div>
				<div class="header-content">
					<div class="header-text">
						<h1>{menu.name}</h1>
						<div class="meta-tags">
							<span class="tag category">{menu.category}</span>
							<span class="tag {menu.availability ? 'available' : 'unavailable'}">
								{menu.availability ? 'Available' : 'Unavailable'}
							</span>
						</div>
					</div>
					<div class="header-actions">
						<button class="secondary-button">Edit</button>
						<button class="primary-button">Update Availability</button>
					</div>
				</div>
			</header>

			<div class="content-grid">
				<main>
					<section class="info-card">
						<div class="card-header">
							<h2>Menu Details</h2>
							<span class="last-updated">Last updated: {formatDate(menu.updatedAt)}</span>
						</div>

						<div class="image-container">
							<img src={menu.image} alt={menu.name} />
						</div>

						<div class="menu-content">
							<div class="description">
								<h3>Description</h3>
								<p>{menu.description}</p>
							</div>

							<div class="ingredients">
								<h3>Ingredients</h3>
								<div class="ingredient-tags">
									{#each menu.ingredients as ingredient}
										<span class="ingredient-tag">{ingredient}</span>
									{/each}
								</div>
							</div>

							<div class="pricing">
								<h3>Pricing</h3>
								<div class="price-tag">${menu.price.toFixed(2)}</div>
							</div>
						</div>
					</section>

					<section class="info-card">
						<h2>Nutritional Information</h2>
						<div class="nutritional-grid">
							<div class="nutrition-item">
								<span class="nutrition-label">Calories</span>
								<span class="nutrition-value">{menu.nutritionalInfo.calories}</span>
							</div>
							<div class="nutrition-item">
								<span class="nutrition-label">Protein</span>
								<span class="nutrition-value">{menu.nutritionalInfo.protein}</span>
							</div>
							<div class="nutrition-item">
								<span class="nutrition-label">Carbs</span>
								<span class="nutrition-value">{menu.nutritionalInfo.carbs}</span>
							</div>
							<div class="nutrition-item">
								<span class="nutrition-label">Fat</span>
								<span class="nutrition-value">{menu.nutritionalInfo.fat}</span>
							</div>
						</div>
					</section>
				</main>

				<aside>
					<section class="info-card stats-card">
						<h2>Performance</h2>
						<div class="stats-container">
							<div class="stat-item">
								<div class="stat-value">{menu.averageRating}/5</div>
								<div class="stat-label">Average Rating</div>
							</div>
							<div class="stat-item">
								<div class="stat-value">{menu.totalReviews}</div>
								<div class="stat-label">Total Reviews</div>
							</div>
						</div>
					</section>

					<section class="info-card">
						<h2>Actions</h2>
						<div class="actions-list">
							<button class="action-button"><i class="icon-edit"></i> Edit Menu</button>
							<button class="action-button"><i class="icon-duplicate"></i> Duplicate</button>
							<button class="action-button"
								><i class="icon-hide"></i> {menu.availability ? 'Hide' : 'Show'} Menu</button
							>
							<button class="action-button danger"><i class="icon-delete"></i> Delete</button>
						</div>
					</section>
				</aside>
			</div>
		</div>
	{/if}
</div>

<style>
	.menu-details-page {
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
			'Helvetica Neue', sans-serif;
		color: #000;
		background-color: #fafafa;
		min-height: 100vh;
	}

	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	header {
		margin-bottom: 2rem;
	}

	.breadcrumb {
		font-size: 0.875rem;
		margin-bottom: 1rem;
		color: #666;
	}

	.breadcrumb a {
		color: #666;
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 1rem;
	}

	h1 {
		font-size: 2rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.meta-tags {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.tag {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.category {
		background-color: #eee;
		color: #333;
	}

	.available {
		background-color: #e6f7e6;
		color: #0c7c0c;
	}

	.unavailable {
		background-color: #ffebeb;
		color: #cc0000;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
	}

	.primary-button,
	.secondary-button {
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-weight: 500;
		font-size: 0.875rem;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.primary-button {
		background-color: #000;
		color: white;
	}

	.primary-button:hover {
		background-color: #333;
	}

	.secondary-button {
		background-color: white;
		color: #000;
		border: 1px solid #ddd;
	}

	.secondary-button:hover {
		background-color: #f5f5f5;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 2rem;
	}

	.info-card {
		background-color: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		margin-bottom: 2rem;
		border: 1px solid #eaeaea;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.last-updated {
		font-size: 0.75rem;
		color: #666;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 1.5rem 0;
	}

	h3 {
		font-size: 1rem;
		font-weight: 600;
		margin: 1rem 0 0.5rem 0;
	}

	.image-container {
		margin-bottom: 1.5rem;
		border-radius: 6px;
		overflow: hidden;
		border: 1px solid #eaeaea;
	}

	.image-container img {
		width: 100%;
		height: auto;
		display: block;
		object-fit: cover;
		aspect-ratio: 16/9;
	}

	.menu-content {
		display: grid;
		gap: 1.5rem;
	}

	.description p {
		margin: 0;
		line-height: 1.6;
		color: #333;
	}

	.ingredient-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.ingredient-tag {
		background-color: #f5f5f5;
		padding: 0.25rem 0.75rem;
		border-radius: 16px;
		font-size: 0.875rem;
		color: #333;
	}

	.price-tag {
		font-size: 1.5rem;
		font-weight: 600;
		color: #000;
	}

	.nutritional-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem;
		padding: 0.5rem;
	}

	.nutrition-item {
		display: flex;
		flex-direction: column;
	}

	.nutrition-label {
		font-size: 0.875rem;
		color: #666;
		margin-bottom: 0.25rem;
	}

	.nutrition-value {
		font-size: 1.125rem;
		font-weight: 500;
	}

	.stats-container {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		text-align: center;
	}

	.stat-item {
		flex: 1;
		padding: 1rem;
		background-color: #f9f9f9;
		border-radius: 6px;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #666;
	}

	.actions-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.action-button {
		padding: 0.75rem;
		background-color: #fff;
		border: 1px solid #eaeaea;
		border-radius: 4px;
		text-align: left;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-button:hover {
		background-color: #f5f5f5;
	}

	.action-button.danger {
		color: #cc0000;
	}

	.action-button.danger:hover {
		background-color: #ffebeb;
	}

	/* Mock icons */
	[class^='icon-'] {
		display: inline-block;
		width: 16px;
		height: 16px;
		margin-right: 0.5rem;
		background-color: currentColor;
		opacity: 0.7;
		mask-size: cover;
	}

	/* Loading and error states */
	.loading-container,
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		text-align: center;
	}

	.loader {
		width: 40px;
		height: 40px;
		border: 3px solid #eee;
		border-top: 3px solid #000;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	/* Responsive design */
	@media (max-width: 900px) {
		.content-grid {
			grid-template-columns: 1fr;
		}

		.header-content {
			flex-direction: column;
		}

		.header-actions {
			width: 100%;
			justify-content: flex-start;
		}
	}
</style>
