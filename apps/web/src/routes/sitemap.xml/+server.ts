import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		// Fetch all restaurants
		const res = await fetch('/api/shop');
		const restaurants = await res.json();

		const baseUrl = 'https://azumi.com.ng';

		// Static pages with their priorities and change frequencies
		const pages = [
			{ url: '/', priority: '1.0', changefreq: 'daily' },
			{ url: '/explore', priority: '0.9', changefreq: 'hourly' },
			{ url: '/explore/shops', priority: '0.9', changefreq: 'hourly' },
			{ url: '/about', priority: '0.7', changefreq: 'monthly' },
			{ url: '/contact', priority: '0.7', changefreq: 'monthly' },
			{ url: '/terms', priority: '0.5', changefreq: 'monthly' },
			{ url: '/privacy', priority: '0.5', changefreq: 'monthly' },
			{ url: '/faq', priority: '0.6', changefreq: 'weekly' }
		];

		const now = new Date().toISOString();

		const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
            ${pages
							.map(
								(page) => `
                <url>
                    <loc>${baseUrl}${page.url}</loc>
                    <lastmod>${now}</lastmod>
                    <changefreq>${page.changefreq}</changefreq>
                    <priority>${page.priority}</priority>
                </url>
            `
							)
							.join('')}
            ${restaurants
							.map(
								(restaurant: any) => `
                <url>
                    <loc>${baseUrl}/restaurant/${restaurant.slug}</loc>
                    <lastmod>${new Date(restaurant.updatedAt || restaurant.createdAt).toISOString()}</lastmod>
                    <changefreq>hourly</changefreq>
                    <priority>0.8</priority>
                    ${
											restaurant.coverImage
												? `
                    <image:image>
                        <image:loc>${restaurant.coverImage}</image:loc>
                        <image:title>${restaurant.name}</image:title>
                        <image:caption>${restaurant.description || `Order from ${restaurant.name} on Azumi`}</image:caption>
                    </image:image>
                    `
												: ''
										}
                </url>
            `
							)
							.join('')}
        </urlset>`.trim();

		return new Response(sitemap, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'max-age=0, s-maxage=3600',
				'X-Robots-Tag': 'noarchive'
			}
		});
	} catch (error) {
		console.error('Error generating sitemap:', error);

		// Return a basic sitemap with just static pages if there's an error
		const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url>
                <loc>https://azumi.com.ng/</loc>
                <changefreq>daily</changefreq>
                <priority>1.0</priority>
            </url>
            <url>
                <loc>https://azumi.com.ng/explore</loc>
                <changefreq>daily</changefreq>
                <priority>0.9</priority>
            </url>
        </urlset>`;

		return new Response(basicSitemap, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'max-age=0, s-maxage=3600'
			}
		});
	}
};
