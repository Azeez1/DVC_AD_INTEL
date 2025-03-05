import os
import psycopg2
import openai

# Database Configuration (Environment Variables)
DB_CONFIG = {
    "dbname": os.getenv("PGDATABASE"),
    "user": os.getenv("PGUSER"),
    "password": os.getenv("PGPASSWORD"),
    "host": os.getenv("PGHOST"),
    "port": os.getenv("PGPORT", "5432")
}

# OpenAI API Key
openai.api_key = os.getenv("OPENAI_API_KEY")


def ensure_db_columns():
    """
    Ensure the required sentiment analysis columns exist in the `ads` table.
    This prevents errors if the script is run before the columns are created.
    """
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    cursor.execute("""
        ALTER TABLE ads 
        ADD COLUMN IF NOT EXISTS sentiment TEXT,
        ADD COLUMN IF NOT EXISTS sentiment_explanation TEXT,
        ADD COLUMN IF NOT EXISTS sentiment_status TEXT;
    """)

    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Database schema check complete: Sentiment columns exist.")


def analyze_sentiment(text):
    """
    Send text content to GPT-4 for sentiment analysis.
    Returns:
      - Sentiment Label: 'Positive', 'Neutral', or 'Negative'
      - Explanation of sentiment classification
    """
    prompt = f"""
    Analyze the sentiment of this ad content and classify it as 'Positive', 'Neutral', or 'Negative'. 
    Provide a short explanation of your classification.

    Ad Content: {text}
    """

    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": prompt}
        ]
    )

    sentiment_text = response.choices[0].message.content

    # Extract sentiment label (first word of the response)
    sentiment_label = sentiment_text.split("\n")[0].strip()

    return sentiment_label, sentiment_text


def process_ads():
    """
    Fetch ad content from both `ads` and `ads_insight` tables.
    Perform sentiment analysis on the extracted text.
    Store the results back into the `ads` table.
    """
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # Fetch ads that haven't been analyzed yet
    cursor.execute("""
        SELECT 
            a.id, a.ad_id, a.page_name, a.published_platform, 
            a.ad_title, a.ad_cta_text, a.ad_text, 
            a.page_like_count, a.impressions, a.reach_estimate, 
            ai.text AS insights_text, ai.labels
        FROM ads a
        LEFT JOIN ad_video_insights ai ON a.ad_id = ai.ad_id
        WHERE a.sentiment IS NULL;
    """)

    ads = cursor.fetchall()

    for (id, ad_id, page_name, published_platform, ad_title, ad_cta_text,
         ad_text, page_like_count, impressions, reach_estimate, insights_text,
         labels) in ads:

        # Merge `ad_text` and `insights_text` (if both exist)
        combined_text = ""
        if insights_text:
            # Handle the case where insights_text is a list (JSON data)
            if isinstance(insights_text, list):
                combined_text += " ".join(insights_text) + " "
            else:
                combined_text += str(insights_text) + " "
        if ad_text:
            combined_text += ad_text

        # Skip processing if there's no text available for analysis
        if not combined_text.strip():
            print(f"⚠️ Skipping Ad {ad_id} (No text found)")
            continue

        print(f"🔍 Analyzing sentiment for Ad {ad_id}...")

        try:
            # Perform sentiment analysis using GPT-4
            sentiment, sentiment_explanation = analyze_sentiment(combined_text)

            # Store the sentiment analysis result in the database
            cursor.execute(
                "UPDATE ads SET sentiment = %s, sentiment_explanation = %s WHERE id = %s;",
                (sentiment, sentiment_explanation, id))
            conn.commit()
            print(f"✅ Sentiment Analysis complete: {ad_id} -> {sentiment}")

        except Exception as e:
            print(f"❌ Error analyzing sentiment for {ad_id}: {str(e)}")
            cursor.execute(
                "UPDATE ads SET sentiment_status = 'failed' WHERE id = %s;",
                (id, ))
            conn.commit()

    cursor.close()
    conn.close()
    print("✅ Sentiment analysis process completed for all ads.")


# ✅ Ensure table has required columns before running sentiment analysis
ensure_db_columns()

# ✅ Start sentiment analysis process
process_ads()
