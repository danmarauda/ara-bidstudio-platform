from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class UsersConfig(AppConfig):
    name = "opencontractserver.users"
    verbose_name = _("Users")

    def ready(self):
        import posthog
        from django.conf import settings

        # Initialize PostHog globally as per official Django integration
        if settings.TELEMETRY_ENABLED:
            posthog.api_key = settings.POSTHOG_API_KEY
            posthog.host = settings.POSTHOG_HOST

        try:
            import opencontractserver.users.signals  # noqa F401
        except ImportError:
            pass
