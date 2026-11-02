import time
from django.db import connections
from django.db.utils import OperationalError
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    """Django command to pause execution until the database is available (max 3 retries)"""

    help = "Pauses execution until the default database is available, up to 3 times"

    def handle(self, *args, **options):
        self.stdout.write("Waiting for database...")
        db_conn = None
        retries = 0
        max_retries = 3
        
        while not db_conn and retries < max_retries:
            try:
                # Attempt to get the default database connection
                db_conn = connections['default']
                
                # Force a connection attempt to ensure it's actually alive
                db_conn.cursor()
            except OperationalError:
                retries += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"Database unavailable (Attempt {retries}/{max_retries}). Waiting 2 seconds..."
                    )
                )
                time.sleep(2)

        if not db_conn:
            self.stdout.write(self.style.ERROR("Database connection failed after 3 attempts."))
            raise SystemExit(1)  # Exits with a failure code to halt Docker/CI pipelines

        self.stdout.write(self.style.SUCCESS("Database available!"))