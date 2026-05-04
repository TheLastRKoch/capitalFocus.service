from flask import Blueprint, render_template

prefix = 'transactions'
bp = Blueprint(prefix, __name__, url_prefix=f"/{prefix}")


@bp.route('/')
def index():
    return render_template('transactions/uncategorize.jinja2')


@bp.route('/uncategorize')
def uncategorize():
    return render_template('transactions/uncategorize.jinja2')
