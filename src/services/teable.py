from environment import TEABLE_API_TOKEN, TEABLE_URL

import requests


class TeableService:
    """Service for interacting with the Teable API."""

    def __get_headers(self) -> dict[str, str]:
        """
        Generate HTTP headers for Teable API requests.

        Returns:
            dict[str, str]: A dictionary containing the authorization bearer token.
        """
        return {'Authorization': 'Bearer ' + TEABLE_API_TOKEN}

    def read(self, table_id: str) -> dict:
        """
        Read all records from a specific table by its ID.

        Args:
            table_id (str): The unique identifier of the table.

        Returns:
            dict: The JSON response containing the table records.
        """
        url = f"{TEABLE_URL}/api/table/{table_id}/record"

        response = requests.request(
            "GET",
            url,
            headers=self.__get_headers(),
        )

        response.raise_for_status()
        return response.json().get("records")