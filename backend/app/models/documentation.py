"""Compatibility import for the old singular documentation module.

New backend code must import :class:`ProjectDocumentation` and
``DocumentationVersion`` from their dedicated model modules.
"""

from app.models.project_documentation import ProjectDocumentation


# The old class targeted an unmigrated ``documentation`` table. Keeping this
# alias prevents accidental recreation of that incompatible ORM mapping.
Documentation = ProjectDocumentation
