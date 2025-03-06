import os
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI
from langchain_community.agent_toolkits.sql.base import create_sql_agent
from langchain.agents.agent_types import AgentType

# Load environment variables for database credentials
DB_USER = os.getenv("PGUSER")
DB_PASSWORD = os.getenv("PGPASSWORD")
DB_HOST = os.getenv("PGHOST")
DB_NAME = os.getenv("PGDATABASE")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Construct the PostgreSQL connection URL
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}?sslmode=require"

try:
    # Initialize the database connection
    db = SQLDatabase.from_uri(DATABASE_URL)
    print("✅ Database connection established!")
except Exception as e:
    print("❌ Failed to connect to database:", str(e))
    exit()

# Define AI Agent System Message (Enhanced Reasoning)
AGENT_SYSTEM_PROMPT = """
### **AI Agent Definition for DVC Ad Intelligence Assistant**
## **📌 Overview**
This AI assistant helps analyze ad performance based on **sentiment analysis, database insights, and competitor research**.  
It generates **data-driven recommendations** for optimizing ads and improving **CTA effectiveness**.

## **🔍 Capabilities**
- **Ad Performance Analysis**: Identify trends in ad sentiment.
- **CTA Effectiveness**: Discover the best-performing call-to-actions.
- **Optimization Strategies**: Provide actionable recommendations.
- **Competitor Research**: Search the web to find industry trends.
- **Video Ad Ideation**: Suggest high-performing hooks, CTAs, and creative strategies.

## **📝 Response Format**
1️⃣ **Ad Performance Summary** – Breakdown of sentiment trends.
2️⃣ **CTA Effectiveness** – Best and worst-performing CTA phrases.
3️⃣ **Optimization Suggestions** – Actionable insights based on data.
4️⃣ **Competitor Insights (If Relevant)** – Web research on ad strategies.
5️⃣ **Video Ad Ideas** – Hooks, CTAs, and creative angles.
6️⃣ **SQL Query Used (if applicable)** – The query that generated insights.

## **🚀 How to Respond**
- If a user asks for **data**, first retrieve the results from SQL.
- Then, **analyze and interpret the results** before responding.
- If the user asks for **ad strategies**, **think independently** and **generate ideas based on the data**.
- If database results are insufficient, **provide general industry insights**.

## **⚠️ Constraints**
- Data queries should only target **ads** and **ad_insights** tables.
- Competitor insights should be **brief and relevant** to ad trends.
- Output should be **concise, structured, and data-driven**.
"""

# Initialize the OpenAI Agent with reasoning abilities
llm = ChatOpenAI(
    model_name="gpt-4",
    temperature=0.7,  # Increased to allow more creative responses
    openai_api_key=OPENAI_API_KEY
)

# Create the SQL Agent with Enhanced Reasoning
agent_executor = create_sql_agent(
    llm=llm,
    db=db,
    agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
    system_message=AGENT_SYSTEM_PROMPT  # Added AI Agent Definition
)

def ask_db(query):
    """Query the AI agent to analyze database trends and generate insights."""
    try:
        raw_response = agent_executor.run(query)

        # Ensure the AI interprets the data instead of just listing SQL results
        reasoning_prompt = f"""
        The user asked: {query}

        You retrieved the following database results:
        {raw_response}

        Now, **analyze these results and provide a structured response**:
        - Summarize key takeaways
        - Highlight trends in sentiment, CTA performance, and ad engagement
        - Suggest specific ad optimizations based on the data
        - If applicable, generate new ad hooks, CTAs, and video ideas

        Your response should be **insightful, structured, and actionable**.
        """

        final_response = llm.invoke(reasoning_prompt)
        return final_response
    except Exception as e:
        return f"⚠️ Error: {str(e)}"

if __name__ == "__main__":
    print("🤖 AI Agent Ready! Ask questions about your ad insights.\n")

    while True:
        user_query = input("🔍 Ask a question (or type 'exit' to quit): ")
        if user_query.lower() == "exit":
            print("👋 Exiting AI Agent.")
            break
        response = ask_db(user_query)
        print("\n💡 AI Response:", response)
