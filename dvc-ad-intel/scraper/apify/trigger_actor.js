// File: trigger_actor.js
// Description: This script sends an HTTPS POST request to the Apify API to trigger the actor
// "curious_coder/facebook-ads-library-scraper" synchronously. It sends valid input data and then
// prints the transformed ad data returned by the actor.

const https = require('https');

// Prepare the search query and other parameters
const searchQuery = 'shapewear';
const count = 20;

// Prepare the request data with a complete, valid URL (including query parameters)
const postData = JSON.stringify({
    urls: [
        {
            url: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=%22shapewear%22&search_type=keyword_exact_phrase"
        }
    ],
    searchTerms: [searchQuery],
    countryCode: "US",
    adActiveStatus: "active",
    adType: "all"
});

// Request options for the API call
const options = {
    hostname: 'api.apify.com',
    path: '/v2/acts/curious_coder~facebook-ads-library-scraper/run-sync?token=apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log(`Making request to ${options.hostname}${options.path}`);
console.log('With data:', postData);

// Create and send the request
const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let responseData = '';

    // Collect data chunks
    res.on('data', (chunk) => {
        responseData += chunk;
    });

    // Process complete response
    res.on('end', () => {
        console.log('Response received');

        // Try to parse and pretty-print if it's JSON
        try {
            const jsonResponse = JSON.parse(responseData);

            // Check if the response contains an error
            if (jsonResponse.error) {
                console.error('API returned an error:', jsonResponse.error);
                return;
            }

            // Limit the final results to the specified count
            let results = jsonResponse;
            if (!Array.isArray(jsonResponse) && !(jsonResponse.results && Array.isArray(jsonResponse.results))) {
                // If not an array or doesn't have a results array, ensure results is empty or the correct structure
                results = [];
            }

            // If jsonResponse is an array, use it directly; otherwise use jsonResponse.results
            if (Array.isArray(jsonResponse)) {
                results = jsonResponse;
            } else if (jsonResponse.results && Array.isArray(jsonResponse.results)) {
                results = jsonResponse.results;
            }

            // Extract the ads array
            const adsArray = Array.isArray(results) ? results : (results.results || []);

            // Collect only up to "count" items
            const limitedAds = [];
            for (const item of adsArray) {
                if (limitedAds.length >= count) break;
                limitedAds.push(item);
            }
            console.log(`Found ${limitedAds.length} ads in the response`);

            // Transform the data into key fields
            const transformedData = limitedAds.map(item => ({
                searchUrl: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${searchQuery}&search_type=keyword_exact_phrase`,
                adUrl: item.url || '',
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

            console.log('Transformed results:');
            console.dir(transformedData, { depth: null });

        } catch (e) {
            // Not JSON or parsing error
            console.error('Error parsing response:', e);
            console.log('Raw response:', responseData);
        }
    });
});

// Handle request errors
req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();

console.log('Request sent, waiting for response...');
