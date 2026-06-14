#!/usr/bin/env bash

python3 src/manage.py wait_for_db; python3 src/manage.py migrate; python3 src/manage.py runserver 0.0.0.0:8080