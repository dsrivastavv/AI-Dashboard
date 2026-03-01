from __future__ import annotations

from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from monitoring.models import MonitoredServer


class Command(BaseCommand):
    help = "Register (or rotate token for) a monitored server used by remote agents."

    def add_arguments(self, parser):
        parser.add_argument("slug", help="Unique server slug (e.g. gpu-box-01)")
        parser.add_argument("--name", default="", help="Display name shown in the dashboard")
        parser.add_argument("--hostname", default="", help="Optional hostname metadata")
        parser.add_argument("--description", default="", help="Optional description")
        parser.add_argument(
            "--rotate-token",
            action="store_true",
            help="Rotate and print a new ingest token if the server already exists",
        )
        parser.add_argument(
            "--inactive",
            action="store_true",
            help="Create the server in disabled state",
        )

    def handle(self, *args, **options):
        slug = slugify(options["slug"])[:64]
        if not slug:
            raise CommandError("Invalid slug.")

        name = (options["name"] or slug).strip()[:128]
        hostname = (options["hostname"] or "").strip()[:255]
        description = (options["description"] or "").strip()

        server = MonitoredServer.objects.filter(slug=slug).first()
        token_to_show = None

        if server is None:
            token_to_show = MonitoredServer.generate_token()
            server = MonitoredServer(
                slug=slug,
                name=name or slug,
                hostname=hostname,
                description=description,
                is_active=not options["inactive"],
            )
            server.set_api_token(token_to_show)
            server.save()
            created = True
        else:
            created = False
            changed_fields: list[str] = []
            if options["name"] and server.name != name:
                server.name = name
                changed_fields.append("name")
            if options["hostname"] and server.hostname != hostname:
                server.hostname = hostname
                changed_fields.append("hostname")
            if options["description"] and server.description != description:
                server.description = description
                changed_fields.append("description")
            if options["rotate_token"]:
                token_to_show = MonitoredServer.generate_token()
                server.set_api_token(token_to_show)
                changed_fields.append("api_token_hash")
            if changed_fields:
                server.save(update_fields=list(dict.fromkeys(changed_fields + ["updated_at"])))

        status = "created" if created else "updated"
        self.stdout.write(self.style.SUCCESS(f"Server {status}: {server.name} ({server.slug})"))
        self.stdout.write(f"  Active: {server.is_active}")
        self.stdout.write(f"  Hostname: {server.hostname or '-'}")
        self.stdout.write(f"  Token hash: {server.token_hint}")

        if token_to_show:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING("Save this token now. It will not be shown again."))
            self.stdout.write(f"INGEST_TOKEN={token_to_show}")
            self.stdout.write("")
            self.stdout.write("Example agent command:")
            self.stdout.write(
                "  ai-dashboard-agent --host http://127.0.0.1:8000 "
                f"--server-slug {server.slug} --token '{token_to_show}'"
            )
        elif not options["rotate_token"] and not created:
            self.stdout.write("Use --rotate-token to generate and print a new token.")

