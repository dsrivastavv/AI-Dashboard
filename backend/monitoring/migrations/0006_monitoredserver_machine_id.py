# Generated migration – adds machine_id to MonitoredServer for agent self-enrolment flow.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("monitoring", "0005_notification"),
    ]

    operations = [
        migrations.AddField(
            model_name="monitoredserver",
            name="machine_id",
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text=(
                    "Stable host identifier sourced from /etc/machine-id. "
                    "Ensures reinstalling the agent on the same machine always maps to the same server record."
                ),
                max_length=128,
                null=True,
                unique=True,
            ),
        ),
    ]
