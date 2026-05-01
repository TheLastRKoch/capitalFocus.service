from flask import Blueprint, render_template


def init_budgets_blueprint():
    bp = Blueprint('budgets', __name__)

    @bp.route('/budgets')
    def index():
        return render_template('budgets/list.html')

    @bp.route('/budgets/1')
    def budget_details():
        return render_template('budgets/details.html')

    return bp