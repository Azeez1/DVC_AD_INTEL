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
gcs_credentials_json = os.getenv("GCS_CREDENTIALS")

# Save JSON string to a temporary file
if gcs_credentials_json:
    gcs_credentials_path = "/tmp/gcs_service_account.json"
    with open(gcs_credentials_path, "w") as f:
        f.write(gcs_credentials_json)
else:
    raise ValueError("GCS_CREDENTIALS environment variable is not set")

# Initialize GCS
storage_client = storage.Client.from_service_account_json(gcs_credentials_path)
bucket = storage_client.bucket(GCS_BUCKET_NAME)

def upload_to_gcs(local_file, gcs_filename):
    blob = bucket.blob(gcs_filename)
    blob.upload_from_filename(local_file)
    return f"gs://{GCS_BUCKET_NAME}/{gcs_filename}"

def process_ads():
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute("SELECT id, ad_id, video_hd_url, video_sd_url FROM ads WHERE gcs_url IS NULL;")
    ads = cursor.fetchall()

    for id, ad_id, video_hd_urls, video_sd_urls in ads:
        print(f"Processing Ad {ad_id}...")

        # Ensure URLs are in list format and select HD first, fallback to SD
        video_urls = video_hd_urls if video_hd_urls else video_sd_urls
        if isinstance(video_urls, list):
            video_url = video_urls[0]  # Use the first available URL
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
