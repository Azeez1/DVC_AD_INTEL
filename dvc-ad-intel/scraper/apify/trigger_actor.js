// File: trigger_actor_sync.js
// Description: This script triggers the actor "curious_coder/facebook-ads-library-scraper" synchronously
// using the "run-sync-get-dataset-items" endpoint and prints the resulting dataset items.

const { ApifyClient } = require('apify-client');

// Initialize the ApifyClient with your API token (replace the dummy token with your actual token).
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
        // Trigger the actor synchronously by calling the dedicated endpoint.
        const output = await client.actor("curious_coder/facebook-ads-library-scraper/run-sync-get-dataset-items").call(input);
        console.log('Dataset items from the actor run:');
        console.dir(output, { depth: null });
    } catch (error) {
        console.error('Error running actor synchronously:', error);
    }
})();
