from flask import Blueprint, render_template

prefix = 'budgets'
bp = Blueprint(prefix, __name__, url_prefix=f"/{prefix}")


@bp.route('/')
def index():
    return render_template('budgets/list.html')


@bp.route('/<string:id>')
def details(id):
    return render_template('budgets/details.html')
