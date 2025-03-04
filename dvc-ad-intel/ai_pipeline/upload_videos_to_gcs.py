import os
import psycopg2
import requests
from google.cloud import storage

# Config - Read from Environment Variables
DB_CONFIG = {
    "dbname": os.getenv("PGDATABASE"),
    "user": os.getenv("PGUSER"),
    "password": os.getenv("PGPASSWORD"),
    "host": os.getenv("PGHOST"),
    "port": os.getenv("PGPORT", "5432")
}

GCS_BUCKET_NAME = "dvc-ad-intel-videos"
GCS_CREDENTIALS = os.getenv("GCS_CREDENTIALS")  # Path to service account JSON

# Load GCS credentials from environment variables
gcs_credentials_json = os.getenv("GCS_CREDENTIALS")  # Path to service account JSON

# Check if credentials are valid JSON
if not gcs_credentials_json or not gcs_credentials_json.strip():
    raise ValueError("GCS_CREDENTIALS environment variable is empty or not set")

try:
    # Verify it's valid JSON
    import json
    json.loads(gcs_credentials_json)

    # Save JSON string to a temporary file
    gcs_credentials_path = "/tmp/gcs_service_account.json"
    with open(gcs_credentials_path, "w") as f:
        f.write(gcs_credentials_json)

    # Initialize GCS
    storage_client = storage.Client.from_service_account_json(gcs_credentials_path)
    bucket = storage_client.bucket(GCS_BUCKET_NAME)
except json.JSONDecodeError:
    raise ValueError("GCS_CREDENTIALS environment variable does not contain valid JSON")


def upload_to_gcs(local_file, gcs_filename):
    blob = bucket.blob(gcs_filename)
    blob.upload_from_filename(local_file)
    return f"gs://{GCS_BUCKET_NAME}/{gcs_filename}"

def process_ads():
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # First, add the gcs_url column if it doesn't exist
    try:
        cursor.execute("ALTER TABLE ads ADD COLUMN IF NOT EXISTS gcs_url TEXT;")
        conn.commit()
        print("Added gcs_url column to ads table")
    except Exception as e:
        print(f"Error adding column: {e}")
        conn.rollback()

    cursor.execute("SELECT id, ad_id, video_hd_url, video_sd_url FROM ads WHERE gcs_url IS NULL;")
    ads = cursor.fetchall()

    for id, ad_id, video_hd_urls, video_sd_urls in ads:
        print(f"Processing Ad {ad_id}...")

        # Ensure URLs are in list format and select HD first, fallback to SD
        video_urls = video_hd_urls if video_hd_urls else video_sd_urls
        
        # Skip ads without videos
        if not video_urls:
            print(f"Skipping Ad {ad_id}: No video URLs available")
            continue
            
        if isinstance(video_urls, list):
            if len(video_urls) > 0:
                video_url = video_urls[0]  # Use the first available URL
            else:
                print(f"Skipping Ad {ad_id}: Empty video URL list")
                continue
        else:
            video_url = video_urls

        # Download video
        response = requests.get(video_url, stream=True)
        local_file = f"ad_{ad_id}.mp4"
        with open(local_file, 'wb') as f:
            for chunk in response.iter_content(8192):
                f.write(chunk)

        # Upload to GCS
        gcs_filename = f"ads/{ad_id}/video.mp4"
        gcs_url = upload_to_gcs(local_file, gcs_filename)
        print(f"Uploaded to GCS: {gcs_url}")

        # Update PostgreSQL
        cursor.execute("UPDATE ads SET gcs_url = %s WHERE id = %s;", (gcs_url, id))
        conn.commit()

        os.remove(local_file)

    cursor.close()
    conn.close()

# Run script
process_ads()