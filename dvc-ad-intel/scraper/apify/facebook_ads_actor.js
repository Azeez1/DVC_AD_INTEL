const Apify = require('apify');

Apify.main(async () => {
    // Retrieve input from the Apify UI.
    // Expect input.limit (default 20) along with input.urls.
    const input = await Apify.getInput() || {};
    const limit = input.limit || 20;

    // Ensure at least one URL is provided.
    if (!input.urls) {
        input.urls = [{
            url: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=%22shapewear%22&search_type=keyword_exact_phrase"
        }];
    }

    // Open a request queue and add each URL.
    const requestQueue = await Apify.openRequestQueue();
    for (const urlObj of input.urls) {
        await requestQueue.addRequest({ url: urlObj.url });
    }

    // Global array to store the collected ads.
    const collectedAds = [];

    // Define a function to extract ads from the page.
    // Update these selectors to match the actual page structure.
    const extractAds = ($) => {
        const ads = [];
        $('.ad-container').each((index, el) => {
            const ad = {
                url: $(el).find('a').attr('href'),
                pageName: $(el).find('.page-name').text().trim(),
                // Extract other fields as needed.
            };
            ads.push(ad);
        });
        return ads;
    };

    // Create a CheerioCrawler.
    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        maxConcurrency: 5,
        handlePageFunction: async ({ $, request }) => {
            console.log(`Processing page: ${request.url}`);

            // Extract ads from the page.
            const adsOnPage = extractAds($);
            console.log(`Found ${adsOnPage.length} ads on page: ${request.url}`);

            // Add all ads from this page to our collection.
            collectedAds.push(...adsOnPage);

            // After processing this page, check if we've reached the limit.
            if (collectedAds.length >= limit) {
                console.log(`Collected ${collectedAds.length} ads (limit is ${limit}). Dropping remaining requests.`);
                // Drop any remaining requests in the queue to stop further processing.
                await requestQueue.drop();
            }
        },
        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed.`);
        },
    });

    // Run the crawler.
    await crawler.run();

    // Trim the collected ads array in case it slightly exceeded the limit.
    const finalAds = collectedAds.slice(0, limit);
    await Apify.pushData(finalAds);
    console.log(`Scraping finished. Collected ${finalAds.length} ads (limit was ${limit}).`);
});
