// File: trigger_actor_sync.js
// Description: This script triggers the actor synchronously using the default endpoint
// and the runSync options, then prints the dataset items.

const { ApifyClient } = require('apify-client');

// Initialize the ApifyClient with your API token (dummy token used here).
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
        // Trigger the actor synchronously.
        const run = await client.actor("curious_coder/facebook-ads-library-scraper").call(input, {
            runSync: true,
            waitSecs: 300
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
