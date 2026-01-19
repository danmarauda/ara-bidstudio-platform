from django.db import models
from django.db.models import Q
from django.utils import timezone
from django_cte import CTEQuerySet
from tree_queries.query import TreeQuerySet

from opencontractserver.shared.mixins import VectorSearchViaEmbeddingMixin


class PermissionedTreeQuerySet(TreeQuerySet):
    def approved(self):
        return self.filter(approved=True)

    def rejected(self):
        return self.filter(rejected=True)

    def pending(self):
        return self.filter(approved=False, rejected=False)

    def recent(self, days=30):
        recent_date = timezone.now() - timezone.timedelta(days=days)
        return self.filter(created__gte=recent_date)

    def with_comments(self):
        return self.exclude(comment="")

    def by_creator(self, creator):
        return self.filter(creator=creator)

    def visible_to_user(self, user):
        """
        Gets queryset with_tree_fields that is visible to user. At moment, we're JUST filtering
        on creator and is_public, BUT this will filter on per-obj permissions later.
        """
        # Handle None user as anonymous
        if user is None:
            from django.contrib.auth.models import AnonymousUser

            user = AnonymousUser()

        if hasattr(user, "is_superuser") and user.is_superuser:
            return self.all().order_by("created")

        if user.is_anonymous or not hasattr(user, "is_authenticated"):
            queryset = self.filter(Q(is_public=True)).distinct()
        else:
            # Try to use Guardian's permission system for authenticated users
            from guardian.shortcuts import get_objects_for_user

            try:
                # Get objects the user has read permission for via Guardian
                model_name = self.model._meta.model_name
                app_label = self.model._meta.app_label
                perm = f"{app_label}.read_{model_name}"

                # Get objects user has permission for
                permitted_objects = get_objects_for_user(
                    user,
                    perm,
                    klass=self.model,
                    accept_global_perms=False,
                    with_superuser=False,
                )

                # Get the IDs of permitted objects
                permitted_ids = list(permitted_objects.values_list("id", flat=True))

                # Combine: creator OR public OR has explicit permission
                queryset = self.filter(
                    Q(creator=user) | Q(is_public=True) | Q(id__in=permitted_ids)
                ).distinct()

            except (ImportError, Exception):
                # Fall back to creator/public check only if Guardian not available
                queryset = self.filter(Q(creator=user) | Q(is_public=True)).distinct()

        # Apply model-specific optimizations
        model_name = self.model._meta.model_name
        if model_name == "corpus":
            queryset = queryset.select_related(
                "creator",
                "label_set",
                "user_lock",
            ).prefetch_related("documents")

        return queryset.with_tree_fields()

    def with_tree_fields(self):
        return super().with_tree_fields()


class UserFeedbackQuerySet(models.QuerySet):
    def approved(self):
        return self.filter(approved=True)

    def rejected(self):
        return self.filter(rejected=True)

    def pending(self):
        return self.filter(approved=False, rejected=False)

    def recent(self, days=30):
        recent_date = timezone.now() - timezone.timedelta(days=days)
        return self.filter(created__gte=recent_date)

    def with_comments(self):
        return self.exclude(comment="")

    def by_creator(self, creator):
        return self.filter(creator=creator)

    def visible_to_user(self, user):
        if user.is_superuser:
            return self.all()

        if user.is_anonymous:
            return self.filter(Q(is_public=True)).distinct()

        # UserFeedback is visible if:
        # 1. Created by the user, OR
        # 2. Is public, OR
        # 3. Has a commented_annotation that is public (handle NULL case)

        result = self.filter(
            Q(creator=user)
            | Q(is_public=True)
            | (
                Q(commented_annotation__isnull=False)
                & Q(commented_annotation__is_public=True)
            )
        ).distinct()

        return result


class PermissionQuerySet(models.QuerySet):
    def visible_to_user(self, user, perm=None):

        if user.is_superuser:
            return self.all()

        # model = self.model
        # content_type = ContentType.objects.get_for_model(model)
        #
        # # Determine the permission codename
        # permission_codename = f'{perm}_{model._meta.model_name}'
        #
        # # User permission subquery
        # user_perm = UserObjectPermission.objects.filter(
        #     content_type=content_type,
        #     user=user,
        #     permission__codename=permission_codename,
        #     object_pk=OuterRef('pk')
        # )
        #
        # # Group permission subquery
        # group_perm = GroupObjectPermission.objects.filter(
        #     content_type=content_type,
        #     group__user=user,
        #     permission__codename=permission_codename,
        #     object_pk=OuterRef('pk')
        # )

        # Construct the base queryset
        # queryset = self.annotate(
        #     has_user_perm=Exists(user_perm),
        #     has_group_perm=Exists(group_perm)
        # )

        # Filter based on permissions and public status - TODO - make this work for user/obj instance level sharing
        # permission_filter = Q(has_user_perm=True) | Q(has_group_perm=True) | Q(is_public=True)
        permission_filter = Q(is_public=True)
        if not user.is_anonymous:
            permission_filter |= Q(creator=user)

        # # Add extra conditions based on permission type
        # if perm == 'read':
        #     # For read permission, include objects created by the user
        #     permission_filter |= Q(creator=user)
        # elif perm == 'publish':
        #     # For publish permission, only include objects created by the user
        #     permission_filter &= Q(creator=user)

        return self.filter(permission_filter).distinct()


