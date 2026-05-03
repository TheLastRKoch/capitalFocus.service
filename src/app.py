from environment import (FLASK_HOST, FLASK_PORT, FLASK_DEBUG, FLASK_SECRET_KEY)

from controllers.budgets import init_budgets_blueprint
from controllers.transactions import init_transactions_blueprint
from api.budgets import bp as budgets_api
from api.transactions import bp as transactions_api

from flask import Flask

app = Flask(__name__)

# Security
app.secret_key = FLASK_SECRET_KEY

# register blueprints
app.register_blueprint(init_budgets_blueprint())
app.register_blueprint(init_transactions_blueprint())

# API blueprints
app.register_blueprint(budgets_api, url_prefix='/api/budgets')
app.register_blueprint(transactions_api, url_prefix='/api/transactions')

if __name__ == "__main__":
    app.run(host=FLASK_HOST, port=FLASK_PORT, debug=FLASK_DEBUG)
