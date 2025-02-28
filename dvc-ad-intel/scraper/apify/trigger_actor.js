// File: trigger_actor.js
// Description: Basic HTTPS POST request to the Apify API with a simplified, properly formatted URL

const https = require('https');

// Prepare the search query and other parameters
const searchQuery = 'shapewear';
const count = 20;

// Prepare the request data with a simpler URL format
// The API appears to be very strict about URL validation
const postData = JSON.stringify({
    urls: [
        // Use a simple URL without query parameters that might be causing validation issues
        "https://www.facebook.com/ads/library"
    ],
    // Add additional parameters separately instead of in the URL
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

            // Limit the results to the specified count
            let results = jsonResponse;
            if (Array.isArray(jsonResponse)) {
                results = jsonResponse.slice(0, count);
            } else if (jsonResponse.results && Array.isArray(jsonResponse.results)) {
                results = jsonResponse.results.slice(0, count);
            }

            // Extract the ads array
            const adsArray = Array.isArray(results) ? results : (results.results || []);
            console.log(`Found ${adsArray.length} ads in the response`);

            // Transform the data into key fields
            const transformedData = adsArray.map(item => ({
                searchUrl: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${searchQuery}`,
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