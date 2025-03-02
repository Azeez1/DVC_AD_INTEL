
const Apify = require('apify');

Apify.main(async () => {
    try {
        console.log('Starting Facebook Ads Actor...');
        
        // You can specify your dataset ID here
        // If left empty, it will use the default dataset associated with the current actor run
        const datasetId = process.env.DATASET_ID || '';
        
        // Open the dataset from Apify storage
        const dataset = await Apify.openDataset(datasetId);
        console.log(`Opened dataset${datasetId ? ` with ID: ${datasetId}` : ' (default)'}`);
        
        // Retrieve all items from the dataset
        // You can adjust limit and offset if needed
        const { items } = await dataset.getData({ offset: 0, limit: 1000 });
        console.log(`Retrieved ${items.length} items from the dataset.`);
        
        // Check if items were returned
        if (items.length === 0) {
            console.warn('No items found in the dataset. Make sure your scraping job has produced data.');
            console.warn('Attempting to fetch some sample ads directly with API...');
            
            // Fallback: Use API to get some sample data
            const { ApifyClient } = require('apify-client');
            
            // Initialize the ApifyClient with API token
            const client = new ApifyClient({
                token: 'apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8',
            });
            
            // Run the actor to get facebook ads data
            const run = await client.actor('curious_coder~facebook-ads-library-scraper').call({
                urls: [
                    {
                        url: "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=%22shapewear%22&search_type=keyword_exact_phrase"
                    }
                ],
                searchTerms: ["shapewear"],
                countryCode: "US",
                adActiveStatus: "active",
                adType: "all"
            });
            
            // Get dataset items
            const { items: apiItems } = await client.dataset(run.defaultDatasetId).listItems();
            console.log(`Retrieved ${apiItems.length} items from the API call.`);
            
            // Process the API items instead
            if (apiItems.length > 0) {
                processItems(apiItems);
            } else {
                console.error('Could not retrieve any data through API either.');
            }
            
            return;
        }
        
        // Process the dataset items
        processItems(items);
        
    } catch (error) {
        console.error('Error in Facebook Ads Actor:', error);
    }
});

function processItems(items) {
    // Restructure each item
    // Adjust these fields to match the structure of your scraped JSON
    const restructuredItems = items.map(item => ({
        searchUrl: item.url || '',
        adUrl: item.url || '',
        pageName: item.page_name || '',
        pageUrl: (item.snapshot && item.snapshot.page_profile_uri) || item.page_profile_uri || '',
        publishedPlatform: item.publisher_platform || '',
        adTitle: (item.snapshot && item.snapshot.title) || '',
        adCTAText: (item.snapshot && item.snapshot.cta_text) || '',
        adCTALink: (item.snapshot && item.snapshot.link_url) || '',
        adImages: (item.snapshot && item.snapshot.images) || [],
        adVideos: (item.snapshot && item.snapshot.videos) || [],
        adText: (item.snapshot && item.snapshot.body && item.snapshot.body.text) || ''
    }));
    
    // Log the restructured data for inspection
    console.log('Restructured Items:');
    console.dir(restructuredItems, { depth: null });
}
