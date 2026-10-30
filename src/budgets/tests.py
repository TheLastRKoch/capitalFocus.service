import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

from budgets.models import BudgetsModel
from core.repositories.budgets import BudgetsRepository
from core.repositories.categories import CategoriesRepository, SubcategoriesRepository
from core.repositories.sections import SectionsRepository
from core.repositories.transactions import TransactionsRepository
from core.services.budgets import (BudgetOwnerConfigurationError, BudgetService, BudgetValidationError)


class BudgetServiceCreateTests(TestCase):
    """Service-level tests for default-owner assignment and input validation."""

    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.owner = user_model.objects.create_user(username='rkoch', password='test-pass')
        cls.other = user_model.objects.create_user(username='other', password='test-pass')

    def setUp(self):
        self.service = BudgetService(BudgetsRepository(), SectionsRepository(), TransactionsRepository(),
                                     CategoriesRepository(), SubcategoriesRepository())

    @override_settings(DEFAULT_BUDGET_OWNER_USERNAME='rkoch')
    def test_create_budget_assigns_default_owner_and_trims_label(self):
        created = self.service.create_budget({'label': '  October  ', 'projection': 5000})

        self.assertEqual(created['label'], 'October')
        self.assertEqual(created['user'], self.owner.id)
        self.assertEqual(created['status'], 'Active')
        self.assertEqual(BudgetsModel.objects.get(pk=created['id']).user_id, self.owner.id)

    @override_settings(DEFAULT_BUDGET_OWNER_USERNAME='rkoch')
    def test_client_supplied_owner_is_ignored(self):
        created = self.service.create_budget({
            'label': 'October',
            'projection': 1,
            'user_id': self.other.id,
            'user': self.other.id,
        })

        self.assertEqual(created['user'], self.owner.id)
        self.assertNotEqual(created['user'], self.other.id)

    @override_settings(DEFAULT_BUDGET_OWNER_USERNAME='ghost')
    def test_missing_owner_raises_configuration_error(self):
        with self.assertRaises(BudgetOwnerConfigurationError):
            self.service.create_budget({'label': 'October', 'projection': 1})

        self.assertEqual(BudgetsModel.objects.count(), 0)

    @override_settings(DEFAULT_BUDGET_OWNER_USERNAME='rkoch')
    def test_invalid_label_is_rejected(self):
        for label in (None, '', '   ', 'x' * 256, 123):
            with self.subTest(label=label):
                with self.assertRaises(BudgetValidationError):
                    self.service.create_budget({'label': label, 'projection': 1})

        self.assertEqual(BudgetsModel.objects.count(), 0)

    @override_settings(DEFAULT_BUDGET_OWNER_USERNAME='rkoch')
    def test_invalid_projection_is_rejected(self):
        for projection in (None, 'abc', '', -1, True, 0.001, float('nan'), float('inf')):
            with self.subTest(projection=projection):
                with self.assertRaises(BudgetValidationError):
                    self.service.create_budget({'label': 'October', 'projection': projection})

        self.assertEqual(BudgetsModel.objects.count(), 0)

    @override_settings(DEFAULT_BUDGET_OWNER_USERNAME='rkoch')
    def test_invalid_status_is_rejected(self):
        with self.assertRaises(BudgetValidationError):
            self.service.create_budget({'label': 'October', 'projection': 1, 'status': 'Archived'})

        self.assertEqual(BudgetsModel.objects.count(), 0)


