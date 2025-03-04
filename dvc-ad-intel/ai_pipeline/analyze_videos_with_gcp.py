import os
import json
import pg8000
from google.cloud import videointelligence

# PostgreSQL Config
DB_CONFIG = {
    "dbname": os.getenv("PGDATABASE"),
    "user": os.getenv("PGUSER"),
    "password": os.getenv("PGPASSWORD"),
    "host": os.getenv("PGHOST"),
    "port": os.getenv("PGPORT", "5432")
}

# GCP Config
GCS_CREDENTIALS = os.getenv("GCS_CREDENTIALS")  # Path to GCP JSON credentials

# Load GCP Credentials
if not GCS_CREDENTIALS:
    raise ValueError("GCS_CREDENTIALS environment variable is not set")

gcs_credentials_path = "/tmp/gcs_service_account.json"
with open(gcs_credentials_path, "w") as f:
    f.write(GCS_CREDENTIALS)

# Initialize Google Video Intelligence Client
video_client = videointelligence.VideoIntelligenceServiceClient.from_service_account_json(gcs_credentials_path)


def analyze_video(gcs_uri):
    """ Runs Google Video Intelligence API on a video stored in GCS """
    features = [
        videointelligence.Feature.LABEL_DETECTION,
        videointelligence.Feature.TEXT_DETECTION,
        videointelligence.Feature.SHOT_CHANGE_DETECTION
    ]

    request = videointelligence.AnnotateVideoRequest(
        input_uri=gcs_uri,
        features=features
    )

    operation = video_client.annotate_video(request=request)
    print(f"Processing video: {gcs_uri}")
    response = operation.result(timeout=300)

    # Extract Labels
    labels = [annotation.entity.description for annotation in response.annotation_results[0].segment_label_annotations]

    # Extract Text
    text_annotations = response.annotation_results[0].text_annotations if response.annotation_results else []
    text_list = []
    if text_annotations:
        for text in text_annotations:
            # Check for text_segments which contain the actual text
            if hasattr(text, 'text_segments') and text.text_segments:
                for segment in text.text_segments:
                    if hasattr(segment, 'text') and segment.text:
                        text_list.append(segment.text)
            # Fallback if the structure is different
            elif hasattr(text, 'text') and text.text:
                text_list.append(text.text)

    # Extract Scene Changes
    shot_changes = [shot.start_time_offset.seconds for shot in response.annotation_results[0].shot_annotations]

    return {
        "labels": labels,
        "text": text_list,
        "scenes": shot_changes
    }


def process_videos():
    """ Fetch videos from PostgreSQL and analyze them """
    conn = pg8000.connect(
        database=DB_CONFIG['dbname'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        host=DB_CONFIG['host'],
        port=int(DB_CONFIG['port'])
    )
    cursor = conn.cursor()

    # Fetch videos that haven't been analyzed yet
    cursor.execute("SELECT ad_id, gcs_url FROM ads WHERE gcs_url IS NOT NULL AND ad_id NOT IN (SELECT ad_id FROM ad_video_insights);")
    ads = cursor.fetchall()

    for ad_id, gcs_url in ads:
        print(f"Analyzing Ad {ad_id}...")

        insights = analyze_video(gcs_url)

        # Store AI insights in PostgreSQL
        cursor.execute("""
            INSERT INTO ad_video_insights (ad_id, labels, text, scenes)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (ad_id) DO UPDATE 
            SET labels = EXCLUDED.labels, text = EXCLUDED.text, scenes = EXCLUDED.scenes;
        """, (ad_id, json.dumps(insights["labels"]), json.dumps(insights["text"]), json.dumps(insights["scenes"])))

        conn.commit()
        print(f"Stored AI insights for Ad {ad_id}")

    cursor.close()
    conn.close()


# Run Script
process_videos()
