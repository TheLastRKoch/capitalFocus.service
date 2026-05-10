from environment import Config
from controllers.budgets import bp as budget
from controllers.transactions import bp as transactions
from api.budgets import bp as budgets_api
from api.transactions import bp as transactions_api

from flask import Flask

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Security
    app.secret_key = config_class.FLASK_SECRET_KEY

    # Controller blueprints
    app.register_blueprint(budget)
    app.register_blueprint(transactions)

    # API blueprints
    app.register_blueprint(budgets_api)
    app.register_blueprint(transactions_api)
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(
        host=Config.FLASK_HOST,
        port=Config.FLASK_PORT,
        debug=Config.FLASK_DEBUG
    )
