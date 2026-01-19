from django.apps import AppConfig
from django.db.models.signals import post_save
from django.utils.translation import gettext_lazy as _


class DocumentsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "opencontractserver.documents"
    verbose_name = _("Documents")

    def ready(self):
        try:
            import opencontractserver.documents.signals  # noqa F401
            from opencontractserver.documents.models import Document
            from opencontractserver.documents.signals import (
                DOC_CREATE_UID,
                connect_corpus_document_signals,
                process_doc_on_create_atomic,
            )

            # DOCUMENT SIGNALS #########################################################################################
            # When a new doc is created, queue a PAWLS token extract job
            post_save.connect(
                process_doc_on_create_atomic,
                sender=Document,
                dispatch_uid=DOC_CREATE_UID,
            )

            # Connect the m2m_changed signal for when documents are added to corpuses
            connect_corpus_document_signals()

            # STORAGE WARMING ##########################################################################################
            # Pre-warm the storage backend to avoid ~400ms cold start on first file URL access
            # Run synchronously to ensure the main process gets warmed
            from opencontractserver.utils.storage_warming import warm_storage_backend

            warm_storage_backend()

        except ImportError:
            pass
