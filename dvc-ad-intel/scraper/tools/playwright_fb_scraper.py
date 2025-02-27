import asyncio
from playwright.async_api import async_playwright


# Asynchronously scrape Facebook Ads Library for a given search query.
async def scrape_facebook_ads(search_query: str):
    results = [
    ]  # This will hold dictionaries for each ad with our extracted fields.

    # Construct the URL using the provided search query.
    url = (
        "https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country=US&is_targeted_country=false"
        f"&media_type=all&q={search_query}&search_type=keyword_unordered")

    async with async_playwright() as p:
        # Launch Chromium in headless mode.
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, timeout=60000)

        # Scroll several times to load dynamic content.
        for _ in range(5):
            await page.evaluate(
                "window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(2)

        # Select all ad containers using the confirmed class.
        ad_elements = await page.query_selector_all('div.xh8yej3')

        # Process each ad element.
        for elem in ad_elements:
            ad_data = {}

            # Extract video link if a <video> element exists.
            video_elem = await elem.query_selector("video")
            if video_elem:
                ad_data["video"] = await video_elem.get_attribute("src")
            else:
                ad_data["video"] = None

            # Extract brand name from an <a> element.
            # (Adjust the selector if needed; here we assume the brand name is in an <a> with class "xt0psk2")
            brand_elem = await elem.query_selector("a.xt0psk2")
            if brand_elem:
                ad_data["brand"] = await brand_elem.inner_text()
            else:
                ad_data["brand"] = None

            # Extract ad copy.
            # Here we try to extract text from a <div> that might contain the main ad description.
            # You may need to refine this selector based on the page's structure.
            ad_copy_elem = await elem.query_selector("div.x6s0dn4")
            if ad_copy_elem:
                ad_data["ad_copy"] = await ad_copy_elem.inner_text()
            else:
                # Fallback: get all text of the element.
                ad_data["ad_copy"] = await elem.inner_text()

            # Extract the CTA (Call To Action) text.
            # We use a text selector to find an element containing "Shop now".
            cta_elem = await elem.query_selector("text=Shop now")
            if cta_elem:
                ad_data["cta"] = await cta_elem.inner_text()
            else:
                ad_data["cta"] = None

            results.append(ad_data)

        await browser.close()
    return results


# Synchronous wrapper to run the asynchronous function.
def run_facebook_scraper(search_query: str):
    return asyncio.run(scrape_facebook_ads(search_query))


if __name__ == "__main__":
    # Test with 'shapewear' as the search query.
    ads_data = run_facebook_scraper("shapewear")

    # Print the extracted data for each ad.
    print("Scraped Facebook Ads:")
    for ad in ads_data:
        print("Video Link:", ad["video"])
        print("Brand Name:", ad["brand"])
        print("Ad Copy:", ad["ad_copy"])
        print("CTA:", ad["cta"])
        print("---------------------")
