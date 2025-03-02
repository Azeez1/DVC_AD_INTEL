// File: facebook_ads_actor.js
// Description: This actor calls your JSON API endpoint, limits results, transforms each ad
// into an object with key fields (with separate arrays for images and videos), and pushes the data to the dataset.

// Replace API_URL with your actual working endpoint.
const API_URL = 'https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/run-sync?token=apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8';

const Apify = require('apify');

Apify.main(async () => {
    // Get input parameters (defaults provided)
    const input = await Apify.getInput() || {};
    const searchQuery = input.searchQuery || 'shapewear';
    const count = input.count || 20;

    // Construct the API URL using your endpoint and the search query.
    const apiUrl = `${API_URL}?q=${encodeURIComponent(searchQuery)}`;

    // Make an HTTP request to the JSON API.
    const response = await Apify.utils.requestAsBrowser({
        url: apiUrl,
        headers: {
            // Add any necessary headers (e.g., Authorization) if required.
        },
    });

    // Parse the JSON response.
    let jsonData;
    try {
        jsonData = JSON.parse(response.body);
    } catch (error) {
        throw new Error(`Failed to parse JSON from API response: ${error}`);
    }

    // Limit the results to the specified count.
    // Enforce strict limit of 'count' (default 20) by slicing the data appropriately.
    let adsArray = Array.isArray(jsonData)
        ? jsonData.slice(0, count)
        : (jsonData.results && Array.isArray(jsonData.results))
            ? jsonData.results.slice(0, count)
            : [];

    // Log if we've reached the ad limit.
    if (adsArray.length >= count) {
        console.log(`Reached the ad limit of ${count}. Stopping extraction.`);
    }

    // Transform each ad into an object with only the key fields.
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

    // Push only the first 'count' ads to the dataset.
    await Apify.pushData(transformedData.slice(0, count));
    console.log(`Transformed API data stored successfully. Ads stored: ${transformedData.length}`);

}); // <-- This closing bracket and parenthesis close the Apify.main() callback.
