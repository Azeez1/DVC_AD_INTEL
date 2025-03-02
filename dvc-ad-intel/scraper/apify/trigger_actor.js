// File: trigger_actor.js
// Description: This script sends an HTTPS POST request to the Apify API to trigger the actor
// "curious_coder/facebook-ads-library-scraper" synchronously. It sends valid input data and then
// prints the transformed ad data returned by the actor, while enforcing a strict limit of 20 ads.

const https = require('https');

// Define the search query and the maximum number of ads to process.
const searchQuery = 'shapewear';
const count = 20;

// Prepare the request data, including the complete URL with query parameters.
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

// Set up the request options for the Apify API call.
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

// Create and send the HTTPS request.
const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let responseData = '';

    // Collect data chunks as they arrive.
    res.on('data', (chunk) => {
        responseData += chunk;
    });

    // When the full response is received:
    res.on('end', () => {
        console.log('Response received');

        try {
            // Parse the response JSON.
            const jsonResponse = JSON.parse(responseData);

            // Check if the API returned an error.
            if (jsonResponse.error) {
                console.error('API returned an error:', jsonResponse.error);
                return;
            }

            // Determine the results array from the response.
            // The API might return the data directly as an array, or nested within a "results" field.
            let results = jsonResponse;
            if (!Array.isArray(jsonResponse) && !(jsonResponse.results && Array.isArray(jsonResponse.results))) {
                // If the structure is unexpected, default to an empty array.
                results = [];
            }

            // Use the proper array from the response.
            if (Array.isArray(jsonResponse)) {
                results = jsonResponse;
            } else if (jsonResponse.results && Array.isArray(jsonResponse.results)) {
                results = jsonResponse.results;
            }

            // Extract the ads array.
            let adsArray = Array.isArray(results) ? results : (results.results || []);
            console.log(`🔍 Total ads received from API: ${adsArray.length}`);

            // Immediately enforce the strict limit by slicing the array to only 'count' items.
            adsArray = adsArray.slice(0, count);
            console.log(`✅ Limiting to ${count} ads. Final count: ${adsArray.length}`);

            // Extra safeguard: in case adsArray still exceeds 'count', trim it again.
            if (adsArray.length > count) {
                console.log(`🚨 Too many ads detected (${adsArray.length}). Trimming to ${count}.`);
                adsArray = adsArray.slice(0, count);
            }

            // For further processing, assign the limited ads to limitedAds.
            const limitedAds = adsArray;
            console.log(`Final ads processed: ${limitedAds.length}/${count}`);

            // Transform each ad to include only the key fields.
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

            // Log the final transformed data.
            console.log('Transformed results:');
            console.dir(transformedData, { depth: null });

        } catch (e) {
            // Handle JSON parsing errors.
            console.error('Error parsing response:', e);
            console.log('Raw response:', responseData);
        }
    });
});

// Handle any request errors.
req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

// Write the postData to the request body and end the request.
req.write(postData);
req.end();

console.log('Request sent, waiting for response...');
