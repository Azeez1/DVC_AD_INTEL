// File: trigger_actor.js
// Description: This script triggers the Facebook Ad Library Scraper using the correct URL format

const { ApifyClient } = require('apify-client');

// Initialize the ApifyClient with your API token
const client = new ApifyClient({
    token: 'apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8',
});

// The input format matching exactly what's shown in the screenshot
// Notice the URL format is different from what we were using before
const input = {
    "urls": [
        "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=shapewear"
    ],
    "scrapeAdDetails": true,
    "maxPagesPerSearch": 5,
    "totalNumberOfRecordsRequired": 20
};

(async () => {
    try {
        // Run the actor and wait for it to finish
        console.log('Starting actor run with the following input:');
        console.log(JSON.stringify(input, null, 2));

        // Make sure we're using the correct actor ID based on the screenshot
        const run = await client.actor("curious_coder/facebook-ads-library-scraper").call(input);

        console.log('Actor run finished successfully.');
        console.log('Run ID:', run.id);

        // Now get the dataset items from the run
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        console.log('Dataset items from the actor run:');
        console.dir(items, { depth: null });
    } catch (error) {
        console.error('Error running actor:', error);
    }
})();