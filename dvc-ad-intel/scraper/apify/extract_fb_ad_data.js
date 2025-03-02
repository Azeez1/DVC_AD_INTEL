
const Apify = require('apify');
const { ApifyClient } = require('apify-client');

// Define the search query
const searchQuery = 'shapewear';
const count = 20;

Apify.main(async () => {
    try {
        console.log('Starting Facebook Ads Actor...');
        
        // First try to use the original dataset ID that was working before
        const datasetId = '78SEFjfQs3zfaAHzG';
        
        console.log(`Attempting to fetch data from dataset ID: ${datasetId}`);
        
        try {
            // Open the dataset from Apify storage
            const dataset = await Apify.openDataset(datasetId);
            
            // Retrieve items from the dataset
            const { items } = await dataset.getData({ offset: 0, limit: 1000 });
            console.log(`Retrieved ${items.length} items from the dataset.`);
            
            if (items && items.length > 0) {
                console.log('Successfully retrieved items from dataset!');
                processItems(items);
                return;
            }
        } catch (datasetError) {
            console.warn(`Error accessing dataset: ${datasetError.message}`);
        }
        
        // If dataset approach fails, use direct API call as fallback
        console.log('Falling back to direct API call...');
        
        // Initialize the ApifyClient with API token
        const client = new ApifyClient({
            token: 'apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8',
        });
        
        // Run the actor to get facebook ads data
        console.log('Running Facebook Ads Library Scraper actor...');
        const run = await client.actor('curious_coder~facebook-ads-library-scraper').call({
            urls: [
                {
                    url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=%22${searchQuery}%22&search_type=keyword_exact_phrase`
                }
            ],
            searchTerms: [searchQuery],
            countryCode: "US",
            adActiveStatus: "active",
            adType: "all"
        });
        
        console.log(`Actor run completed with ID: ${run.id}`);
        
        // Get dataset items
        const { items: apiItems } = await client.dataset(run.defaultDatasetId).listItems();
        console.log(`Retrieved ${apiItems.length} items from the API call.`);
        
        // Process the API items
        if (apiItems.length > 0) {
            // Limit to count items
            const limitedItems = apiItems.slice(0, count);
            processItems(limitedItems);
        } else {
            console.error('Could not retrieve any data through API either.');
        }
        
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
