
import os
import pg8000

# Database configuration
DB_CONFIG = {
    "dbname": os.getenv("PGDATABASE"),
    "user": os.getenv("PGUSER"),
    "password": os.getenv("PGPASSWORD"),
    "host": os.getenv("PGHOST"),
    "port": os.getenv("PGPORT", "5432")
}

def fix_ad_video_insights_table():
    """Fix the ad_video_insights table structure"""
    print("Fixing ad_video_insights table...")
    
    conn = pg8000.connect(
        database=DB_CONFIG['dbname'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        host=DB_CONFIG['host'],
        port=int(DB_CONFIG['port'])
    )
    cursor = conn.cursor()
    
    # Check if the table exists
    cursor.execute("""
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ad_video_insights'
    );
    """)
    
    table_exists = cursor.fetchone()[0]
    
    if table_exists:
        # Drop the existing table if it has wrong structure
        cursor.execute("""
        DROP TABLE ad_video_insights;
        """)
        print("Dropped existing ad_video_insights table with incorrect structure")
    
    # Create the table with correct structure
    cursor.execute("""
    CREATE TABLE ad_video_insights (
        id SERIAL PRIMARY KEY,
        ad_id TEXT UNIQUE NOT NULL,
        labels JSONB,
        text JSONB,
        scenes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # Create trigger for auto-updating updated_at
    cursor.execute("""
    DROP TRIGGER IF EXISTS update_ad_video_insights_timestamp ON ad_video_insights;
    CREATE TRIGGER update_ad_video_insights_timestamp
    BEFORE UPDATE ON ad_video_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
    """)
    
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Fixed ad_video_insights table successfully!")

def create_tables():
    """Create necessary tables if they don't exist"""
    print("Creating required tables...")
    
    conn = pg8000.connect(
        database=DB_CONFIG['dbname'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        host=DB_CONFIG['host'],
        port=int(DB_CONFIG['port'])
    )
    cursor = conn.cursor()

    # Create update_timestamp function if it doesn't exist
    cursor.execute("""
    CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # Create ad_video_insights table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ad_video_insights (
        id SERIAL PRIMARY KEY,
        ad_id TEXT UNIQUE NOT NULL,
        labels JSONB,
        text JSONB,
        scenes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Create trigger for auto-updating updated_at
    cursor.execute("""
    DROP TRIGGER IF EXISTS update_ad_video_insights_timestamp ON ad_video_insights;
    CREATE TRIGGER update_ad_video_insights_timestamp
    BEFORE UPDATE ON ad_video_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
    """)

    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Tables created successfully!")

if __name__ == "__main__":
    # Fix the ad_video_insights table first
    fix_ad_video_insights_table()
    # Then create any other tables that might be needed
    create_tables()()