class BudgetCreateAPITests(TestCase):
    """API-level tests for POST /api/budgets/ and preserved read endpoints."""

    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.owner = user_model.objects.create_user(username='rkoch', password='test-pass')
        cls.other = user_model.objects.create_user(username='other', password='test-pass')

    def post_json(self, payload):
        body = payload if isinstance(payload, str) else json.dumps(payload)
        return self.client.post('/api/budgets/', data=body, content_type='application/json')

    def assert_json_error(self, response, status):
        self.assertEqual(response.status_code, status)
        self.assertEqual(response['Content-Type'], 'application/json')
        body = response.json()
        self.assertIn('error', body)
        return body

    @override_settings(DEFAULT_BUDGET_OWNER_USERNAME='rkoch')
    def test_create_budget_returns_201_and_persists_default_owner(self):
        response = self.post_json({'label': '  October Budget  ', 'projection': 5000})

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response['Content-Type'], 'application/json')
        body = response.json()
        self.assertEqual(body['label'], 'October Budget')
        self.assertEqual(body['status'], 'Active')
        self.assertEqual(body['user'], self.owner.id)
        self.assertEqual(float(body['projection']), 5000)
        self.assertEqual(BudgetsModel.objects.get(pk=body['id']).user_id, self.owner.id)

    @override_settings(DEFAULT_BUDGET_OWNER_USERNAME='rkoch')
    def test_client_supplied_owner_is_ignored(self):
        response = self.post_json({
            'label': 'October',
            'projection': 1,
            'user_id': self.other.id,
            'user': self.other.id,
        })

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['user'], self.owner.id)

    @override_settings(DEFAULT_BUDGET_OWNER_USERNAME='ghost')
    def test_missing_owner_returns_503_without_creating_a_row(self):
        response = self.post_json({'label': 'October', 'projection': 1})

        body = self.assert_json_error(response, 503)
        self.assertIn('owner', body['error'].lower())
        self.assertEqual(BudgetsModel.objects.count(), 0)

    @override_settings(DEFAULT_BUDGET_OWNER_USERNAME='rkoch')
    def test_invalid_label_returns_400_without_creating_a_row(self):
        for label in (None, '', '   ', 'x' * 256):
            with self.subTest(label=label):
                self.assert_json_error(self.post_json({'label': label, 'projection': 1}), 400)

        self.assertEqual(BudgetsModel.objects.count(), 0)

    @override_settings(DEFAULT_BUDGET_OWNER_USERNAME='rkoch')
    def test_invalid_projection_returns_400_without_creating_a_row(self):
        for projection in (None, 'abc', -1, 0.001):
            with self.subTest(projection=projection):
                error = self.assert_json_error(self.post_json({'label': 'October', 'projection': projection}), 400)
                self.assertIn('projection', error['error'].lower())

        self.assertEqual(BudgetsModel.objects.count(), 0)

    @override_settings(DEFAULT_BUDGET_OWNER_USERNAME='rkoch')
    def test_malformed_json_returns_json_400(self):
        body = self.assert_json_error(self.post_json('{not-json'), 400)
        self.assertIn('valid json', body['error'].lower())
        self.assertEqual(BudgetsModel.objects.count(), 0)

    @override_settings(DEFAULT_BUDGET_OWNER_USERNAME='rkoch')
    def test_non_object_json_returns_json_400(self):
        body = self.assert_json_error(self.post_json(json.dumps([1, 2])), 400)
        self.assertIn('json object', body['error'].lower())
        self.assertEqual(BudgetsModel.objects.count(), 0)

    @override_settings(DEFAULT_BUDGET_OWNER_USERNAME='rkoch')
    def test_unexpected_persistence_error_returns_json_5xx_without_traceback(self):
        with patch.object(BudgetsRepository, 'create', side_effect=RuntimeError('boom')):
            response = self.post_json({'label': 'October', 'projection': 1})

        body = self.assert_json_error(response, 500)
        self.assertNotIn('boom', body['error'])
        self.assertNotIn('traceback', response.content.decode().lower())

    @override_settings(DEFAULT_BUDGET_OWNER_USERNAME='rkoch')
    def test_existing_budget_reads_are_unchanged(self):
        budget = BudgetsModel.objects.create(label='August', user=self.owner, status='Active', projection=100)

        all_response = self.client.get('/api/budgets/')
        active_response = self.client.get('/api/budgets/active/')

        self.assertEqual(all_response.status_code, 200)
        self.assertEqual(active_response.status_code, 200)
        self.assertEqual(all_response.json()[0]['label'], 'August')
        self.assertEqual(all_response.json()[0]['id'], budget.id)
        self.assertEqual(active_response.json()[0]['id'], budget.id)
