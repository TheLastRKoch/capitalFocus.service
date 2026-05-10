import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    TEABLE_URL = 'https://app.teable.ai'
    TEABLE_API_TOKEN = os.environ.get('TEABLE_API_TOKEN')
    TEABLE_TRANSACTIONS = os.environ.get('TEABLE_TRANSACTIONS')
    TEABLE_BUDGETS = os.environ.get('TEABLE_BUDGETS')
    TEABLE_SECTIONS = os.environ.get('TEABLE_SECTIONS')

    FLASK_HOST = '0.0.0.0'
    FLASK_PORT = 8080
    FLASK_DEBUG = True
    FLASK_SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'ThisIsASecret')
