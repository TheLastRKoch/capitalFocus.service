from flask import Blueprint, jsonify
from repositories.budgets import BudgetsRepository
from repositories.sections import SectionsRepository

prefix = "api/budgets"
bp = Blueprint(prefix, __name__, url_prefix=f"/{prefix}")
budgets_repo = BudgetsRepository()
sections_repo = SectionsRepository()


@bp.route('/', methods=['GET'])
def index():
    return jsonify(budgets_repo.all()), 200


@bp.route('/active', methods=['GET'])
def active():
    return jsonify(budgets_repo.get_by_status('Active')), 200


@bp.route('/<string:budget_id>/sections', methods=['GET'])
def sections(budget_id):
    return jsonify(sections_repo.filter_by_budget(budget_id)), 200


@bp.route('/inactive', methods=['GET'])
def inactive():
    return jsonify(budgets_repo.get_by_status('Inactive')), 200


@bp.route('/<string:id>', methods=['GET'])
def get_by_id(id):
    return jsonify(budgets_repo.get_by_id(id)), 200
