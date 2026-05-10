import requests

class TeableService:
    """Service for interacting with the Teable API."""

    def __init__(self, api_token: str, base_url: str) -> None:
        self.api_token = api_token
        self.base_url = base_url

    def __get_headers(self) -> dict[str, str]:
        """
        Generate HTTP headers for Teable API requests.

        Returns:
            dict[str, str]: A dictionary containing the authorization bearer token.
        """
        return {'Authorization': f'Bearer {self.api_token}'}

    def read(self, table_id: str) -> list:
        """
        Read all records from a specific table by its ID.

        Args:
            table_id (str): The unique identifier of the table.

        Returns:
            list: A list of records from the table.
        """
        url = f"{self.base_url}/api/table/{table_id}/record"

        response = requests.get(
            url,
            headers=self.__get_headers(),
        )

        response.raise_for_status()
        return response.json().get("records", [])
