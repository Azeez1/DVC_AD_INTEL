// File: trigger_actor.js
// Description: Debug version to understand differences between execution environments

const Apify = require('apify');
const fs = require('fs');

// Use the exact same API URL as in the working script
const API_URL = 'https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/run-sync?token=apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8';

// Prepare the input parameters
const searchQuery = 'shapewear';
const count = 20;

// Main function
(async () => {
    try {
        console.log('=== ENVIRONMENT INFO ===');
        console.log('Node version:', process.version);
        console.log('Working directory:', process.cwd());
        console.log('Apify version:', Apify.getEnv().apifyClientVersion);
        console.log('========================');

        // Check if we can access the Apify token from environment
        console.log('APIFY_TOKEN in env:', !!process.env.APIFY_TOKEN);

        // Construct the API URL
        const apiUrl = `${API_URL}&q=${encodeURIComponent(searchQuery)}`;
        console.log(`Making request to: ${apiUrl}`);

        // Make HTTP request with detailed logging
        console.log('Sending request...');
        const response = await Apify.utils.requestAsBrowser({
            url: apiUrl,
            headers: {},
            timeoutSecs: 60, // Increase timeout
        });

        console.log(`Response status: ${response.statusCode}`);
        console.log('Response headers:', response.headers);

        // Save the raw response for inspection
        if (response.body) {
            fs.writeFileSync('response_body.txt', response.body);
            console.log('Saved raw response to response_body.txt');

            // If it's a short response, log it directly
            if (response.body.length < 1000) {
                console.log('Response body:', response.body);
            }
        }

        // If response is a 400, try a simpler request
        if (response.statusCode === 400) {
            console.log('\n=== TRYING ALTERNATIVE REQUEST ===');
            // Try a simpler API call without search parameters
            const simpleResponse = await Apify.utils.requestAsBrowser({
                url: 'https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper?token=apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8',
                headers: {},
            });

            console.log(`Simple API call status: ${simpleResponse.statusCode}`);

            if (simpleResponse.body) {
                // Try to parse to see the actor metadata
                try {
                    const actorInfo = JSON.parse(simpleResponse.body);
                    console.log('Actor info:', JSON.stringify(actorInfo, null, 2));
                } catch (e) {
                    console.log('Could not parse actor info');
                    console.log('Simple response body:', simpleResponse.body);
                }
            }
        }

        // Try to parse the original response
        let jsonData;
        try {
            jsonData = JSON.parse(response.body);
            console.log('Successfully parsed JSON response');
        } catch (error) {
            console.error(`Failed to parse JSON from API response: ${error}`);
            return;
        }

        // Process data similar to the original script
        // Limit the results to the specified count
        if (Array.isArray(jsonData)) {
            jsonData = jsonData.slice(0, count);
        } else if (jsonData.results && Array.isArray(jsonData.results)) {
            jsonData.results = jsonData.results.slice(0, count);
        }

        // Safely extract the ads array
        const adsArray = Array.isArray(jsonData) ? jsonData : (jsonData.results || []);
        console.log(`Found ${adsArray.length} ads in the response`);

        // Transform the data
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

        console.log('Results:', transformedData.length > 0 ? 'Data found' : 'No data found');
        if (transformedData.length > 0) {
            console.dir(transformedData[0], { depth: null });
        }

    } catch (error) {
        console.error('Error:', error);
    }
})();