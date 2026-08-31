from django import forms
from categories.models import SubcategoriesModel


class SubcategoryModelChoiceField(forms.ModelChoiceField):
    """Custom ModelChoiceField formatting options as (parent category) sub category"""

    def label_from_instance(self, obj):
        return f"({obj.parent.label}) {obj.label}"


class SubcategorySelectForm(forms.Form):
    """Form used in the intermediate Django admin page to select a subcategory."""

    subcategory = SubcategoryModelChoiceField(
        queryset=SubcategoriesModel.objects.select_related('parent').order_by('parent__label', 'label'),
        required=True,
        empty_label="- Select a subcategory -",
        label="Subcategory"
    )
