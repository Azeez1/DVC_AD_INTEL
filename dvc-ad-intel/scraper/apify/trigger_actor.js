// File: trigger_actor_sync.js
// Description: This client script triggers the actor "curious_coder/facebook-ads-library-scraper"
// synchronously using Apify's run-sync-get-dataset-items endpoint and prints the resulting dataset items.

const { ApifyClient } = require('apify-client');

// Initialize the ApifyClient with a dummy API token (replace with your real token).
const client = new ApifyClient({
    token: 'apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8', // Dummy API token placeholder.
});

// Prepare the actor input (JSON).
const input = {
    searchQuery: "shapewear",
    count: 20
};

(async () => {
    try {
        // Trigger the actor synchronously.
        // Using runSync options allows the call to wait until the actor run finishes.
        const run = await client.actor("curious_coder/facebook-ads-library-scraper").call(input, {
            runSync: true,
            waitSecs: 300 // Wait up to 300 seconds for the run to finish.
        });

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
