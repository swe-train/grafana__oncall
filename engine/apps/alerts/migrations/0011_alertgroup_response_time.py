# Generated by Django 3.2.18 on 2023-03-20 14:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('alerts', '0010_channelfilter_filtering_term_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='alertgroup',
            name='response_time',
            field=models.DurationField(default=None, null=True),
        ),
    ]