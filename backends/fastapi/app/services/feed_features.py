from dataclasses import asdict, dataclass

from sqlalchemy import Engine, text


@dataclass
class AggregationResult:
    user_rows: int
    event_rows: int
    org_rows: int

    def to_dict(self) -> dict[str, int]:
        return asdict(self)


USER_FEATURE_SQL = text(
    """
    with tag_scores as (
        select ui.user_id, ui.tag::text as tag, 3 as weight
        from user_interests ui
        union all
        select ei.user_id,
               et.tag::text as tag,
               case
                   when ei.interaction_type = 'rsvp' then 4
                   when ei.interaction_type = 'save' then 3
                   when ei.interaction_type = 'calendar_export' then 3
                   when ei.interaction_type = 'share' then 2
                   when ei.interaction_type = 'detail_open' then 1
                   else 0
               end as weight
        from event_interactions ei
        inner join event_tags et on et.event_id = ei.event_id
        where ei.interaction_type in ('detail_open', 'save', 'rsvp', 'share', 'calendar_export')
    ),
    ranked_tags as (
        select user_id, tag, sum(weight) as total_weight
        from tag_scores
        group by user_id, tag
    ),
    top_tags as (
        select user_id,
               jsonb_agg(tag order by total_weight desc, tag) as top_tags
        from (
            select user_id,
                   tag,
                   total_weight,
                   row_number() over (partition by user_id order by total_weight desc, tag) as rn
            from ranked_tags
        ) ranked
        where rn <= 5
        group by user_id
    ),
    category_scores as (
        select of.user_id, o.category::text as category, 3 as weight
        from org_followers of
        inner join organizations o on o.id = of.org_id
        union all
        select ei.user_id,
               o.category::text as category,
               case
                   when ei.interaction_type = 'rsvp' then 4
                   when ei.interaction_type = 'save' then 3
                   when ei.interaction_type = 'calendar_export' then 3
                   when ei.interaction_type = 'share' then 2
                   when ei.interaction_type = 'detail_open' then 1
                   else 0
               end as weight
        from event_interactions ei
        inner join events e on e.id = ei.event_id
        inner join organizations o on o.id = e.org_id
        where ei.interaction_type in ('detail_open', 'save', 'rsvp', 'share', 'calendar_export')
    ),
    ranked_categories as (
        select user_id, category, sum(weight) as total_weight
        from category_scores
        group by user_id, category
    ),
    top_categories as (
        select user_id,
               jsonb_agg(category order by total_weight desc, category) as top_org_categories
        from (
            select user_id,
                   category,
                   total_weight,
                   row_number() over (
                       partition by user_id
                       order by total_weight desc, category
                   ) as rn
            from ranked_categories
        ) ranked
        where rn <= 3
        group by user_id
    ),
    followed_orgs as (
        select user_id,
               jsonb_agg(org_id order by created_at desc) as followed_org_ids
        from org_followers
        group by user_id
    ),
    interaction_counts as (
        select user_id,
               count(*) filter (where interaction_type = 'impression')::int as impression_count,
               count(*) filter (where interaction_type = 'detail_open')::int as detail_open_count,
               count(*) filter (where interaction_type = 'save')::int as save_count,
               count(*) filter (where interaction_type = 'rsvp')::int as rsvp_count,
               count(*) filter (where interaction_type = 'share')::int as share_count,
               count(*) filter (where interaction_type = 'calendar_export')::int as export_count,
               count(*) filter (where interaction_type = 'dismiss')::int as dismiss_count
        from event_interactions
        group by user_id
    )
    insert into user_feed_features (
        user_id,
        top_tags,
        top_org_categories,
        followed_org_ids,
        impression_count,
        detail_open_count,
        save_count,
        rsvp_count,
        share_count,
        export_count,
        dismiss_count,
        last_aggregated_at,
        updated_at
    )
    select u.id,
           coalesce(tt.top_tags, '[]'::jsonb),
           coalesce(tc.top_org_categories, '[]'::jsonb),
           coalesce(fo.followed_org_ids, '[]'::jsonb),
           coalesce(ic.impression_count, 0),
           coalesce(ic.detail_open_count, 0),
           coalesce(ic.save_count, 0),
           coalesce(ic.rsvp_count, 0),
           coalesce(ic.share_count, 0),
           coalesce(ic.export_count, 0),
           coalesce(ic.dismiss_count, 0),
           now(),
           now()
    from users u
    left join top_tags tt on tt.user_id = u.id
    left join top_categories tc on tc.user_id = u.id
    left join followed_orgs fo on fo.user_id = u.id
    left join interaction_counts ic on ic.user_id = u.id
    on conflict (user_id) do update
    set top_tags = excluded.top_tags,
        top_org_categories = excluded.top_org_categories,
        followed_org_ids = excluded.followed_org_ids,
        impression_count = excluded.impression_count,
        detail_open_count = excluded.detail_open_count,
        save_count = excluded.save_count,
        rsvp_count = excluded.rsvp_count,
        share_count = excluded.share_count,
        export_count = excluded.export_count,
        dismiss_count = excluded.dismiss_count,
        last_aggregated_at = excluded.last_aggregated_at,
        updated_at = excluded.updated_at
    """
)

