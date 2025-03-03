const Apify = require('apify');
const { ApifyClient } = require('apify-client');
const { initializeDatabase, storeAdsInDatabase } = require('./db'); // Import DB functions
require('dotenv').config(); // Load environment variables

// Define the search query
const searchQuery = 'shapewear'; 
const count = 20; // Number of ads to process

Apify.main(async () => {
    try {
        console.log('🚀 Starting Facebook Ads Scraper...');

        // ✅ Ensure the database and table are set up before storing data
        await initializeDatabase();

        // ✅ Step 1: Try to retrieve data from an existing Apify dataset
        const datasetId = '78SEFjfQs3zfaAHzG'; 
        console.log(`📡 Attempting to fetch data from dataset ID: ${datasetId}`);

        let items = []; // Store retrieved ad data

        try {
            // Open dataset storage and fetch data
            const dataset = await Apify.openDataset(datasetId);
            const { items: datasetItems } = await dataset.getData({ offset: 0, limit: 1000 });

            console.log(`✅ Retrieved ${datasetItems.length} ads from the dataset.`);
            items = datasetItems;
        } catch (datasetError) {
            console.warn(`⚠️ Error accessing dataset: ${datasetError.message}`);
        }

        // ✅ Step 2: If dataset retrieval fails, use API fallback
        if (items.length === 0) {
            console.log('⚠️ No data found in dataset. Falling back to direct API call...');
            const client = new ApifyClient({ token: 'apify_api_Cs25DCKxbaabAfdKjGDJkMqYaprUST48hBm8' });

            const run = await client.actor('curious_coder~facebook-ads-library-scraper').call({
                urls: [
                    { url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=%22${searchQuery}%22&search_type=keyword_exact_phrase` }
                ],
                searchTerms: [searchQuery],
                countryCode: "US",
                adActiveStatus: "active",
                adType: "all"
            });

            console.log(`🎬 Actor execution completed. Run ID: ${run.id}`);

            const { items: apiItems } = await client.dataset(run.defaultDatasetId).listItems();
            console.log(`📦 Retrieved ${apiItems.length} ads from API.`);
            items = apiItems.slice(0, count);
        }

        // ✅ Step 3: Store retrieved ads in the database
        if (items.length > 0) {
            console.log(`📥 Storing ${items.length} ads in PostgreSQL database...`);
            await storeAdsInDatabase(items);
        } else {
            console.error('❌ No ads retrieved.');
        }

    } catch (error) {
        console.error('🚨 Error in Facebook Ads Scraper:', error);
    }
});
