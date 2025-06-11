"""
Test Supabase connection and configuration

- Loads environment variables from .env file
- Creates a Supabase client with the provided URL and key
- Checks if the connection is successful with a simple query
- Prints the response

Author: Nico D'Alessandro Calderon
Email:  nico.dalessandro@gmail.com
Date: 2025-05-20
Version: 1.0.0
License: MIT
"""

from dotenv import load_dotenv
import os
from supabase import create_client, Client

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

print("Testing Supabase connection...")
print(f"URL: {SUPABASE_URL}")
print(f"KEY: {'Loaded' if SUPABASE_KEY else 'Not loaded'}")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    # Check if the connection is successful with a simple query
    response = supabase.table("districts").select("*").limit(1).execute()
    print("Connection successful! Example response:", response.data)
except Exception as e:
    print("Error connecting to Supabase:", e)