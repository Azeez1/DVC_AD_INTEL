// File: trigger_actor.js
// Description: This script triggers the actor "curious_coder/facebook-ads-library-scraper"
// using the standard run method and retrieves dataset items.

const { ApifyClient } = require('apify-client');

// Initialize the ApifyClient with your API token
const client = new ApifyClient({
    token: 'apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8',
});

// Prepare the actor input.
const input = {
    searchQuery: "shapewear",
    count: 20
};

(async () => {
    try {
        // Run the actor and wait for it to finish
        console.log('Starting actor run...');
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