from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.project_analysis import ProjectAnalysis
from app.services.service_session import get_current_user
from app.supabase_db.session import get_db
from ai_services.graph.neo4j_client import get_neo4j_client


router = APIRouter(
    prefix="/api/projects",
    tags=["Project Graph"],
)


@router.get("/{project_id}/analysis/{analysis_id}/graph")
def get_project_graph(
    project_id: int,
    analysis_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    current_user = get_current_user(db, request)

    # --------------------------------------------------
    # Verify project ownership
    # --------------------------------------------------

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
        .first()
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found.",
        )

    # --------------------------------------------------
    # Verify analysis belongs to project
    # --------------------------------------------------

    analysis = (
        db.query(ProjectAnalysis)
        .filter(
            ProjectAnalysis.id == analysis_id,
            ProjectAnalysis.project_id == project_id,
        )
        .first()
    )

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found.",
        )

    # --------------------------------------------------
    # Query Neo4j
    # --------------------------------------------------

    nodes_query = """
    MATCH (n)
    WHERE
        (
            n.project_id = $project_id
            AND n.analysis_id = $analysis_id
        )
        OR (
            n.project_id = $project_id
            AND n.analysis_id IS NULL
        )
    RETURN
        elementId(n) AS id,
        labels(n) AS labels,
        properties(n) AS properties
    ORDER BY id
    """

    edges_query = """
    MATCH (source)-[r]->(target)
    WHERE
        (
            source.project_id = $project_id
            AND source.analysis_id = $analysis_id
        )
        AND (
            target.project_id = $project_id
            AND target.analysis_id = $analysis_id
        )
    RETURN
        elementId(source) AS source,
        elementId(target) AS target,
        type(r) AS type,
        properties(r) AS properties
    """

    try:
        with get_neo4j_client() as neo4j:
            nodes = neo4j.execute(
                nodes_query,
                {
                    "project_id": project_id,
                    "analysis_id": analysis_id,
                },
            )

            edges = neo4j.execute(
                edges_query,
                {
                    "project_id": project_id,
                    "analysis_id": analysis_id,
                },
            )

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to query Neo4j: {exc}",
        ) from exc

    return {
        "project_id": project_id,
        "analysis_id": analysis_id,
        "commit_sha": analysis.commit_sha,
        "status": analysis.status,
        "nodes": nodes,
        "edges": edges,
    }