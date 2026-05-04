from environment import (FLASK_HOST, FLASK_PORT, FLASK_DEBUG, FLASK_SECRET_KEY)

from controllers.budgets import bp as budget
from controllers.transactions import bp as transactions
from api.budgets import bp as budgets_api
from api.transactions import bp as transactions_api

from flask import Flask

app = Flask(__name__)

# Security
app.secret_key = FLASK_SECRET_KEY

# Controller blueprints
app.register_blueprint(budget)
app.register_blueprint(transactions)

# API blueprints
app.register_blueprint(budgets_api)
app.register_blueprint(transactions_api)

if __name__ == "__main__":
    app.run(host=FLASK_HOST, port=FLASK_PORT, debug=FLASK_DEBUG)
