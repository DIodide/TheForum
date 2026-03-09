from datetime import UTC, datetime, timedelta

from sqlalchemy import Engine, text

DIAGNOSTICS_SQL = text(
    """
    select rs.id,
           rs.event_id,
           e.title,
           rs.surface,
           rs.shelf,
           rs.rank,
           rs.score,
           rs.reason_codes,
           rs.metadata,
           rs.created_at,
           eff.impression_count,
           eff.detail_open_count,
           eff.save_count,
           eff.rsvp_count,
           eff.dismiss_count,
           eff.click_through_rate,
           eff.save_rate,
           eff.rsvp_rate
    from ranking_snapshots rs
    inner join events e on e.id = rs.event_id
    left join event_feed_features eff on eff.event_id = rs.event_id
    where rs.user_id = :user_id
      and (:event_id is null or rs.event_id = :event_id)
    order by rs.created_at desc
    limit :limit
    """
)

OVERALL_EVALUATION_SQL = text(
    """
    select count(*) filter (where interaction_type = 'impression')::int as impression_count,
           count(*) filter (where interaction_type = 'detail_open')::int as detail_open_count,
           count(*) filter (where interaction_type = 'save')::int as save_count,
           count(*) filter (where interaction_type = 'rsvp')::int as rsvp_count,
           count(*) filter (where interaction_type = 'dismiss')::int as dismiss_count
    from event_interactions
    where created_at >= :start_at
    """
)

SHELF_EVALUATION_SQL = text(
    """
    with impressions as (
        select ranking_snapshot_id,
               surface,
               coalesce(shelf, 'unshelved') as shelf
        from event_interactions
        where interaction_type = 'impression'
          and ranking_snapshot_id is not null
          and created_at >= :start_at
    ),
    outcomes as (
        select ranking_snapshot_id,
               count(*) filter (where interaction_type = 'detail_open')::int as detail_open_count,
               count(*) filter (where interaction_type = 'save')::int as save_count,
               count(*) filter (where interaction_type = 'rsvp')::int as rsvp_count,
               count(*) filter (where interaction_type = 'dismiss')::int as dismiss_count
        from event_interactions
        where ranking_snapshot_id is not null
          and created_at >= :start_at
        group by ranking_snapshot_id
    )
    select i.surface,
           i.shelf,
           count(*)::int as impression_count,
           coalesce(sum(o.detail_open_count), 0)::int as detail_open_count,
           coalesce(sum(o.save_count), 0)::int as save_count,
           coalesce(sum(o.rsvp_count), 0)::int as rsvp_count,
           coalesce(sum(o.dismiss_count), 0)::int as dismiss_count,
           case
               when count(*) > 0 then coalesce(sum(o.detail_open_count), 0)::float / count(*)
               else 0
           end as click_through_rate,
           case
               when count(*) > 0 then coalesce(sum(o.save_count), 0)::float / count(*)
               else 0
           end as save_rate,
           case
               when count(*) > 0 then coalesce(sum(o.rsvp_count), 0)::float / count(*)
               else 0
           end as rsvp_rate,
           case
               when count(*) > 0 then coalesce(sum(o.dismiss_count), 0)::float / count(*)
               else 0
           end as hide_rate
    from impressions i
    left join outcomes o on o.ranking_snapshot_id = i.ranking_snapshot_id
    group by i.surface, i.shelf
    order by impression_count desc, i.surface, i.shelf
    """
)


def get_recommendation_diagnostics(
    engine: Engine,
    user_id: str,
    *,
    limit: int = 20,
    event_id: str | None = None,
) -> list[dict[str, object]]:
    with engine.begin() as connection:
        result = connection.execute(
            DIAGNOSTICS_SQL,
            {
                "user_id": user_id,
                "event_id": event_id,
                "limit": limit,
            },
        )
        rows = result.mappings().all()

    return [
        {
            **row,
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
        }
        for row in rows
    ]


def get_evaluation_summary(engine: Engine, *, days: int = 30) -> dict[str, object]:
    start_at = datetime.now(UTC) - timedelta(days=days)

    with engine.begin() as connection:
        overall = (
            connection.execute(OVERALL_EVALUATION_SQL, {"start_at": start_at}).mappings().one()
        )
        by_shelf = connection.execute(SHELF_EVALUATION_SQL, {"start_at": start_at}).mappings().all()

    impression_count = overall["impression_count"] or 0
    detail_open_count = overall["detail_open_count"] or 0
    save_count = overall["save_count"] or 0
    rsvp_count = overall["rsvp_count"] or 0
    dismiss_count = overall["dismiss_count"] or 0

    return {
        "window_days": days,
        "overall": {
            "impression_count": impression_count,
            "detail_open_count": detail_open_count,
            "save_count": save_count,
            "rsvp_count": rsvp_count,
            "dismiss_count": dismiss_count,
            "click_through_rate": detail_open_count / impression_count if impression_count else 0,
            "save_rate": save_count / impression_count if impression_count else 0,
            "rsvp_rate": rsvp_count / impression_count if impression_count else 0,
            "hide_rate": dismiss_count / impression_count if impression_count else 0,
        },
        "by_shelf": [dict(row) for row in by_shelf],
    }
