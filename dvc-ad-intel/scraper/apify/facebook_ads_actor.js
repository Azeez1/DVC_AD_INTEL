// File: facebook_ads_actor.js

// Import the Apify SDK
const Apify = require('apify');

Apify.main(async () => {
    // -------------------------------
    // 1. Define the Input Parameters
    // -------------------------------
    // You can later modify this section to receive parameters via Apify input.
    const searchQuery = 'shapewear';  // The keyword to search for ads.

    // Construct the URL using the search query.
    // The URL points to the Facebook Ads Library with filtering parameters.
    const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=${encodeURIComponent(searchQuery)}&search_type=keyword_unordered`;

    // -------------------------------
    // 2. Set Up the Request Queue
    // -------------------------------
    // Apify's request queue manages the list of URLs to crawl.
    const requestQueue = await Apify.openRequestQueue();
    await requestQueue.addRequest({ url });

    // -------------------------------
    // 3. Configure the PlaywrightCrawler
    // -------------------------------
    // The crawler will navigate to pages, execute our scraping logic, and handle retries.
    const crawler = new Apify.PlaywrightCrawler({
        requestQueue,
        // Define launch options. Apify manages the browser instance for you.
        launchContext: {
            launchOptions: {
                headless: true,  // Run the browser in headless mode.
            },
        },
        // This function is called for each page the crawler visits.
        handlePageFunction: async ({ page, request, log }) => {
            log.info(`Processing ${request.url}`);

            // Wait for the ad container to appear. Adjust the selector and timeout as needed.
            await page.waitForSelector('div.xh8yej3', { timeout: 60000 });

            // Select all ad container elements.
            const adElements = await page.$$('div.xh8yej3');
            const results = [];

            // Loop through each ad element, processing up to 5 ads.
            for (let i = 0; i < Math.min(adElements.length, 5); i++) {
                const elem = adElements[i];
                const adData = {};

                // -------------------------------
                // 4. Extract Ad Data from the Page
                // -------------------------------
                // Extract Brand Name
                // We use a specific selector to capture the brand name from an <a> element.
                const brandElem = await elem.$("a.xt0psk2.x1hl2dhg.xt0b8zv.x8t9es0.x1fvot60.xxio538.xjnfcd9.xq9mrsl.x1yc453h.x1h4wwuj.x1fcty0u");
                adData.brand = brandElem ? await brandElem.innerText() : null;

                // Extract Ad Copy
                // This selector targets a <div> element containing the ad copy text.
                const adCopyElem = await elem.$("div._7jyr._a25-");
                adData.ad_copy = adCopyElem ? await adCopyElem.innerText() : null;

                // Extract CTA (Call To Action)
                // This selector targets the element showing the call-to-action text.
                const ctaElem = await elem.$("div.x8t9es0.x1fvot60.xxio538.x1heor9g.xuxw1ft.x6ikm8r.x10wlt62.xlyipyv.x1h4wwuj.x1pd3egz.xeuugli");
                adData.cta = ctaElem ? await ctaElem.innerText() : null;

                // Extract Video Link
                // If a video is present, this selector captures its source URL.
                const videoElem = await elem.$("video.x1lliihq.x5yr21d.xh8yej3");
                adData.video = videoElem ? await videoElem.getAttribute("src") : null;

                // Add the ad's data to the results array.
                results.push(adData);
            }

            // -------------------------------
            // 5. Store the Extracted Data
            // -------------------------------
            // Push the results into Apify's default dataset.
            await Apify.pushData({
                url: request.url,
                results,
            });
        },
        // -------------------------------
        // 6. Handle Failed Requests
        // -------------------------------
        // This function is called if a request fails after all retries.
        handleFailedRequestFunction: async ({ request, error }) => {
            console.error(`Request ${request.url} failed: ${error}`);
        },
    });

    // -------------------------------
    // 7. Run the Crawler
    // -------------------------------
    // Start the crawler. Once complete, the actor finishes.
    await crawler.run();
    console.log('Crawler finished.');
});
