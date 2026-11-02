from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tags', '0001_initial'),
        ('transactions', '0004_transactionsmodel_comments'),
    ]

    operations = [
        migrations.AddField(
            model_name='transactionsmodel',
            name='tags',
            field=models.ManyToManyField(
                blank=True,
                db_table='transaction_tags',
                related_name='transactions',
                to='tags.tagmodel',
            ),
        ),
    ]
