import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const baseUrl = 'https://azumi.com.ng';

	const robotsTxt = `
# www.robotstxt.org

User-agent: *

# Private routes
Disallow: /vendor/
Disallow: /rider/
Disallow: /superadmin/
Disallow: /api/
Disallow: /checkout/
Disallow: /me/
Disallow: /auth/

# Allow public routes
Allow: /
Allow: /explore
Allow: /restaurant/
Allow: /about
Allow: /contact
Allow: /terms
Allow: /privacy
Allow: /faq
Allow: /*.js
Allow: /*.css
Allow: /*.png
Allow: /*.jpg
Allow: /*.svg
Allow: /*.ico
Allow: /robots.txt
Allow: /favicon.ico

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay
Crawl-delay: 1
`.trim();

	return new Response(robotsTxt, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