class DocumentQuerySet(PermissionQuerySet, VectorSearchViaEmbeddingMixin):
    """
    Custom QuerySet for Document that includes both permission filtering
    (PermissionQuerySet) and vector-based search (VectorSearchViaEmbeddingMixin).
    """

    # If your Embedding related_name on Document is not "embeddings",
    # override the Mixin attribute here:
    # EMBEDDING_RELATED_NAME = "my_custom_related_name"
    pass


class AnnotationQuerySet(
    CTEQuerySet, PermissionQuerySet, VectorSearchViaEmbeddingMixin
):
    """
    Custom QuerySet for Annotation model, combining:
      - CTEQuerySet for recursive common table expressions
      - PermissionQuerySet for permission-based filtering
      - VectorSearchViaEmbeddingMixin for vector-based search

    Example:
        class AnnotationQuerySet(CTEQuerySet, PermissionQuerySet, VectorSearchViaEmbeddingMixin):
            EMBEDDING_RELATED_NAME = "embeddings"  # or whatever your FK related_name is
    """

    def visible_to_user(self, user, perm=None):
        """
        Override to properly handle annotation privacy model.
        This ensures that even when AnnotationQueryOptimizer isn't used,
        the privacy model is still respected.
        """
        from opencontractserver.analyzer.models import (
            Analysis,
            AnalysisUserObjectPermission,
        )
        from opencontractserver.extracts.models import (
            Extract,
            ExtractUserObjectPermission,
        )

        # Superusers see everything
        if user.is_superuser:
            return self.all()

        # Start with base queryset
        qs = self.all()

        # For anonymous users, only show public structural annotations
        if user.is_anonymous:
            return qs.filter(
                Q(structural=True)
                & Q(document__is_public=True)
                & (Q(corpus__isnull=True) | Q(corpus__is_public=True))
            )

        # Build visibility filters for analyses
        visible_analyses = Analysis.objects.filter(Q(is_public=True) | Q(creator=user))
        analyses_with_permission = AnalysisUserObjectPermission.objects.filter(
            user=user
        ).values_list("content_object_id", flat=True)
        visible_analyses = visible_analyses | Analysis.objects.filter(
            id__in=analyses_with_permission
        )

        # Build visibility filters for extracts
        visible_extracts = Extract.objects.filter(Q(creator=user))
        extracts_with_permission = ExtractUserObjectPermission.objects.filter(
            user=user
        ).values_list("content_object_id", flat=True)
        visible_extracts = visible_extracts | Extract.objects.filter(
            id__in=extracts_with_permission
        )

        # Complex filter for annotation visibility
        # An annotation is visible if:
        # 1. It's structural (always visible if doc is visible)
        # 2. User created it
        # 3. It's not private to an analysis/extract OR user has access to that analysis/extract
        # 4. AND user has access to the document and corpus
        visibility_filter = (
            # Structural annotations (always visible if doc is readable)
            Q(structural=True)
            |
            # User's own annotations
            Q(creator=user)
            |
            # Regular annotations (no privacy fields)
            (Q(created_by_analysis__isnull=True) & Q(created_by_extract__isnull=True))
            |
            # Analysis-created annotations user can see
            (Q(created_by_analysis__in=visible_analyses))
            |
            # Extract-created annotations user can see
            (Q(created_by_extract__in=visible_extracts))
        )

        # Also need document/corpus visibility
        doc_corpus_filter = (
            Q(document__is_public=True) | Q(document__creator=user)
        ) & (
            Q(corpus__isnull=True) | Q(corpus__is_public=True) | Q(corpus__creator=user)
        )

        return qs.filter(visibility_filter & doc_corpus_filter).distinct()


class NoteQuerySet(CTEQuerySet, PermissionQuerySet, VectorSearchViaEmbeddingMixin):
    """
    Custom QuerySet for Note model, combining:
      - CTEQuerySet
      - PermissionQuerySet
      - VectorSearchViaEmbeddingMixin
    """

    pass
