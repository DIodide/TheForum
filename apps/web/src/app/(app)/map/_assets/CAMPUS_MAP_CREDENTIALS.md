# Princeton Campus Map — MapBox Credentials

## Source
Token and style scraped from `campusmap.princeton.edu` JS bundle (`index-CJ0wNKi6.js`).

## Style Owner
- Account: `applied-information-group`
- Style name: `Princeton-University`
- Style URL: `mapbox://styles/applied-information-group/cld1kdenc001001m89xs12zvl`

## Token
The public token is stored in `.env.local` / `.env.production` as `NEXT_PUBLIC_CAMPUS_MAP_TOKEN`.
It is NOT committed to git (GitHub push protection blocks MapBox tokens).

## Custom Tilesets (all private, accessible via the public token)
- `applied-information-group.buildings`
- `applied-information-group.road_polygon`
- `applied-information-group.road_line`
- `applied-information-group.water`
- `applied-information-group.landuse`
- `applied-information-group.poi_label`
- `applied-information-group.road_label`
- `applied-information-group.place_label`
- `applied-information-group.detail_line`
- `applied-information-group.detail_polygon`
- `applied-information-group.waterway_label`

## Local tile backup
Tiles for zoom levels 14-16 covering the Princeton campus area are
saved in `tilesets/{tileset_name}/{z}/{x}/{y}.pbf`. Sprite icons
are in `sprite/`.

## Env vars needed
```
NEXT_PUBLIC_CAMPUS_MAP_TOKEN=<token from campusmap.princeton.edu>
NEXT_PUBLIC_CAMPUS_MAP_STYLE=mapbox://styles/applied-information-group/cld1kdenc001001m89xs12zvl
```
