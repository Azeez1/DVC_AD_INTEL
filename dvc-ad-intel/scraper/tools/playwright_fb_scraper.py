import asyncio
from playwright.async_api import async_playwright

# Asynchronously scrape Facebook Ads Library for a given search query.
async def scrape_facebook_ads(search_query: str):
    results = []  # List to store the scraped ad texts

    # Construct the URL using the provided search query.
    # The URL includes parameters to filter active ads, all ad types, US country, etc.
    url = (
        "https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country=US&is_targeted_country=false"
        f"&media_type=all&q={search_query}&search_type=keyword_unordered"
    )

    # Initialize Playwright in an asynchronous context.
    async with async_playwright() as p:
        # Launch Chromium in headless mode (no UI).
        browser = await p.chromium.launch(headless=True)
        # Create a new page (browser tab).
        page = await browser.new_page()
        # Navigate to the constructed URL with a 60-second timeout.
        await page.goto(url, timeout=60000)
        # Wait for the ad elements to appear on the page using the updated selector.
        await page.wait_for_selector('div[data-testid="ad"]', timeout=60000)
        # Query all elements that match the selector (each representing an ad).
        ad_elements = await page.query_selector_all('div[data-testid="ad"]')
        # Loop through each found ad element.
        for elem in ad_elements:
            # Extract the inner text from the ad element.
            text = await elem.inner_text()
            # Append the extracted text to the results list.
            results.append(text)
        # Close the browser to free up resources.
        await browser.close()
    # Return the list of scraped ad texts.
    return results

# Synchronous wrapper to run the asynchronous scraping function.
def run_facebook_scraper(search_query: str):
    return asyncio.run(scrape_facebook_ads(search_query))

if __name__ == "__main__":
    # For testing purposes, we use 'shapewear' as the search query.
    # In production, this value can be dynamically provided from your frontend.
    ads_data = run_facebook_scraper("shapewear")

    # Print out the scraped Facebook Ads.
    print("Scraped Facebook Ads:")
    for ad in ads_data:
        print(ad)
