// File: trigger_actor.js
// Description: This script triggers the actor "curious_coder/facebook-ads-library-scraper"
// with the correct input format including the required "urls" field

const { ApifyClient } = require('apify-client');

// Initialize the ApifyClient with your API token
const client = new ApifyClient({
    token: 'apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8',
});

// Prepare the actor input with the required "urls" field
// Format the input according to the actor's expected format
const input = {
    urls: [
        `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=${encodeURIComponent("shapewear")}&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped&search_type=keyword_unordered`
    ],
    maxPagesPerSearch: 5,   // Limit the number of pages to scrape
    maxAdsPerPage: 20,      // Limit the number of ads per page
    extendOutputFunction: "",
    language: "en-US"
};

(async () => {
    try {
        // Run the actor and wait for it to finish
        console.log('Starting actor run with the following input:');
        console.log(JSON.stringify(input, null, 2));

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