"""
Comprehensive tests for BaseVisibilityManager to ensure full coverage
of all edge cases and code paths in the visible_to_user method.
"""

from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.test import TestCase

from opencontractserver.corpuses.models import Corpus
from opencontractserver.documents.models import Document
from opencontractserver.types.enums import PermissionTypes
from opencontractserver.utils.permissioning import set_permissions_for_obj_to_user

User = get_user_model()


class BaseVisibilityManagerTestCase(TestCase):
    """Test BaseVisibilityManager.visible_to_user() for complete coverage"""

    def setUp(self):
        """Set up test users and objects"""
        self.superuser = User.objects.create_user(
            username="superuser", password="password", is_superuser=True
        )
        self.owner = User.objects.create_user(username="owner", password="password")
        self.other_user = User.objects.create_user(
            username="other", password="password"
        )

        # Create test corpuses
        self.public_corpus = Corpus.objects.create(
            title="Public Corpus", creator=self.owner, is_public=True
        )
        self.private_corpus = Corpus.objects.create(
            title="Private Corpus", creator=self.owner, is_public=False
        )
        self.shared_corpus = Corpus.objects.create(
            title="Shared Corpus", creator=self.owner, is_public=False
        )

        # Grant read permission on shared corpus to other_user
        set_permissions_for_obj_to_user(
            self.other_user, self.shared_corpus, [PermissionTypes.READ]
        )

        # Create test documents
        self.public_doc = Document.objects.create(
            title="Public Doc", creator=self.owner, is_public=True
        )
        self.private_doc = Document.objects.create(
            title="Private Doc", creator=self.owner, is_public=False
        )

    def test_visible_to_user_with_none_user(self):
        """Test that None user is treated as AnonymousUser - covers line 54-55"""
        corpuses = Corpus.objects.visible_to_user(user=None)
        # Should only see public corpus
        self.assertEqual(corpuses.count(), 1)
        self.assertIn(self.public_corpus, corpuses)

    def test_visible_to_user_superuser_sees_everything(self):
        """Test that superuser sees all objects - covers line 58-59"""
        corpuses = Corpus.objects.visible_to_user(self.superuser)
        # Superuser should see all 3 corpuses
        self.assertEqual(corpuses.count(), 3)
        self.assertIn(self.public_corpus, corpuses)
        self.assertIn(self.private_corpus, corpuses)
        self.assertIn(self.shared_corpus, corpuses)

    def test_visible_to_user_anonymous_only_sees_public(self):
        """Test that anonymous user only sees public objects - covers line 62-63"""
        anonymous = AnonymousUser()
        corpuses = Corpus.objects.visible_to_user(anonymous)
        # Anonymous should only see public corpus
        self.assertEqual(corpuses.count(), 1)
        self.assertIn(self.public_corpus, corpuses)

    def test_visible_to_user_authenticated_user_with_permissions(self):
        """Test authenticated user sees public + owned + explicitly shared - covers lines 95-121"""
        corpuses = Corpus.objects.visible_to_user(self.other_user)
        # Should see public corpus and shared corpus (has explicit permission)
        self.assertEqual(corpuses.count(), 2)
        self.assertIn(self.public_corpus, corpuses)
        self.assertIn(self.shared_corpus, corpuses)
        self.assertNotIn(self.private_corpus, corpuses)

    def test_visible_to_user_owner_sees_own_objects(self):
        """Test that owner sees all their own objects"""
        corpuses = Corpus.objects.visible_to_user(self.owner)
        # Owner should see all 3 corpuses they created
        self.assertEqual(corpuses.count(), 3)
        self.assertIn(self.public_corpus, corpuses)
        self.assertIn(self.private_corpus, corpuses)
        self.assertIn(self.shared_corpus, corpuses)

    def test_corpus_specific_optimizations_applied(self):
        """Test that Corpus-specific optimizations are applied - covers lines 123-133"""
        # This test ensures the code path for model_name.upper() == "CORPUS" is hit
        # We verify this by checking the queryset executes successfully with optimizations
        corpuses = Corpus.objects.visible_to_user(self.owner)

        # Force evaluation to ensure optimization code path is executed
        corpus_list = list(corpuses)

        # Verify results are correct
        self.assertEqual(len(corpus_list), 3)

    def test_document_specific_optimizations_applied(self):
        """Test that Document-specific optimizations are applied - covers lines 134-177"""
        # This test ensures the code path for model_name.upper() == "DOCUMENT" is hit
        # We verify this by checking the queryset executes successfully with optimizations
        documents = Document.objects.visible_to_user(self.owner)

        # Force evaluation to ensure optimization code path is executed
        doc_list = list(documents)

        # Verify results are correct
        self.assertEqual(len(doc_list), 2)

    def test_distinct_applied_for_authenticated_non_superuser(self):
        """Test that distinct() is applied for authenticated non-superuser users - covers line 182-184"""
        # Grant multiple permissions to create potential duplicates
        set_permissions_for_obj_to_user(
            self.other_user, self.private_corpus, [PermissionTypes.READ]
        )

        corpuses = Corpus.objects.visible_to_user(self.other_user)
        corpus_ids = list(corpuses.values_list("id", flat=True))

        # Ensure no duplicates (distinct was applied)
        self.assertEqual(len(corpus_ids), len(set(corpus_ids)))

    def test_distinct_not_applied_for_superuser(self):
        """Test that distinct() is not applied for superuser - covers line 182-184"""
        # The superuser path should not apply distinct
        corpuses = Corpus.objects.visible_to_user(self.superuser)
        # Should still work correctly
        self.assertEqual(corpuses.count(), 3)

    def test_distinct_not_applied_for_anonymous(self):
        """Test that distinct() is not applied for anonymous users - covers line 182-184"""
        anonymous = AnonymousUser()
        corpuses = Corpus.objects.visible_to_user(anonymous)
        # Should still work correctly
        self.assertEqual(corpuses.count(), 1)

    @patch("django.apps.apps.get_model")
    def test_exception_fallback_to_creator_public_filter(self, mock_get_model):
        """Test exception handling falls back to creator/public filter - covers lines 188-196"""
        # Make apps.get_model raise an ImportError to trigger exception handling
        mock_get_model.side_effect = ImportError("Mocked ImportError")

        corpuses = Corpus.objects.visible_to_user(self.other_user)
        corpus_list = list(corpuses)

        # Should only see public corpus (fallback to creator/public filtering)
        self.assertEqual(len(corpus_list), 1)
        self.assertIn(self.public_corpus, corpus_list)

    @patch("django.apps.apps.get_model")
    def test_general_exception_fallback(self, mock_get_model):
        """Test general exception handling falls back to creator/public filter - covers lines 188-196"""
        # Make apps.get_model raise a general exception to trigger exception handling
        mock_get_model.side_effect = Exception("Mocked general exception")

        corpuses = Corpus.objects.visible_to_user(self.other_user)
        corpus_list = list(corpuses)

        # Should only see public corpus (fallback to creator/public filtering)
        self.assertEqual(len(corpus_list), 1)
        self.assertIn(self.public_corpus, corpus_list)

    @patch("django.apps.apps.get_model")
    def test_lookup_error_fallback_within_legacy_logic(self, mock_get_model):
        """Test LookupError fallback within legacy logic - covers lines 112-120"""
        # Make apps.get_model raise LookupError (permission model not found)
        mock_get_model.side_effect = LookupError("Permission model not found")

        corpuses = Corpus.objects.visible_to_user(self.other_user)
        corpus_list = list(corpuses)

        # Should see public corpus (fallback to creator/public check)
        self.assertEqual(len(corpus_list), 1)
        self.assertIn(self.public_corpus, corpus_list)

    def test_authenticated_user_permissions_via_guardian(self):
        """Test that authenticated users get proper permission filtering - covers lines 95-121"""
        # Create a corpus with no explicit permissions for other_user
        isolated_corpus = Corpus.objects.create(
            title="Isolated Corpus", creator=self.owner, is_public=False
        )

        corpuses = Corpus.objects.visible_to_user(self.other_user)

        # other_user should see: public_corpus and shared_corpus (has permission)
        # but NOT private_corpus or isolated_corpus
        self.assertEqual(corpuses.count(), 2)
        self.assertIn(self.public_corpus, corpuses)
        self.assertIn(self.shared_corpus, corpuses)
        self.assertNotIn(self.private_corpus, corpuses)
        self.assertNotIn(isolated_corpus, corpuses)

    def test_none_user_within_legacy_logic(self):
        """Test None user handling within legacy logic - covers line 87-88"""
        # This tests the specific branch where user is None in the legacy logic
        # We already have test_visible_to_user_with_none_user, but this ensures
        # the specific line 87-88 is hit
        corpuses = Corpus.objects.visible_to_user(None)
        self.assertEqual(corpuses.count(), 1)
        self.assertIn(self.public_corpus, corpuses)

    def test_superuser_within_legacy_logic(self):
        """Test superuser handling within legacy logic - covers line 89-91"""
        corpuses = Corpus.objects.visible_to_user(self.superuser)
        # Should see all corpuses and be ordered by created
        self.assertEqual(corpuses.count(), 3)
        # Verify ordering by created
        corpus_list = list(corpuses)
        self.assertEqual(
            corpus_list,
            sorted(corpus_list, key=lambda x: x.created),
        )

    def test_anonymous_within_legacy_logic(self):
        """Test anonymous user handling within legacy logic - covers line 92-94"""
        anonymous = AnonymousUser()
        corpuses = Corpus.objects.visible_to_user(anonymous)
        self.assertEqual(corpuses.count(), 1)
        self.assertIn(self.public_corpus, corpuses)
