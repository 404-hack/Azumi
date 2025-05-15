<script lang="ts">
	import { siteConfig } from '$lib/config/site';

	interface Props {
		title: string;
		description: string;
		keywords?: string;
		ogImage?: string;
		ogType?: string;
		path?: string;
		jsonLd?: Record<string, any>;
	}

	let {
		title,
		description,
		keywords = '',
		ogImage = 'https://azumi.com.ng/logo.png',
		ogType = 'website',
		path = '',
		jsonLd
	}: Props = $props();

	const fullUrl = `${siteConfig.url}${path}`;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if keywords}
		<meta name="keywords" content={keywords} />
	{/if}

	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={ogType} />
	<meta property="og:url" content={fullUrl} />
	<meta property="og:image" content={ogImage} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@AzumiLogistics" />
	<meta name="twitter:creator" content="@AzumiLogistics" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	{#if jsonLd}
		<script type="application/ld+json">
			{JSON.stringify(jsonLd)}
		</script>
	{:else if ogType === 'restaurant'}
		<script type="application/ld+json">
			{JSON.stringify({
				"@context": "https://schema.org",
				"@type": "Restaurant",
				name: title,
				description: description,
				url: fullUrl,
            image: ogImage,
            address: {
                "@type": "PostalAddress",
                addressCountry: "NG",
                addressLocality: "Lagos"
            }
        })}
		</script>
	{/if}
</svelte:head>
