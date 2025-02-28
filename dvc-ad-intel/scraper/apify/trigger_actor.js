const { ApifyClient } = require('apify-client');

// 1. Initialize the ApifyClient with your API token
const client = new ApifyClient({
    token: 'apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8', // placeholder token
});

// 2. Prepare the actor input
const input = {
    urls: [
        {
            // The Facebook Ads Library URL for "shapewear"
            url: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=%22shapewear%22&search_type=keyword_exact_phrase"
        }
    ],
    count: 20,  // total number of records requested
};

(async () => {
    // 3. Trigger the actor with the specified input
    //    Replace the actor ID with your exact actor ID: "curious_coder/facebook-ads-library-scraper"
    const run = await client.actor("curious_coder/facebook-ads-library-scraper").call(input);

    console.log('Results from dataset:');
    // 4. Fetch items from the dataset the actor created
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    items.forEach((item) => {
        console.dir(item);
    });
})();
