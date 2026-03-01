from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("monitoring", "0006_monitoredserver_machine_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="monitoredserver",
            name="agent_user",
            field=models.CharField(blank=True, default="", max_length=128),
        ),
    ]
