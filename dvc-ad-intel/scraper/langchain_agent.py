# scraper/langchain_agent.py

import os
from dotenv import load_dotenv
load_dotenv()  # Replit Secrets are auto-loaded

from langchain.agents import initialize_agent
from langchain.agents.agent_types import AgentType
from langchain_community.chat_models import ChatOpenAI
from langchain.tools import Tool

# Import your Facebook scraper tool
from scraper.tools.playwright_fb_scraper import run_facebook_scraper

# Wrap the Facebook scraper function as a Tool
facebook_scraper_tool = Tool(
    name="FacebookScraper",
    func=run_facebook_scraper,
    description="Scrapes Facebook Ads Library for ads matching a query and returns the ad texts."
)

def run_scraper_agent(query: str):
    """Initializes the LangChain agent with the Facebook scraper tool and processes the query."""
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        print("Error: OPENAI_API_KEY is not set!")
        return "Missing API key."

    # Initialize the LLM (ChatOpenAI)
    llm = ChatOpenAI(temperature=0, openai_api_key=openai_api_key)

    # Define the list of available tools; in this case, our Facebook scraper
    tools = [facebook_scraper_tool]

    # Initialize the agent with the available tools and chosen agent type
    agent = initialize_agent(
        tools,
        llm,
        agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        verbose=True
    )

    # Run the agent with the provided query; the agent will decide when to call the FacebookScraper
    response = agent.run(query)
    return response

if __name__ == "__main__":
    # Example query instructing the agent to scrape Facebook Ads Library data
    test_query = "Use FacebookScraper to scrape the Facebook Ads Library for ads with the keyword 'example' and return the results."
    result = run_scraper_agent(test_query)
    print("Agent Response:", result)
