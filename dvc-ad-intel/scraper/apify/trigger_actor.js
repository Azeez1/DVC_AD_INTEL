// File: trigger_actor.js
// Description: Updated script to match the approach used in the working facebook_ads_actor.js

const { ApifyClient } = require('apify-client');
const https = require('https');

// Initialize the ApifyClient with your API token (kept for potential use)
const client = new ApifyClient({
    token: 'apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8',
});

// Use the same API URL structure that works in facebook_ads_actor.js
const API_URL = 'https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/run-sync?token=apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8';

// Prepare the actor input - notice we're using 'q' parameter directly in the URL
const searchQuery = "shapewear";
const count = 20;

// Function to make a direct API request similar to facebook_ads_actor.js
function fetchAdsFromApify() {
    return new Promise((resolve, reject) => {
        // Construct the API URL with the search query
        const apiUrl = `${API_URL}&q=${encodeURIComponent(searchQuery)}`;

        console.log(`Making API request to: ${apiUrl}`);

        // Use similar request approach as facebook_ads_actor.js
        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(apiUrl, options, (res) => {
            let data = '';

            // Log response status
            console.log(`Response status code: ${res.statusCode}`);

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    console.error('Error parsing response:', error);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });

        req.end();
    });
}

// Process the data similar to facebook_ads_actor.js
function processResults(jsonData) {
    // Limit the results to the specified count
    if (Array.isArray(jsonData)) {
        jsonData = jsonData.slice(0, count);
    } else if (jsonData.results && Array.isArray(jsonData.results)) {
        jsonData.results = jsonData.results.slice(0, count);
    }

    // Extract the ads array
    const adsArray = Array.isArray(jsonData) ? jsonData : (jsonData.results || []);

    console.log(`Processing ${adsArray.length} ads`);

    // Transform the data into key fields (same as in facebook_ads_actor.js)
    return adsArray.map(item => ({
        searchUrl: apiUrl,
        adUrl: item.url || apiUrl,
        pageName: item.page_name,
        pageUrl: (item.snapshot && item.snapshot.page_profile_uri) || item.page_profile_uri,
        publishedPlatform: item.publisher_platform,
        adTitle: item.snapshot && item.snapshot.title,
        adCTAText: item.snapshot && item.snapshot.cta_text,
        adCTALink: item.snapshot && item.snapshot.link_url,
        adImages: (item.snapshot && item.snapshot.images) ? item.snapshot.images : [],
        adVideos: (item.snapshot && item.snapshot.videos) ? item.snapshot.videos : [],
        adText: item.snapshot && item.snapshot.body && item.snapshot.body.text
    }));
}

// Main function
(async () => {
    try {
        console.log(`Searching for "${searchQuery}" ads with limit ${count}...`);

        // Fetch data using direct API approach
        const jsonData = await fetchAdsFromApify();

        // Process the data
        const transformedData = processResults(jsonData);

        console.log('Results:');
        console.dir(transformedData, { depth: null });

    } catch (error) {
        console.error('Error running actor:', error);
    }
})();