const Apify = require('apify');

Apify.main(async () => {
    // Use the dummy dataset ID "78SEFjfQs3zfaAHzG"
    const datasetId = '78SEFjfQs3zfaAHzG';

    // Open the dataset using the provided dataset ID.
    const dataset = await Apify.openDataset(datasetId);

    // Retrieve all items from the dataset.
    const { items } = await dataset.getData();
    console.log(`Retrieved ${items.length} items from the dataset.`);

    // Restructure each item.
    // This example creates a new object with:
    // - 'url': the original adUrl,
    // - 'name': the original pageName,
    // - 'details': an object containing additional fields.
    const restructuredItems = items.map(item => ({
        url: item.adUrl || '',
        name: item.pageName || '',
        details: {
            pageUrl: item.pageUrl || '',
            platform: item.publishedPlatform || '',
            title: item.adTitle || '',
            ctaText: item.adCTAText || '',
            ctaLink: item.adCTALink || '',
            images: item.adImages || [],
            videos: item.adVideos || [],
            text: item.adText || '',
        },
    }));

    // Log the restructured items for inspection.
    console.log('Restructured Items:');
    console.dir(restructuredItems, { depth: null });

    // End the actor.
    await Apify.exit();
});
