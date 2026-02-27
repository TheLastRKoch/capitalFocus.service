from dotenv import load_dotenv
from os import environ as env

# Load environment variables from .env file
load_dotenv()

TEABLE_API_KEY = env["TEABLE_API_KEY"]
TEABLE_BASE_URL = env["TEABLE_BASE_URL"]