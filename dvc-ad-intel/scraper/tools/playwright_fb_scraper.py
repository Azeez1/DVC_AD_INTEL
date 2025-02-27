import asyncio
from playwright.async_api import async_playwright

async def scrape_facebook_ads(search_query: str):
    results = []
    url = (
        "https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country=US&is_targeted_country=false"
        f"&media_type=all&q={search_query}&search_type=keyword_unordered")

    async with async_playwright() as p:
        # Launch with headless=False to see what's happening during development
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Navigate and wait for content to load
        await page.goto(url, timeout=60000)
        # Wait for the ads to appear
        await page.wait_for_selector('div[role="main"]', timeout=30000)

        # Scroll to load more content
        for _ in range(5):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(3)  # Increased wait time

        # Target the main ad containers - this is a more reliable selector
        # Look for divs that contain the "Sponsored" text
        ad_elements = await page.query_selector_all('div:has-text("Sponsored")')

        print(f"Found {len(ad_elements)} ad elements")

        for i, elem in enumerate(ad_elements):
            if len(results) >= 5:
                break

            ad_data = {}

            # Brand name - look for elements with links that might contain the brand name
            brand_elem = await elem.query_selector("a[role='link']:visible")
            if brand_elem:
                ad_data["brand"] = await brand_elem.inner_text()

            # Ad copy - look for text containers, especially those with more content
            ad_copy_candidates = await elem.query_selector_all("div[style*='white-space: pre-wrap']")
            if ad_copy_candidates:
                longest_text = ""
                for candidate in ad_copy_candidates:
                    text = await candidate.inner_text()
                    if len(text) > len(longest_text):
                        longest_text = text
                ad_data["ad_copy"] = longest_text

            # CTA - look for elements that typically contain CTA text
            cta_candidates = [
                "div:has-text('Shop Now')",
                "div:has-text('Learn More')",
                "div:has-text('Sign Up')",
                "div:has-text('Get Offer')"
            ]

            for cta_selector in cta_candidates:
                cta_elem = await elem.query_selector(cta_selector)
                if cta_elem:
                    cta_text = await cta_elem.inner_text()
                    if cta_text in ["Shop Now", "Learn More", "Sign Up", "Get Offer"]:
                        ad_data["cta"] = cta_text
                        break

            # Video - try multiple selectors for video elements
            video_selectors = ["video", "video[src]", "div:has(> video)"]
            for video_selector in video_selectors:
                video_elem = await elem.query_selector(video_selector)
                if video_elem:
                    src = await video_elem.get_attribute("src")
                    if src:
                        ad_data["video"] = src
                        break

            # Only add ads that have at least some data
            if any(ad_data.values()):
                results.append(ad_data)
                print(f"Processed ad {i+1}: {ad_data}")

        await browser.close()

    return results

def run_facebook_scraper(search_query: str):
    return asyncio.run(scrape_facebook_ads(search_query))

if __name__ == "__main__":
    ads_data = run_facebook_scraper("shapewear")

    print("\nScraped Facebook Ads:")
    for ad in ads_data:
        print("Video Link:", ad.get("video", "Not found"))
        print("Brand Name:", ad.get("brand", "Not found"))
        print("Ad Copy:", ad.get("ad_copy", "Not found"))
        print("CTA:", ad.get("cta", "Not found"))
        print("---------------------")