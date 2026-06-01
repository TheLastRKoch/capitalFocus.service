from budgets.models import Budget, Section
from transactions.models import Transaction

class BudgetService:
    """Service for orchestrating budget-related data operations via Django ORM."""

    def get_budget_details(self, budget_id: int) -> dict:
        """
        Retrieve full details for a budget, including sections and transactions.
        """
        try:
            budget = Budget.objects.prefetch_related('sections', 'sections__transactions').get(id=budget_id)
        except Budget.DoesNotExist:
            raise ValueError(f'Budget with id {budget_id} not found')

        sections_data = []
        for section in budget.sections.all():
            transactions_data = []
            for transaction in section.transactions.all():
                transactions_data.append({
                    "id": transaction.id,
                    "fields": {
                        "date": transaction.date.isoformat(),
                        "amount": float(transaction.amount),
                        "commerce": transaction.commerce,
                        "status": transaction.status
                    }
                })
            
            sections_data.append({
                "id": section.id,
                "fields": {
                    "label": section.label,
                    "projection": float(section.projection),
                    "category": section.category,
                    "transactions": transactions_data
                }
            })

        return {
            "id": budget.id,
            "fields": {
                "name": budget.name,
                "projection": float(budget.projection),
                "status": budget.status,
                "sections": sections_data
            }
        }

    def create_budget(self, budget_data: dict) -> dict:
        """
        Create a new budget record.
        """
        # Map frontend names to model names if necessary
        # JS sends 'budgetName' and 'initialSalary' in the modal
        # But wait, api_index in budgets/views.py receives 'data' from JSON.
        # Let's check budgets/list.js to see what it sends.
        
        name = budget_data.get('name') or budget_data.get('budgetName')
        projection = budget_data.get('projection') or budget_data.get('initialSalary')
        
        budget = Budget.objects.create(
            name=name,
            projection=projection,
            status=budget_data.get('status', 'Active')
        )
        
        return {
            "id": budget.id,
            "fields": {
                "name": budget.name,
                "projection": float(budget.projection),
                "status": budget.status
            }
        }

    def create_section(self, budget_id: int, section_data: dict) -> dict:
        """
        Create a new section record linked to a budget.
        """
        budget = Budget.objects.get(id=budget_id)
        
        # JS sends 'label' and 'projection'
        label = section_data.get('label') or section_data.get('newCategoryName')
        projection = section_data.get('projection') or section_data.get('newCategoryBudget')
        
        section = Section.objects.create(
            label=label,
            projection=projection,
            category=section_data.get('category'),
            budget=budget
        )
        
        return {
            "id": section.id,
            "fields": {
                "label": section.label,
                "projection": float(section.projection),
                "category": section.category
            }
        }
