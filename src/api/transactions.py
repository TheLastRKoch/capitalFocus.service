from flask import Blueprint, jsonify
from repositories.transactions import TransactionsRepository

prefix = 'api/transactions'
bp = Blueprint(prefix, __name__, url_prefix=f"/{prefix}")
transactions_repo = TransactionsRepository()


@bp.route('/', methods=['GET'])
def index():
    return jsonify(transactions_repo.all()), 200


@bp.route('/uncategorize', methods=['GET'])
def uncategorize():
    return jsonify(transactions_repo.get_uncategorized()), 200
