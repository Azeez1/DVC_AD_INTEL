// File: trigger_actor.js
// Description: Updated to be an exact match to the working approach in facebook_ads_actor.js

const https = require('https');
const Apify = require('apify');

// Use the exact same API URL as in the working script
const API_URL = 'https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/run-sync?token=apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8';

// Prepare the input parameters (same as facebook_ads_actor.js)
const searchQuery = 'shapewear';
const count = 20;

// Main function
(async () => {
    try {
        // Construct the API URL using your endpoint and the search query 
        // (exactly as in facebook_ads_actor.js)
        const apiUrl = `${API_URL}&q=${encodeURIComponent(searchQuery)}`;

        console.log(`Making request to: ${apiUrl}`);

        // Make an HTTP request to the JSON API (exactly as in facebook_ads_actor.js)
        const response = await Apify.utils.requestAsBrowser({
            url: apiUrl,
            headers: {
                // Empty headers object, just like in facebook_ads_actor.js
            },
        });

        console.log(`Response status: ${response.statusCode}`);

        // Parse the JSON response (exactly as in facebook_ads_actor.js)
        let jsonData;
        try {
            jsonData = JSON.parse(response.body);
        } catch (error) {
            throw new Error(`Failed to parse JSON from API response: ${error}`);
        }

        // Limit the results to the specified count (exactly as in facebook_ads_actor.js)
        if (Array.isArray(jsonData)) {
            jsonData = jsonData.slice(0, count);
        } else if (jsonData.results && Array.isArray(jsonData.results)) {
            jsonData.results = jsonData.results.slice(0, count);
        }

        // Safely extract the ads array (exactly as in facebook_ads_actor.js)
        const adsArray = Array.isArray(jsonData) ? jsonData : (jsonData.results || []);

        // Transform the data into key fields (exactly as in facebook_ads_actor.js)
        const transformedData = adsArray.map(item => ({
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

        console.log('Results:');
        console.dir(transformedData, { depth: null });

    } catch (error) {
        console.error('Error:', error);
    }
})();