EVENT_FEATURE_SQL = text(
    """
    with tag_counts as (
        select event_id, count(*)::int as tag_count
        from event_tags
        group by event_id
    )
    insert into event_feed_features (
        event_id,
        impression_count,
        detail_open_count,
        save_count,
        rsvp_count,
        share_count,
        export_count,
        dismiss_count,
        click_through_rate,
        save_rate,
        rsvp_rate,
        quality_score,
        last_aggregated_at,
        updated_at
    )
    select e.id,
           count(*) filter (where ei.interaction_type = 'impression')::int as impression_count,
           count(*) filter (where ei.interaction_type = 'detail_open')::int as detail_open_count,
           count(*) filter (where ei.interaction_type = 'save')::int as save_count,
           count(*) filter (where ei.interaction_type = 'rsvp')::int as rsvp_count,
           count(*) filter (where ei.interaction_type = 'share')::int as share_count,
           count(*) filter (where ei.interaction_type = 'calendar_export')::int as export_count,
           count(*) filter (where ei.interaction_type = 'dismiss')::int as dismiss_count,
           case
               when count(*) filter (where ei.interaction_type = 'impression') > 0
                   then (count(*) filter (where ei.interaction_type = 'detail_open'))::float /
                        nullif(count(*) filter (where ei.interaction_type = 'impression'), 0)
               else 0
           end as click_through_rate,
           case
               when count(*) filter (where ei.interaction_type = 'impression') > 0
                   then (count(*) filter (where ei.interaction_type = 'save'))::float /
                        nullif(count(*) filter (where ei.interaction_type = 'impression'), 0)
               else 0
           end as save_rate,
           case
               when count(*) filter (where ei.interaction_type = 'impression') > 0
                   then (count(*) filter (where ei.interaction_type = 'rsvp'))::float /
                        nullif(count(*) filter (where ei.interaction_type = 'impression'), 0)
               else 0
           end as rsvp_rate,
           (
               case
                   when char_length(trim(e.title)) >= 12 then 15
                   when char_length(trim(e.title)) >= 6 then 8
                   else 0
               end +
               case
                   when char_length(trim(e.description)) >= 140 then 25
                   when char_length(trim(e.description)) >= 80 then 15
                   when char_length(trim(e.description)) >= 30 then 8
                   else 0
               end +
               case
                   when coalesce(tc.tag_count, 0) >= 3 then 20
                   when coalesce(tc.tag_count, 0) >= 1 then 12
                   else 0
               end +
               case when e.flyer_url is not null then 15 else 0 end +
               case when e.external_link is not null then 10 else 0 end +
               case when e.end_datetime is not null then 5 else 0 end +
               case when e.org_id is not null then 5 else 0 end +
               case when e.is_public then 5 else 0 end
           )::double precision as quality_score,
           now(),
           now()
    from events e
    left join event_interactions ei on ei.event_id = e.id
    left join tag_counts tc on tc.event_id = e.id
    group by e.id, tc.tag_count
    on conflict (event_id) do update
    set impression_count = excluded.impression_count,
        detail_open_count = excluded.detail_open_count,
        save_count = excluded.save_count,
        rsvp_count = excluded.rsvp_count,
        share_count = excluded.share_count,
        export_count = excluded.export_count,
        dismiss_count = excluded.dismiss_count,
        click_through_rate = excluded.click_through_rate,
        save_rate = excluded.save_rate,
        rsvp_rate = excluded.rsvp_rate,
        quality_score = excluded.quality_score,
        last_aggregated_at = excluded.last_aggregated_at,
        updated_at = excluded.updated_at
    """
)

ORG_FEATURE_SQL = text(
    """
    insert into org_feed_features (
        org_id,
        follower_count,
        event_count,
        average_impression_count,
        average_save_rate,
        average_rsvp_rate,
        last_aggregated_at,
        updated_at
    )
    select o.id,
           count(distinct of.user_id)::int as follower_count,
           count(distinct e.id)::int as event_count,
           coalesce(avg(eff.impression_count), 0)::double precision as average_impression_count,
           coalesce(avg(eff.save_rate), 0)::double precision as average_save_rate,
           coalesce(avg(eff.rsvp_rate), 0)::double precision as average_rsvp_rate,
           now(),
           now()
    from organizations o
    left join org_followers of on of.org_id = o.id
    left join events e on e.org_id = o.id
    left join event_feed_features eff on eff.event_id = e.id
    group by o.id
    on conflict (org_id) do update
    set follower_count = excluded.follower_count,
        event_count = excluded.event_count,
        average_impression_count = excluded.average_impression_count,
        average_save_rate = excluded.average_save_rate,
        average_rsvp_rate = excluded.average_rsvp_rate,
        last_aggregated_at = excluded.last_aggregated_at,
        updated_at = excluded.updated_at
    """
)


def run_feed_feature_aggregation(engine: Engine) -> AggregationResult:
    with engine.begin() as connection:
        user_result = connection.execute(USER_FEATURE_SQL)
        event_result = connection.execute(EVENT_FEATURE_SQL)
        org_result = connection.execute(ORG_FEATURE_SQL)

    return AggregationResult(
        user_rows=user_result.rowcount or 0,
        event_rows=event_result.rowcount or 0,
        org_rows=org_result.rowcount or 0,
    )
