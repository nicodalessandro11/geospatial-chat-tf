"""
Script: main.py

- Loads an LLM agent with a custom prompt
- Connects to a Supabase PostgreSQL database
- Accepts a natural language question via CLI or input
- Sends the question to the agent and prints the response

Author: Nicolas Dalessandro
Email: nicodalessandro11@gmail.com
Date: 2025-04-21
Version: 1.0.0Z
License: MIT License (see LICENSE file for details)
"""

import os
import sys
import warnings
from pathlib import Path

# Add shared directory to Python path
sys.path.append(str(Path(__file__).resolve().parents[1] / "shared"))
from dotenv import load_dotenv
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
from langchain_community.agent_toolkits.sql.base import create_sql_agent
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core._api.deprecation import LangChainDeprecationWarning
from common_lib.emoji_logger import info, success, warning, error

# Ignore LangChain internal deprecation warnings
warnings.filterwarnings("ignore", category=LangChainDeprecationWarning)

# Configuration Block
BASE_DIR = Path(__file__).resolve().parents[0]
PROMPT_PATH = BASE_DIR / "prompt" / "custom_prompt.txt"
DEFAULT_QUESTION = "What is the neighborhood with the greatest number of people in Barcelona?"

# Load environment variables
load_dotenv()
SUPABASE_URI = os.getenv("SUPABASE_URI")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Load OpenAI model
def load_model():
    return ChatOpenAI(
        model="gpt-3.5-turbo",
        temperature=0,
        openai_api_key=OPENAI_API_KEY,
        request_timeout=30
    )

# Main logic
def run(question: str = DEFAULT_QUESTION):
    info("Starting NLP + SQL Agent")

    # Validate environment variables
    if not SUPABASE_URI:
        error("SUPABASE_URI is missing in the .env file.")
        raise ValueError("Missing database URI.")
    if not OPENAI_API_KEY:
        error("OPENAI_API_KEY is missing in the .env file.")
        raise ValueError("Missing OpenAI API key.")

    # Load model
    info("Loading OpenAI model...")
    llm = load_model()

    # Connect to Supabase DB
    info("🔗 Connecting to Supabase database...")
    try:
        db = SQLDatabase.from_uri(SUPABASE_URI, sample_rows_in_table_info=0)
        info("Database connected.")
    except Exception as e:
        error(f"Database connection failed: {e}")
        raise

    # Load prompt template
    info("Loading prompt template...")
    try:
        with open(PROMPT_PATH, "r") as f:
            prompt_content = f.read()
        custom_prompt = PromptTemplate.from_template(prompt_content)
        success("Prompt loaded.")
    except FileNotFoundError:
        error(f"Prompt not found at: {PROMPT_PATH}")
        raise

    # Create the agent
    info("Creating SQL agent...")
    try:
        toolkit = SQLDatabaseToolkit(db=db, llm=llm)
        agent = create_sql_agent(
            llm=llm,
            toolkit=toolkit,
            verbose=True,
            prompt=custom_prompt,
            handle_parsing_errors=True
        )
        success("Agent created.")
    except Exception as e:
        error(f"Agent creation failed: {e}")
        raise

    # Ask the question
    info(f"Asking: {question}")
    try:
        response = agent.invoke({"input": question}, handle_parsing_errors=True)
        print("\nAgent response:\n", response)
        success("Question processed successfully.")
    except Exception as e:
        error(f"Agent failed to respond: {e}")
        raise

# CLI fallback + optional input()
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run the NLP + SQL Agent with a given question.")
    parser.add_argument("--question", type=str, help="Natural language question to ask the SQL agent.")
    args = parser.parse_args()

    if args.question:
        run(question=args.question)
    else:
        try:
            question = input("💬 Enter your question for the agent: ").strip()
            run(question if question else DEFAULT_QUESTION)
        except KeyboardInterrupt:
            warning("❗ Script interrupted by user.")
