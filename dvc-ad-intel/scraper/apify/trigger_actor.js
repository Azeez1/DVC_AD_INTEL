// File: trigger_actor_sync.js
// Description: This script triggers the "curious_coder/facebook-ads-library-scraper" actor
// synchronously using its run-sync-get-dataset-items endpoint, then retrieves and prints the dataset items.

const { ApifyClient } = require('apify-client');

// Initialize the ApifyClient with your dummy API token (replace with your real token).
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
        // Use the synchronous endpoint by appending it to the actor ID.
        const run = await client.actor("curious_coder/facebook-ads-library-scraper/run-sync-get-dataset-items").call(input);
        console.log('Dataset items from the actor run:');

        // Retrieve dataset items from the actor's default dataset.
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        items.forEach(item => {
            console.dir(item);
        });
    } catch (error) {
        console.error('Error running actor synchronously:', error);
    }
})();
