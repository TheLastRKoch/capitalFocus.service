from dotenv import load_dotenv
from os import environ as env

load_dotenv()

TEABLE_URL = "https://app.teable.ai"
TEABLE_API_TOKEN = env.get("TEABLE_API_TOKEN")
TEABLE_TRANSACTIONS = env.get("TEABLE_TRANSACTIONS")
TEABLE_BUDGETS = env.get("TEABLE_BUDGETS")

FLASK_HOST = "0.0.0.0"
FLASK_PORT = "8080"
FLASK_DEBUG = True
FLASK_SECRET_KEY = "ThisIsASecret"