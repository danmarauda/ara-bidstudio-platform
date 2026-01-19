import logging
from typing import Optional

from celery import chord, group, shared_task
from django.db import transaction
from django.utils import timezone

from opencontractserver.documents.models import DocumentAnalysisRow
from opencontractserver.extracts.models import Datacell, Extract
from opencontractserver.types.enums import PermissionTypes
from opencontractserver.utils.celery_tasks import get_task_by_name
from opencontractserver.utils.permissioning import set_permissions_for_obj_to_user

logger = logging.getLogger(__name__)


@shared_task
def mark_extract_complete(extract_id):
    """Mark extract as complete."""
    extract = Extract.objects.get(pk=extract_id)
    extract.finished = timezone.now()
    extract.save()

    logger.info(f"Extract {extract_id} marked complete")


@shared_task
def run_extract(extract_id: Optional[str | int], user_id: str | int):
    logger.info(f"Run extract for extract {extract_id}")

    logger.info(f"Fetching extract with ID: {extract_id}")
    extract = Extract.objects.get(pk=extract_id)
    logger.info(f"Found extract: {extract.name} (ID: {extract.id})")

    logger.info(f"Setting started timestamp for extract {extract.id}")
    with transaction.atomic():
        extract.started = timezone.now()
        extract.save()
        logger.info(f"Extract {extract.id} marked as started at {extract.started}")

    fieldset = extract.fieldset
    logger.info(f"Using fieldset: {fieldset.name} (ID: {fieldset.id})")

    logger.info(f"Retrieving document IDs for extract {extract.id}")
    document_ids = extract.documents.all().values_list("id", flat=True)
    logger.info(f"Found {len(document_ids)} documents to process: {list(document_ids)}")

    tasks = []
    logger.info(f"Beginning document processing loop for extract {extract.id}")

    for document_id in document_ids:
        logger.info(f"Processing document ID: {document_id} for extract {extract.id}")

        row_results = DocumentAnalysisRow(
            document_id=document_id, extract_id=extract_id, creator=extract.creator
        )
        row_results.save()

        for column in fieldset.columns.all():

            with transaction.atomic():
                cell = Datacell.objects.create(
                    extract=extract,
                    column=column,
                    data_definition=column.output_type,
                    creator_id=user_id,
                    document_id=document_id,
                )

                set_permissions_for_obj_to_user(user_id, cell, [PermissionTypes.CRUD])

                # Add data cell to tracking
                row_results.data.add(cell)

                # Get the task function dynamically based on the column's task_name
                task_func = get_task_by_name(column.task_name)
                if task_func is None:
                    logger.error(
                        f"Task {column.task_name} not found for column {column.id}"
                    )
                    continue

                logger.info(
                    f"  Created datacell {cell.pk} for column '{column.name}' with task '{column.task_name}'"
                )

                # Add the task to the group
                tasks.append(task_func.si(cell.pk))

    # Execute the tasks
    if tasks:
        # Check if we're in eager mode (test/synchronous execution)
        from celery import current_app

        if current_app.conf.task_always_eager:
            # In eager mode, chord doesn't work properly, so execute tasks manually
            logger.info(
                f"EAGER MODE: Running {len(tasks)} extraction tasks synchronously"
            )
            for i, task in enumerate(tasks, 1):
                logger.info(f"  Executing task {i}/{len(tasks)}...")
                try:
                    result = task.apply()
                    logger.info(f"    Task {i} completed successfully: {result}")
                except Exception as e:
                    logger.error(f"    Task {i} failed with error: {e}", exc_info=True)
            # Then mark complete
            logger.info("All tasks executed, marking extract as complete")
            mark_extract_complete(extract_id)
        else:
            # Normal async execution with chord
            chord(group(*tasks))(mark_extract_complete.si(extract_id))
            logger.info(
                f"ASYNC MODE: Queued {len(tasks)} extraction tasks for background execution"
            )
    else:
        logger.warning(f"No extraction tasks to run for extract {extract.id}")
        mark_extract_complete(extract_id)

    logger.info(f"Extract processing initiated for extract {extract.id}")
