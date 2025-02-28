// File: trigger_actor_sync.js
// Description: This script triggers the actor "curious_coder/facebook-ads-library-scraper"
// synchronously (using the "sync" option) and prints the resulting dataset items.

const { ApifyClient } = require('apify-client');

// Initialize the ApifyClient with your API token (dummy token used here).
const client = new ApifyClient({
    token: 'apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8', // Replace with your real token.
});

// Prepare the actor input.
const input = {
    searchQuery: "shapewear",
    count: 20
};

(async () => {
    try {
        // Trigger the actor synchronously using the "sync" option.
        const run = await client.actor("curious_coder/facebook-ads-library-scraper").call(input, {
            sync: true,
            waitSecs: 300  // Wait up to 300 seconds for the run to finish.
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
