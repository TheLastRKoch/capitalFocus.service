from flask import Blueprint, render_template
from services.transactions import TransactionService

def init_transactions_blueprint():
    bp = Blueprint('transactions', __name__)

    @bp.route('/uncategorize')
    def index():
        transaction_service = TransactionService()
        uncategorized_transactions = transaction_service.get_uncategorized_transactions()
        return render_template('transactions/uncategorize.jinja2', uncategorized_transactions=uncategorized_transactions)

    return bp