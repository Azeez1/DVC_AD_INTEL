// File: facebook_ads_actor.js
// Description: This actor sends a POST request to your JSON API endpoint (facebook-ads-library-scraper)
// using the full input JSON provided via Apify.getInput() (which includes parameters like urls, searchTerms, etc.).
// It limits the number of ads to a specified count, transforms each ad into an object with key fields,
// and pushes the transformed data to the default dataset.

const API_URL = 'https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/run-sync?token=apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8';

const Apify = require('apify');

Apify.main(async () => {
    // Retrieve input from the Apify UI.
    // Expected input may include properties like urls, searchTerms, countryCode, adActiveStatus, adType, etc.
    const input = await Apify.getInput() || {};

    // Set default values if not provided via input.
    const searchQuery = input.searchQuery || 'shapewear';
    const count = input.count || 20;

    // If the input doesn't already include required parameters, add them.
    if (!input.urls) {
        input.urls = [{
            url: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=%22shapewear%22&search_type=keyword_exact_phrase"
        }];
    }
    if (!input.searchTerms) {
        input.searchTerms = [searchQuery];
    }
    if (!input.countryCode) {
        input.countryCode = "US";
    }
    if (!input.adActiveStatus) {
        input.adActiveStatus = "active";
    }
    if (!input.adType) {
        input.adType = "all";
    }
    // *** New addition ***: If the actor supports a limit parameter, add it to the input.
    if (!input.limit) {
        input.limit = count;
    }

    // Convert the full input to a JSON string to be used as the POST payload.
    const postData = JSON.stringify(input);

    // Make a POST request to the API endpoint with the full input payload.
    const response = await Apify.utils.requestAsBrowser({
        url: API_URL,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: postData
    });

    // Parse the JSON response from the API.
    let jsonData;
    try {
        jsonData = JSON.parse(response.body);
    } catch (error) {
        throw new Error(`Failed to parse JSON from API response: ${error}`);
    }

    // Limit the results to the specified count.
    // The API might return the data directly as an array or nested in a "results" field.
    let adsArray = Array.isArray(jsonData)
        ? jsonData.slice(0, count)
        : (jsonData.results && Array.isArray(jsonData.results))
            ? jsonData.results.slice(0, count)
            : [];

    // Log if we've reached the ad limit.
    if (adsArray.length >= count) {
        console.log(`Reached the ad limit of ${count}. Stopping extraction.`);
    }

    // Transform each ad into an object with key fields.
    const transformedData = adsArray.map(item => ({
        // The searchUrl here is set as the API_URL (can be customized as needed).
        searchUrl: API_URL,
        adUrl: item.url || API_URL,
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
});
