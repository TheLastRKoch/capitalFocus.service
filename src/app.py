from environment import (FLASK_HOST, FLASK_PORT, FLASK_DEBUG, FLASK_SECRET_KEY)

from controllers.budgets import init_budgets_blueprint
from controllers.transactions import init_transactions_blueprint

from flask import Flask

app = Flask(__name__)

# Security
app.secret_key = FLASK_SECRET_KEY

# register blueprints
app.register_blueprint(init_budgets_blueprint())
app.register_blueprint(init_transactions_blueprint())

if __name__ == "__main__":
    app.run(host=FLASK_HOST, port=FLASK_PORT, debug=FLASK_DEBUG)
