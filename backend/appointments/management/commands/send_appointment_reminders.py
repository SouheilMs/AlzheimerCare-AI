from django.core.management.base import BaseCommand

from appointments.lifecycle import send_due_reminders


class Command(BaseCommand):
    help = "Envoie les rappels de rendez-vous (24 h avant). À lancer toutes les heures."

    def handle(self, *args, **options):
        sent = send_due_reminders()
        self.stdout.write(self.style.SUCCESS(f"{sent} rappel(s) envoyé(s)"))
