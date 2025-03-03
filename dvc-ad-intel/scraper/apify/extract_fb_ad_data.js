const Apify = require('apify');
const { ApifyClient } = require('apify-client');
const { initializeDatabase, storeAdsInDatabase } = require('./db'); // Import DB functions
require('dotenv').config(); // Load environment variables

// Define search parameters
const searchQuery = 'shapewear';
const count = 20; // Number of ads to process

Apify.main(async () => {
    try {
        console.log('🚀 Starting Facebook Ads Scraper...');

        // ✅ Step 1: Ensure database and table are set up
        await initializeDatabase();

        // ✅ Step 2: Attempt to fetch data from existing Apify dataset
        const datasetId = '78SEFjfQs3zfaAHzG';
        console.log(`📡 Fetching data from dataset ID: ${datasetId}`);

        let items = [];

        try {
            // Open dataset and retrieve data
            const dataset = await Apify.openDataset(datasetId);
            const { items: datasetItems } = await dataset.getData({ offset: 0, limit: 1000 });

            if (datasetItems.length > 0) {
                console.log(`✅ Retrieved ${datasetItems.length} ads from dataset.`);
                items = datasetItems;
            } else {
                console.warn(`⚠️ No ads found in dataset.`);
            }
        } catch (datasetError) {
            console.error(`⚠️ Dataset retrieval failed: ${datasetError.message}`);
        }

        // ✅ Step 3: If dataset retrieval fails, use API fallback
        if (items.length === 0) {
            console.log('⚠️ No data found in dataset. Attempting API call...');
            try {
                const client = new ApifyClient({ token: process.env.APIFY_API_KEY });

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

                console.log(`🎬 Actor execution completed. Run ID: ${run.id}`);

                const { items: apiItems } = await client.dataset(run.defaultDatasetId).listItems();

                if (apiItems.length > 0) {
                    console.log(`📦 Retrieved ${apiItems.length} ads from API.`);
                    items = apiItems.slice(0, count);
                } else {
                    console.error('❌ API did not return any ads.');
                }
            } catch (apiError) {
                console.error(`🚨 API call failed: ${apiError.message}`);
            }
        }

        // ✅ Step 4: Store ads in PostgreSQL database
        if (items.length > 0) {
            console.log(`📥 Storing ${items.length} ads in PostgreSQL database...`);
            await storeAdsInDatabase(items);
        } else {
            console.error('❌ No ads retrieved from dataset or API.');
        }

    } catch (error) {
        console.error('🚨 Error in Facebook Ads Scraper:', error);
    }
});
