import asyncio
from playwright.async_api import async_playwright

# Asynchronously scrape Facebook Ads Library for a given search query.
async def scrape_facebook_ads(search_query: str):
    results = []  # List to store extracted ad data for each ad.

    # Construct the URL with the provided search query.
    url = (
        "https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country=US&is_targeted_country=false"
        f"&media_type=all&q={search_query}&search_type=keyword_unordered"
    )

    async with async_playwright() as p:
        # Launch Chromium in headless mode (no graphical interface).
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        # Navigate to the constructed URL with a 60-second timeout.
        await page.goto(url, timeout=60000)
        # Wait for at least one ad container to appear.
        await page.wait_for_selector('div.xh8yej3', timeout=60000)
        # Select all ad containers using the generic container class "xh8yej3".
        ad_elements = await page.query_selector_all('div.xh8yej3')

        # Process each ad element, limiting output to 5 ads.
        for elem in ad_elements:
            if len(results) >= 5:
                break

            ad_data = {}

            # --- Extract Brand Name ---
            # Selector: an <a> element with classes:
            # "xt0psk2 x1hl2dhg xt0b8zv x8t9es0 x1fvot60 xxio538 xjnfcd9 xq9mrsl x1yc453h x1h4wwuj x1fcty0u"
            brand_elem = await elem.query_selector(
                "a.xt0psk2.x1hl2dhg.xt0b8zv.x8t9es0.x1fvot60.xxio538.xjnfcd9.xq9mrsl.x1yc453h.x1h4wwuj.x1fcty0u"
            )
            ad_data["brand"] = await brand_elem.inner_text() if brand_elem else None

            # --- Extract Ad Copy ---
            # Selector: a <div> with classes "_7jyr _a25-"
            ad_copy_elem = await elem.query_selector("div._7jyr._a25-")
            ad_data["ad_copy"] = await ad_copy_elem.inner_text() if ad_copy_elem else None

            # --- Extract CTA (Call To Action) ---
            # Selector: a <div> with classes:
            # "x8t9es0 x1fvot60 xxio538 x1heor9g xuxw1ft x6ikm8r x10wlt62 xlyipyv x1h4wwuj x1pd3egz xeuugli"
            cta_elem = await elem.query_selector(
                "div.x8t9es0.x1fvot60.xxio538.x1heor9g.xuxw1ft.x6ikm8r.x10wlt62.xlyipyv.x1h4wwuj.x1pd3egz.xeuugli"
            )
            ad_data["cta"] = await cta_elem.inner_text() if cta_elem else None

            # --- Extract Video Link ---
            # Selector: a <video> element with classes "x1lliihq x5yr21d xh8yej3"
            video_elem = await elem.query_selector("video.x1lliihq.x5yr21d.xh8yej3")
            ad_data["video"] = await video_elem.get_attribute("src") if video_elem else None

            results.append(ad_data)

        # Close the browser to free up resources.
        await browser.close()
    return results

# Synchronous wrapper to run the asynchronous scraping function.
def run_facebook_scraper(search_query: str):
    return asyncio.run(scrape_facebook_ads(search_query))

if __name__ == "__main__":
    # For testing, we use 'shapewear' as the search query.
    ads_data = run_facebook_scraper("shapewear")

    # Print the extracted details for each ad, with a divider.
    print("Scraped Facebook Ads:")
    for ad in ads_data:
        print("Brand Name:", ad["brand"])
        print("Ad Copy:", ad["ad_copy"])
        print("CTA:", ad["cta"])
        print("Video Link:", ad["video"])
        print("---------------------")
