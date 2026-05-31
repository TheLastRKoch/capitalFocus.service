from flask import Blueprint, jsonify, Response, request
from repositories.budgets import BudgetsRepository
from repositories.sections import SectionsRepository
from services.budgets import BudgetService
from services.teable import TeableService
from environment import Config

prefix = 'api/budgets'
bp = Blueprint(prefix, __name__, url_prefix=f'/{prefix}')

# Dependency Setup
teable_service = TeableService(Config.TEABLE_API_TOKEN, Config.TEABLE_URL)
budgets_repo = BudgetsRepository(teable_service, Config.TEABLE_BUDGETS)
sections_repo = SectionsRepository(teable_service, Config.TEABLE_SECTIONS)
transactions_repo = None  # Lazy load if needed or instantiate here
# Wait, I need TransactionsRepo for BudgetService
from repositories.transactions import TransactionsRepository

transactions_repo = TransactionsRepository(teable_service,
                                           Config.TEABLE_TRANSACTIONS)

budget_service = BudgetService(budgets_repo, sections_repo, transactions_repo)


@bp.route('/', methods=['GET'])
def index() -> tuple[Response, int]:
    return jsonify(budgets_repo.all()), 200


@bp.route('/active', methods=['GET'])
def active() -> tuple[Response, int]:
    return jsonify(budgets_repo.get_by_status('Active')), 200


@bp.route('/inactive', methods=['GET'])
def inactive() -> tuple[Response, int]:
    return jsonify(budgets_repo.get_by_status('Inactive')), 200


@bp.route('/<string:id>', methods=['GET'])
def get_by_id(id: str) -> tuple[Response, int]:
    return jsonify(budget_service.get_budget_details(id)), 200


@bp.route('/', methods=['POST'])
def create() -> tuple[Response, int]:
    data = request.json
    return jsonify(budget_service.create_budget(data)), 201


@bp.route('/<string:id>/sections', methods=['POST'])
def create_section(id: str) -> tuple[Response, int]:
    data = request.json
    return jsonify(budget_service.create_section(id, data)), 201
