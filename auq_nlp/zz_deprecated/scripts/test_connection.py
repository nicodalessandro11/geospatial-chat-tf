"""
Script: test_connection.py

-  Test connection to Supabase PostgreSQL database
-  Check PostgreSQL version
-  Print success or failure message

Author: Nicolas Dalessandro
Email: nicodalessandro11@gmail.com
Date: 2025-04-21
Version: 1.0.0
License: MIT License (see LICENSE file for details)
"""

import os
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()
SUPABASE_URI = os.getenv('SUPABASE_URI')

try:
    conn = psycopg2.connect(SUPABASE_URI)
    cur = conn.cursor()
    cur.execute("SELECT version();")
    db_version = cur.fetchone()
    print("✅ Connected successfully!")
    print("📦 PostgreSQL version:", db_version[0])
    cur.close()
    conn.close()
except Exception as e:
    print("❌ Connection failed!")
    print(e)
