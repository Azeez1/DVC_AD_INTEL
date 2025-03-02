const Apify = require('apify');

Apify.main(async () => {
    // Use the dummy dataset ID
    const datasetId = '78SEFjfQs3zfaAHzG';

    // Open the dataset from Apify storage.
    const dataset = await Apify.openDataset(datasetId);

    // Retrieve all items from the dataset.
    // You can adjust limit and offset if needed.
    const { items } = await dataset.getData({ offset: 0, limit: 10000 });
    console.log(`Retrieved ${items.length} items from the dataset.`);

    // Check if items were returned
    if (items.length === 0) {
        console.warn('No items found in the dataset. Make sure your scraping job has produced data.');
    }

    // Restructure each item.
    // Adjust these fields to match the structure of your scraped JSON.
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

    // Log the restructured data for inspection.
    console.log('Restructured Items:');
    console.dir(restructuredItems, { depth: null });
});
