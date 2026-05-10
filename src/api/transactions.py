from flask import Blueprint, jsonify, Response
from repositories.transactions import TransactionsRepository

prefix = 'api/transactions'
bp = Blueprint(prefix, __name__, url_prefix=f"/{prefix}")
transactions_repo = TransactionsRepository()


@bp.route('/', methods=['GET'])
def index() -> tuple[Response, int]:
    """
    Retrieve all transactions via the API.

    Returns:
        tuple[Response, int]: A tuple containing the JSON response and the HTTP status code.
    """
    return jsonify(transactions_repo.all()), 200


@bp.route('/uncategorize', methods=['GET'])
def uncategorize() -> tuple[Response, int]:
    """
    Retrieve all uncategorized transactions via the API.

    Returns:
        tuple[Response, int]: A tuple containing the JSON response and the HTTP status code.
    """
    return jsonify(transactions_repo.get_uncategorized()), 200
