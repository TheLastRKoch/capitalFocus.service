from flask import Blueprint, render_template


def init_transactions_blueprint():
    bp = Blueprint('transactions', __name__)

    @bp.route('/uncategorize')
    def index():
        return render_template('transactions/uncategorize.html')

    return bp