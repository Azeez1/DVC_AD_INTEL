# scraper/tools/playwright_fb_scraper.py

import asyncio
from playwright.async_api import async_playwright


async def scrape_facebook_ads():
    """
    Scrapes a sample Facebook Ads Library page for ad data.
    Adjust the URL or selectors as needed for your target ads.
    """
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        )
        page = await browser.new_page()

        # Navigate to Facebook Ads Library with a sample query.
        # You can change the 'q' parameter to target specific brands or keywords.
        url = "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=example"
        await page.goto(url, timeout=60000)

        # Wait for ad elements to load; adjust the selector if needed.
        await page.wait_for_selector("div[role='article']", timeout=60000)

        # Query all ad containers
        ad_elements = await page.query_selector_all("div[role='article']")

        for elem in ad_elements:
            try:
                # Extract text content from each ad element
                ad_text = await elem.inner_text()
                results.append(ad_text)
            except Exception as e:
                print(f"Error extracting ad info: {e}")

        await browser.close()
    return results


def run_facebook_scraper():
    """Wrapper to run the async Facebook scraper synchronously."""
    return asyncio.run(scrape_facebook_ads())


if __name__ == "__main__":
    ads_data = run_facebook_scraper()
    print("Scraped Facebook Ads:")
    for ad in ads_data:
        print(ad)
