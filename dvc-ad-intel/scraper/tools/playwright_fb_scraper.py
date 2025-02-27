import asyncio
from playwright.async_api import async_playwright

# Asynchronously scrape Facebook Ads Library for a given search query.
async def scrape_facebook_ads(search_query: str):
    results = []  # List to store the scraped ad texts

    # Construct the URL using the provided search query.
    # This URL includes parameters to filter active ads, all ad types,
    # ads from the US, all media types, and uses the search term.
    url = (
        "https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country=US&is_targeted_country=false"
        f"&media_type=all&q={search_query}&search_type=keyword_unordered"
    )

    # Start Playwright in an asynchronous context.
    async with async_playwright() as p:
        # Launch Chromium in headless mode (no graphical interface).
        browser = await p.chromium.launch(headless=True)
        # Open a new page (i.e., a new browser tab).
        page = await browser.new_page()
        # Navigate to the constructed URL with a 60-second timeout.
        await page.goto(url, timeout=60000)

        # Scroll the page several times to load dynamic content.
        for _ in range(5):  # Adjust the number of scrolls if needed.
            # Scroll to the bottom of the page.
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            # Wait 2 seconds for new content to load.
            await asyncio.sleep(2)

        # Use the confirmed selector to select all ad containers.
        # "div.xh8yej3" selects all <div> elements with the class "xh8yej3"
        ad_elements = await page.query_selector_all('div.xh8yej3')

        # Loop through each ad element found.
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
    # asyncio.run will execute the asynchronous function and return its result.
    return asyncio.run(scrape_facebook_ads(search_query))

if __name__ == "__main__":
    # For testing purposes, the search query is hardcoded to 'shapewear'.
    ads_data = run_facebook_scraper("shapewear")

    # Print the results to the console, limiting to the first 5 ads.
    print("Scraped Facebook Ads:")
    for ad in ads_data[:5]:
        print(ad)
        print("---------------------")
