const { Client } = require('pg');
require('dotenv').config(); // Load environment variables from .env file

// PostgreSQL connection configuration using environment variables
const dbConfig = {
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } // Required for NeonDB connection
};

// ✅ Function to ensure the `ads` table exists
async function initializeDatabase() {
    const client = new Client(dbConfig);
    await client.connect();
    console.log('🔗 Connected to PostgreSQL (NeonDB).');

    // ✅ Create `ads` table if it does not exist
    await client.query(`
        CREATE TABLE IF NOT EXISTS ads (
            id SERIAL PRIMARY KEY,
            search_url TEXT,
            ad_url TEXT UNIQUE,
            page_name TEXT,
            page_url TEXT,
            published_platform TEXT,
            ad_title TEXT,
            ad_cta_text TEXT,
            ad_cta_link TEXT,
            ad_images TEXT[],
            ad_videos TEXT[],
            ad_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
    `);

    console.log('✅ ads table is ready.');
    await client.end();
}

// ✅ Function to insert or update ads in PostgreSQL
async function storeAdsInDatabase(items) {
    const client = new Client(dbConfig);
    await client.connect();
    console.log('🔗 Connected to PostgreSQL database.');

    for (const item of items) {
        const adData = {
            searchUrl: item.url || '',
            adUrl: item.url || '',
            pageName: item.page_name || '',
            pageUrl: item.snapshot?.page_profile_uri || item.page_profile_uri || '',
            publishedPlatform: item.publisher_platform || '',
            adTitle: item.snapshot?.title || '',
            adCTAText: item.snapshot?.cta_text || '',
            adCTALink: item.snapshot?.link_url || '',
            adImages: item.snapshot?.images || [],
            adVideos: item.snapshot?.videos || [],
            adText: item.snapshot?.body?.text || ''
        };

        try {
            // ✅ Insert new ad OR update existing ad if it already exists
            await client.query(`
                INSERT INTO ads (search_url, ad_url, page_name, page_url, published_platform, ad_title, ad_cta_text, ad_cta_link, ad_images, ad_videos, ad_text, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                ON CONFLICT (ad_url) DO UPDATE 
                SET 
                    search_url = EXCLUDED.search_url,
                    page_name = EXCLUDED.page_name,
                    page_url = EXCLUDED.page_url,
                    published_platform = EXCLUDED.published_platform,
                    ad_title = EXCLUDED.ad_title,
                    ad_cta_text = EXCLUDED.ad_cta_text,
                    ad_cta_link = EXCLUDED.ad_cta_link,
                    ad_images = EXCLUDED.ad_images,
                    ad_videos = EXCLUDED.ad_videos,
                    ad_text = EXCLUDED.ad_text,
                    updated_at = NOW();
            `, [
                adData.searchUrl,
                adData.adUrl,
                adData.pageName,
                adData.pageUrl,
                adData.publishedPlatform,
                adData.adTitle,
                adData.adCTAText,
                adData.adCTALink,
                adData.adImages,
                adData.adVideos,
                adData.adText
            ]);

            console.log(`✅ Stored ad: ${adData.adUrl}`);
        } catch (dbError) {
            console.error(`❌ Error storing ad in database: ${dbError.message}`);
        }
    }

    await client.end(); // Close database connection
    console.log('🔌 Database connection closed.');
}

// Export both functions
module.exports = { initializeDatabase, storeAdsInDatabase };
