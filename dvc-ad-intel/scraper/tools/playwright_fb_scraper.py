import asyncio
from playwright.async_api import async_playwright


# Asynchronously scrape Facebook Ads Library for a given search query.
async def scrape_facebook_ads(search_query: str):
    results = []  # List to store extracted ad data (each ad is a dictionary).

    # Construct the URL using the provided search query.
    # This URL filters for active ads, all types, in the US, etc.
    url = (
        "https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country=US&is_targeted_country=false"
        f"&media_type=all&q={search_query}&search_type=keyword_unordered")

    async with async_playwright() as p:
        # Launch Chromium in headless mode (no visible browser window).
        browser = await p.chromium.launch(headless=True)
        # Create a new page (tab).
        page = await browser.new_page()
        # Navigate to the constructed URL with a timeout of 60 seconds.
        await page.goto(url, timeout=60000)

        # Scroll the page several times to load dynamic content.
        for _ in range(5):
            await page.evaluate(
                "window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(2)  # Wait 2 seconds for new content to load.

        # Select ad containers. (Here we use the container class "xh8yej3", which you confirmed earlier.)
        ad_elements = await page.query_selector_all('div.xh8yej3')

        # Process each ad element; limit to 5 ads.
        for elem in ad_elements:
            if len(results) >= 5:
                break

            ad_data = {}

            # Extract Brand Name from a <div> with classes "x1rg5ohu x67bb7w".
            brand_elem = await elem.query_selector("div.x1rg5ohu.x67bb7w")
            ad_data["brand"] = await brand_elem.inner_text(
            ) if brand_elem else None

            # Extract Ad Copy from a <div> with classes "_4ik4 _4ik5".
            ad_copy_elem = await elem.query_selector("div._4ik4._4ik5")
            ad_data["ad_copy"] = await ad_copy_elem.inner_text(
            ) if ad_copy_elem else None

            # Extract CTA from a <div> with classes
            # "x8t9es0 x1fvot60 xxio538 x1heor9g xuxw1ft x6ikm8r x10wlt62 xlyipyv x1h4wwuj x1pd3egz xeuugli".
            cta_elem = await elem.query_selector(
                "div.x8t9es0.x1fvot60.xxio538.x1heor9g.xuxw1ft.x6ikm8r.x10wlt62.xlyipyv.x1h4wwuj.x1pd3egz.xeuugli"
            )
            ad_data["cta"] = await cta_elem.inner_text() if cta_elem else None

            # Extract Video Link from a <video> element with classes "x5yr21d x1uhb9sk xh8yej3".
            video_elem = await elem.query_selector(
                "video.x5yr21d.x1uhb9sk.xh8yej3")
            ad_data["video"] = await video_elem.get_attribute(
                "src") if video_elem else None

            # Append the extracted ad data to the results list.
            results.append(ad_data)

        # Close the browser to free up resources.
        await browser.close()

    # Return the list of extracted ads.
    return results


# Synchronous wrapper to run the asynchronous scraping function.
def run_facebook_scraper(search_query: str):
    return asyncio.run(scrape_facebook_ads(search_query))


if __name__ == "__main__":
    # For testing purposes, the search query is hardcoded as "shapewear".
    ads_data = run_facebook_scraper("shapewear")

    # Print the extracted details for each ad.
    print("Scraped Facebook Ads:")
    for ad in ads_data:
        print("Video Link:", ad["video"])
        print("Brand Name:", ad["brand"])
        print("Ad Copy:", ad["ad_copy"])
        print("CTA:", ad["cta"])
        print("---------------------")
