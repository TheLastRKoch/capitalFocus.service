from flask import Blueprint, render_template

prefix = 'budgets'
bp = Blueprint(prefix, __name__, url_prefix=f"/{prefix}")


@bp.route('/')
def index() -> str:
    """
    Render the budgets list page.

    Returns:
        str: The rendered HTML for the budgets list page.
    """
    return render_template('budgets/list.html')


@bp.route('/<string:id>')
def details(id: str) -> str:
    """
    Render the details page for a specific budget.

    Args:
        id (str): The unique identifier of the budget.

    Returns:
        str: The rendered HTML for the budget details page.
    """
    return render_template('budgets/details.html')
