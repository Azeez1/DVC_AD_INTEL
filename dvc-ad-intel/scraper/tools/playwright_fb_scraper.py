import asyncio
from playwright.async_api import async_playwright

# Asynchronously scrape Facebook Ads Library for a given search query.
async def scrape_facebook_ads(search_query: str):
    results = []  # List to store a dictionary of extracted fields per ad

    # Construct the URL using the provided search query.
    url = (
        "https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country=US&is_targeted_country=false"
        f"&media_type=all&q={search_query}&search_type=keyword_unordered"
    )

    async with async_playwright() as p:
        # Launch Chromium in headless mode.
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        # Navigate to the URL with a 60-second timeout.
        await page.goto(url, timeout=60000)

        # Scroll multiple times to load dynamic content.
        for _ in range(5):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(2)

        # Select all ad containers using the confirmed container class "xh8yej3".
        ad_elements = await page.query_selector_all('div.xh8yej3')

        # Process each ad element, limiting results to 10.
        for elem in ad_elements:
            # Limit output to 10 ads for testing.
            if len(results) >= 10:
                break

            ad_data = {}

            # Extract Brand Name from a <div> with classes _8nsi _8nqp _a25w.
            brand_elem = await elem.query_selector("div._8nsi._8nqp._a25w")
            ad_data["brand"] = await brand_elem.inner_text() if brand_elem else None

            # Extract Ad Copy from a <div> with classes _7jyr _a25.
            ad_copy_elem = await elem.query_selector("div._7jyr._a25")
            ad_data["ad_copy"] = await ad_copy_elem.inner_text() if ad_copy_elem else None

            # Extract CTA from a <div> with class x2lah0s.
            cta_elem = await elem.query_selector("div.x2lah0s")
            ad_data["cta"] = await cta_elem.inner_text() if cta_elem else None

            # Extract Video Link from a <video> element with classes x1lliihq x5yr21d xh8yej3.
            video_elem = await elem.query_selector("video.x1lliihq.x5yr21d.xh8yej3")
            ad_data["video"] = await video_elem.get_attribute("src") if video_elem else None

            results.append(ad_data)

        # Close the browser.
        await browser.close()
    return results

# Synchronous wrapper to run the asynchronous function.
def run_facebook_scraper(search_query: str):
    return asyncio.run(scrape_facebook_ads(search_query))

if __name__ == "__main__":
    # For testing purposes, we use 'shapewear' as the search query.
    ads_data = run_facebook_scraper("shapewear")

    # Print the extracted fields for each ad.
    print("Scraped Facebook Ads:")
    for ad in ads_data:
        print("Video Link:", ad["video"])
        print("Brand Name:", ad["brand"])
        print("Ad Copy:", ad["ad_copy"])
        print("CTA:", ad["cta"])
        print("---------------------")
