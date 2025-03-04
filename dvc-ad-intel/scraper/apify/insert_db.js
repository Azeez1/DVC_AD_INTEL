const { Client } = require("pg");
const crypto = require("crypto"); // To generate unique hashes
require("dotenv").config();

// ✅ PostgreSQL connection configuration
const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
};

// ✅ Function to ensure the `ads` table exists
async function initializeDatabase() {
    const client = new Client(dbConfig);
    await client.connect();
    console.log("🔗 Connected to PostgreSQL (NeonDB).");

    // ✅ Create update timestamp function if it doesn't exist
    await client.query(`
        CREATE OR REPLACE FUNCTION update_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
           NEW.updated_at = NOW();
           RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    // ✅ Create `ads` table if it does not exist
    await client.query(`
        CREATE TABLE IF NOT EXISTS ads (
            id SERIAL PRIMARY KEY,
            ad_id TEXT UNIQUE,  -- Unique identifier for each ad
            search_url TEXT,
            ad_url TEXT,
            page_name TEXT,
            page_url TEXT,
            published_platform TEXT[],  -- ✅ Store multiple platforms as an array
            ad_title TEXT,
            ad_cta_text TEXT,
            ad_cta_link TEXT,
            ad_images TEXT[],
            ad_videos TEXT[],
            ad_text TEXT,
            start_date TIMESTAMP,  -- ✅ Store ad start time
            end_date TIMESTAMP,  -- ✅ Store ad end time
            total_active_time INTEGER,  -- ✅ Track how long an ad was running
            page_like_count INTEGER,  -- ✅ Store number of likes on page
            impressions TEXT,  -- ✅ Store estimated ad impressions
            reach_estimate TEXT,  -- ✅ Estimated reach of the ad
            spend NUMERIC,  -- ✅ Ad spend data (if available)
            targeted_countries TEXT[],  -- ✅ Store targeted countries
            entity_type TEXT,  -- ✅ Whether the ad is from a brand, person, or political entity
            gated_type TEXT,  -- ✅ Compliance status
            compliance_data JSON,  -- ✅ Store full compliance details
            video_hd_url TEXT[],  -- ✅ Store multiple HD video URLs
            video_sd_url TEXT[],  -- ✅ Store multiple SD video URLs
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // ✅ Create trigger for auto-updating `updated_at` timestamp
    await client.query(`
        DROP TRIGGER IF EXISTS update_ads_timestamp ON ads;
        CREATE TRIGGER update_ads_timestamp
        BEFORE UPDATE ON ads
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp();
    `);

    console.log("✅ ads table is ready.");
    await client.end();
}

// ✅ Function to insert or update ads in PostgreSQL
async function storeAdsInDatabase(items) {
    const client = new Client(dbConfig);
    await client.connect();
    console.log("🔗 Connected to PostgreSQL database.");

    for (const item of items) {
        const adData = {
            searchUrl: item.url || "",
            adUrl: item.url || "",
            pageName: item.page_name || "",
            pageUrl:
                item.snapshot?.page_profile_uri || item.page_profile_uri || "",
            publishedPlatform: item.publisher_platform || [],
            adTitle: item.snapshot?.title || "",
            adCTAText: item.snapshot?.cta_text || "",
            adCTALink: item.snapshot?.link_url || "",
            adImages: item.snapshot?.images || [],
            adVideos: item.snapshot?.videos || [],
            adText: item.snapshot?.body?.text || "",
            startDate: item.start_date
                ? new Date(item.start_date * 1000)
                : null,
            endDate: item.end_date ? new Date(item.end_date * 1000) : null,
            totalActiveTime: item.total_active_time || 0,
            pageLikeCount: item.snapshot?.page_like_count || 0,
            impressions: item.impressions_with_index?.impressions_text || "",
            reachEstimate: item.reach_estimate || "",
            spend: item.spend || null,
            targetedCountries: item.targeted_or_reached_countries || [],
            entityType: item.entity_type || "",
            gatedType: item.gated_type || "",
            complianceData: item.regional_regulation_data || {},
            // ✅ Extract all available video HD and SD URLs
            videoHdUrl:
                item.snapshot?.videos
                    ?.map((v) => v.video_hd_url)
                    .filter((url) => url) || [],
            videoSdUrl:
                item.snapshot?.videos
                    ?.map((v) => v.video_sd_url)
                    .filter((url) => url) || [],
        };

        // ✅ Generate a unique `ad_id`
        let adId =
            item.ad_archive_id ||
            crypto
                .createHash("sha256")
                .update(
                    adData.pageName +
                        adData.adText +
                        JSON.stringify(adData.adImages),
                )
                .digest("hex");

        try {
            // ✅ Insert or update ad
            await client.query(
                `
                INSERT INTO ads (ad_id, search_url, ad_url, page_name, page_url, published_platform, ad_title, ad_cta_text, ad_cta_link, ad_images, ad_videos, ad_text, start_date, end_date, total_active_time, page_like_count, impressions, reach_estimate, spend, targeted_countries, entity_type, gated_type, compliance_data, video_hd_url, video_sd_url, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW())
                ON CONFLICT (ad_id) DO UPDATE 
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
                    start_date = EXCLUDED.start_date,
                    end_date = EXCLUDED.end_date,
                    total_active_time = EXCLUDED.total_active_time,
                    page_like_count = EXCLUDED.page_like_count,
                    impressions = EXCLUDED.impressions,
                    reach_estimate = EXCLUDED.reach_estimate,
                    spend = EXCLUDED.spend,
                    targeted_countries = EXCLUDED.targeted_countries,
                    entity_type = EXCLUDED.entity_type,
                    gated_type = EXCLUDED.gated_type,
                    compliance_data = EXCLUDED.compliance_data,
                    video_hd_url = EXCLUDED.video_hd_url,
                    video_sd_url = EXCLUDED.video_sd_url,
                    updated_at = NOW();
            `,
                [
                    adId,
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
                    adData.adText,
                    adData.startDate,
                    adData.endDate,
                    adData.totalActiveTime,
                    adData.pageLikeCount,
                    adData.impressions,
                    adData.reachEstimate,
                    adData.spend,
                    adData.targetedCountries,
                    adData.entityType,
                    adData.gatedType,
                    adData.complianceData,
                    adData.videoHdUrl,
                    adData.videoSdUrl,
                ],
            );

            console.log(`✅ Stored ad: ${adData.pageName} - ${adId}`);
        } catch (dbError) {
            console.error(
                `❌ Error storing ad in database: ${dbError.message}`,
            );
        }
    }

    await client.end(); // Close database connection
    console.log("🔌 Database connection closed.");
}

// ✅ Export both functions
module.exports = { initializeDatabase, storeAdsInDatabase };
