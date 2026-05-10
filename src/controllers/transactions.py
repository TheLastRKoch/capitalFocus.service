from flask import Blueprint, render_template

prefix = 'transactions'
bp = Blueprint(prefix, __name__, url_prefix=f"/{prefix}")


@bp.route('/')
def index() -> str:
    """
    Render the main transactions page.

    Returns:
        str: The rendered HTML for the transactions uncategorize page.
    """
    return render_template('transactions/uncategorize.jinja2')


@bp.route('/uncategorize')
def uncategorize() -> str:
    """
    Render the uncategorized transactions page.

    Returns:
        str: The rendered HTML for the transactions uncategorize page.
    """
    return render_template('transactions/uncategorize.html')
