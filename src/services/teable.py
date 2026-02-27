from environment import TEABLE_API_KEY, TEABLE_BASE_URL
import requests
import json

class TeableService:

    def __get_headers(self):
        return {'Authorization': f'Bearer {TEABLE_API_KEY}'}

    def __get_table(self, table_id):
        url = f"{TEABLE_BASE_URL}/table/{table_id}/record"
        headers = self.__get_headers()
        response = requests.request("GET", url, headers=headers)
        response.raise_for_status()
        return json.dumps(response.json())
    

    def get_budgets(self):
        return self.__get_table("tbl7WScKn0QzmmopGwR")
    
    def get_transactions(self):
        return self.__get_table("tblMoJ1TPeHAj7pakos")
    
    def get_categories(self):
        return self.__get_table("tblky4yd60Db6Ygqb0F")
    
    def get_sub_categories(self):
        return self.__get_table("tblVebX2IjpZgSMiUF2")
    
    def get_users(self):
        return self.__get_table("tblZzu1wO35gtD7vwio")
