// File: facebook_ads_actor.js
// Description: This actor calls your JSON API endpoint to fetch ad data based on a search query,
// limits the results to a specified count, transforms each ad to include only the key fields (with full arrays
// for images and videos), and pushes the transformed data into Apify's default dataset.

// Replace the API_URL below with your actual working endpoint.
const API_URL = 'https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/run-sync?token=apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8';

const Apify = require('apify');

Apify.main(async () => {
    // 1. Get input parameters from Apify input (if provided) or use defaults.
    const input = await Apify.getInput() || {};
    const searchQuery = input.searchQuery || 'shapewear';
    const count = input.count || 20; // Default: limit to 20 items

    // 2. Construct the API URL using your endpoint and the search query.
    const apiUrl = `${API_URL}?q=${encodeURIComponent(searchQuery)}`;

    // 3. Make an HTTP request to the JSON API.
    //    requestAsBrowser() mimics a browser request (useful if the API requires a browser-like header).
    const response = await Apify.utils.requestAsBrowser({
        url: apiUrl,
        headers: {
            // Add any necessary headers (e.g., Authorization) if required.
        },
    });

    // 4. Parse the JSON response.
    let jsonData;
    try {
        jsonData = JSON.parse(response.body);
    } catch (error) {
        throw new Error(`Failed to parse JSON from API response: ${error}`);
    }

    // 5. Limit the results to the specified count.
    if (Array.isArray(jsonData)) {
        jsonData = jsonData.slice(0, count);
    } else if (jsonData.results && Array.isArray(jsonData.results)) {
        jsonData.results = jsonData.results.slice(0, count);
    }

    // 6. Transform the data to extract key fields.
    //    This mapping creates an object for each ad with:
    //    - searchUrl: the URL used for the API call,
    //    - adUrl: the dedicated ad URL if available,
    //    - pageName and pageUrl,
    //    - publishedPlatform,
    //    - adTitle, adCTAText, adCTALink,
    //    - adImages: all images (for carousel ads),
    //    - adVideos: all videos,
    //    - adText: the descriptive ad text.
    const adsArray = Array.isArray(jsonData) ? jsonData : jsonData.results;
    const transformedData = adsArray.map(item => {
        return {
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
        };
    });

    // 7. Push the transformed data into Apify's default dataset.
    await Apify.pushData(transformedData);

    console.log('Transformed API data stored successfully.');
});
