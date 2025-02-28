// File: simplified_trigger.js
// Description: Minimalistic script to try running the Facebook Ads Library scraper with URL validation

const { ApifyClient } = require('apify-client');

// Initialize the ApifyClient with your API token
const client = new ApifyClient({
    token: 'apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8',
});

// A simpler input with just a single, properly formatted URL
// Using the exact format from the example in the screenshot
const input = {
    urls: [
        "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is"
    ]
};

// Function to validate a URL
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

(async () => {
    try {
        // First, check if the URL is valid according to the URL constructor
        const url = input.urls[0];
        if (!isValidURL(url)) {
            console.error(`URL validation failed for: ${url}`);
            console.error('The URL appears to be malformed. Please check the format.');
            return;
        }

        console.log(`URL validation passed for: ${url}`);
        console.log('Starting actor run with minimal input...');

        // Try running with minimal input
        const run = await client.actor("curious_coder/facebook-ads-library-scraper").call(input);

        console.log('Actor run finished successfully.');
        console.log('Run ID:', run.id);

        // Get results
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log(`Retrieved ${items.length} results.`);

    } catch (error) {
        console.error('Error running actor:', error);

        // Try to extract more information from the error
        if (error.message && error.message.includes('invalid-input')) {
            console.error('\nThe input validation is failing. Please try using the Apify web interface directly.');
            console.error('Copy this URL:');
            console.error(input.urls[0]);
            console.error('And paste it into the URLs field in the Apify web interface.');
        }
    }
})();