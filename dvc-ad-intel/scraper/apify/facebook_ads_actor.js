const Apify = require('apify');

Apify.main(async () => {
    // Retrieve input from the Apify UI.
    // Expect properties like urls, searchTerms, and limit. Default limit is 20.
    const input = await Apify.getInput() || {};
    const limit = input.limit || 20;

    // Ensure there is at least one URL to scrape.
    if (!input.urls) {
        input.urls = [{
            url: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=%22shapewear%22&search_type=keyword_exact_phrase"
        }];
    }

    // Create a RequestQueue and add each URL.
    const requestQueue = await Apify.openRequestQueue();
    for (const urlObj of input.urls) {
        await requestQueue.addRequest({ url: urlObj.url });
    }

    // Global array to store the collected ads.
    const collectedAds = [];

    // Define the page handling function.
    const handlePageFunction = async ({ $, request }) => {
        // Check before processing this page if we already have enough ads.
        if (collectedAds.length >= limit) {
            console.log(`Limit of ${limit} ads already reached. Skipping page: ${request.url}`);
            return;
        }

        // Extract ads from the page.
        // (Update the selectors below to match your target page.)
        const adsOnPage = [];
        $('.ad-container').each((index, el) => {
            // If we already reached the limit, stop adding more.
            if (collectedAds.length + adsOnPage.length >= limit) {
                return false; // Exit the each() loop early.
            }
            const ad = {
                url: $(el).find('a').attr('href'),
                pageName: $(el).find('.page-name').text().trim(),
                // Add other fields as needed...
            };
            adsOnPage.push(ad);
        });
        console.log(`Found ${adsOnPage.length} ads on page: ${request.url}`);

        // Add extracted ads to our global collection.
        collectedAds.push(...adsOnPage);

        // If after processing this page we reached (or exceeded) the limit,
        // clear the remaining requests to stop further scraping.
        if (collectedAds.length >= limit) {
            console.log(`Reached the limit of ${limit} ads. Dropping remaining requests.`);
            await requestQueue.drop();
        }
    };

    // Create and run a CheerioCrawler with our custom page function.
    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        maxConcurrency: 5,
        handlePageFunction,
        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed too many times.`);
        },
    });

    await crawler.run();

    // Trim the collected ads array in case it slightly exceeded the limit.
    const finalAds = collectedAds.slice(0, limit);

    // Push the final set of ads to the default dataset.
    await Apify.pushData(finalAds);
    console.log(`Scraping finished. Collected ${finalAds.length} ads (limit was ${limit}).`);
});
