// File: trigger_actor.js
// Description: Fixed script to properly call the Facebook Ads Library scraper

const Apify = require('apify');
const https = require('https');

// Define the base API URL
const API_BASE = 'https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/run-sync';
const API_TOKEN = 'apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8';

// Prepare the actor input
const searchQuery = 'shapewear';
const count = 20;

// Main function
(async () => {
    try {
        // Prepare the input object according to what the actor expects
        const inputObject = {
            urls: [
                `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${encodeURIComponent(searchQuery)}`
            ]
        };

        console.log('Sending request with input:', JSON.stringify(inputObject, null, 2));

        // Make an HTTP POST request with proper input format
        const response = await Apify.utils.requestAsBrowser({
            url: `${API_BASE}?token=${API_TOKEN}`,
            method: 'POST',
            body: JSON.stringify(inputObject),
            headers: {
                'Content-Type': 'application/json'
            },
            timeoutSecs: 60
        });

        console.log(`Response status: ${response.statusCode}`);

        // Parse the JSON response
        let jsonData;
        try {
            jsonData = JSON.parse(response.body);
            console.log('Successfully parsed JSON response');
        } catch (error) {
            console.error(`Failed to parse JSON from API response: ${error}`);
            console.log('Response body:', response.body);
            return;
        }

        // Process the response data
        // Limit the results to the specified count
        if (Array.isArray(jsonData)) {
            jsonData = jsonData.slice(0, count);
        } else if (jsonData.results && Array.isArray(jsonData.results)) {
            jsonData.results = jsonData.results.slice(0, count);
        }

        // Safely extract the ads array
        const adsArray = Array.isArray(jsonData) ? jsonData : (jsonData.results || []);
        console.log(`Found ${adsArray.length} ads in the response`);

        // Transform the data into key fields
        const transformedData = adsArray.map(item => ({
            searchUrl: inputObject.urls[0],
            adUrl: item.url || inputObject.urls[0],
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