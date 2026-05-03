from flask import Blueprint, jsonify
from repositories.budgets import BudgetsRepository

bp = Blueprint('api/budgets', __name__)
budgets_repo = BudgetsRepository()


@bp.route('/', methods=['GET'])
def index():
    return jsonify(budgets_repo.all()), 200

@bp.route('/active', methods=['GET'])
def uncategorize():
    return jsonify(budgets_repo.get_uncategorized()), 200

@bp.route('/inactive', methods=['GET'])
def uncategorize():
    return jsonify(budgets_repo.get_uncategorized()), 200
