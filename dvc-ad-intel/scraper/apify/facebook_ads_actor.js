// File: facebook_ads_actor.js
// Description: This actor calls your JSON API endpoint to fetch ad data based on a search query,
// limits the results, transforms each ad to include key fields (with full arrays for images and videos),
// and pushes the transformed data into Apify's default dataset.

// Replace API_URL with your actual working endpoint.
const API_URL = 'https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/run-sync?token=apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8';


const Apify = require('apify');

Apify.main(async () => {
    // 1. Get input parameters (if provided) or use defaults.
    const input = await Apify.getInput() || {};
    const searchQuery = input.searchQuery || 'shapewear';
    const count = input.count || 20; // Default: limit to 20 items

    // 2. Construct the API URL using your endpoint and the search query.
    const apiUrl = `${API_URL}?q=${encodeURIComponent(searchQuery)}`;

    // 3. Make an HTTP request to the JSON API.
    const response = await Apify.utils.requestAsBrowser({
        url: apiUrl,
        headers: {
            // Add any necessary headers (e.g., Authorization) if your API requires them.
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

    // 6. Transform the data:
    //    Safely extract the ads array (from jsonData directly or from jsonData.results),
    //    and map each ad into an object with only the key fields.
    const adsArray = Array.isArray(jsonData) ? jsonData : (jsonData.results || []);
    const transformedData = adsArray.map(item => ({
        searchUrl: apiUrl,                              // The URL used for the API call
        adUrl: item.url || apiUrl,                        // Dedicated ad URL (fallback to searchUrl)
        pageName: item.page_name,                         // The page name
        pageUrl: (item.snapshot && item.snapshot.page_profile_uri) || item.page_profile_uri, // The page URL
        publishedPlatform: item.publisher_platform,       // Platforms where the ad was published
        adTitle: item.snapshot && item.snapshot.title,    // The ad title
        adCTAText: item.snapshot && item.snapshot.cta_text,// Call-to-action text
        adCTALink: item.snapshot && item.snapshot.link_url,// Call-to-action link
        adImages: (item.snapshot && item.snapshot.images) ? item.snapshot.images : [], // All images (carousel ads)
        adVideos: (item.snapshot && item.snapshot.videos) ? item.snapshot.videos : [], // All videos (carousel ads)
        adText: item.snapshot && item.snapshot.body && item.snapshot.body.text // The ad's descriptive text
    }));

    // 7. Push the transformed data into Apify's default dataset.
    await Apify.pushData(transformedData);

    console.log('Transformed API data stored successfully.');
});
