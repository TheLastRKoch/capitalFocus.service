from flask import Blueprint, jsonify, Response
from repositories.transactions import TransactionsRepository
from services.teable import TeableService
from environment import Config

prefix = 'api/transactions'
bp = Blueprint(prefix, __name__, url_prefix=f'/{prefix}')

# Dependency Setup
teable_service = TeableService(Config.TEABLE_API_TOKEN, Config.TEABLE_URL)
transactions_repo = TransactionsRepository(teable_service, Config.TEABLE_TRANSACTIONS)

@bp.route('/', methods=['GET'])
def index() -> tuple[Response, int]:
    return jsonify(transactions_repo.all()), 200

@bp.route('/uncategorize', methods=['GET'])
def uncategorize() -> tuple[Response, int]:
    return jsonify(transactions_repo.get_uncategorized()), 200
