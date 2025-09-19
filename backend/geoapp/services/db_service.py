from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import JSONB
from geoapp.models.models import NycNeighborhoods, NycHomicides, NycSubwayStations
from shapely.wkt import loads as load_wkt
from shapely.geometry import mapping
from shapely.ops import substring
from pyproj import Transformer
from shapely.ops import transform


class DbServices:
    """
    A service class for interacting with a database to retrieve and transform geospatial data.

    This class provides methods to query geospatial features from a database, apply spatial transformations,
    and return the results in GeoJSON format. It supports filtering features based on specified conditions and
    can handle spatial reference system transformations with precision control.
    """

    def __init__(self, session, target_srid=4326, precision=6, geom_column="geom_json"):
        self.session = session
        self.target_srid = target_srid
        self.precision = precision
        self.geom_column = geom_column

    def get_features(self, model, filters):
        """
        Retrieves features from the database, applies spatial transformations,
        and returns them as GeoJSON objects.

        Args:
            model (SQLAlchemy model): The database model from which features are retrieved.
            filters (dict): A dictionary of filters to apply when querying the database.

        Returns:
            list: A list of GeoJSON objects representing the transformed geometries and associated data.
        """
        subquery_properties = select(model).filter_by(**filters).subquery()
        columns = subquery_properties.c
        json_fields = []

        # Skip geometry columns to include only non-geometry fields in GeoJSON properties
        for col in columns:
            if col.name != "geom" and col.name != "geom_invalid":
                json_fields.extend([col.name, col])

        subquery_features = select(
            func.jsonb_build_object(
                "type",
                "Feature",
                "geometry",
                func.ST_AsGeoJSON(
                    func.ST_Transform(subquery_properties.c.geom, self.target_srid),
                    self.precision,
                ).cast(JSONB),
                "properties",
                func.jsonb_build_object(*json_fields),
            )
        )

        geojson_query = select(
            func.jsonb_build_object(
                "type",
                "FeatureCollection",
                "features",
                func.jsonb_agg(subquery_features.c[0]),
            )
        )
        result = self.session.execute(geojson_query).scalar()

        return result

    def get_spatial_data(self, x, y):
        """
        Retrieves spatial information for a given coordinate (by default in EPSG:3857).
        """
        point_geom = self._make_transformed_point(x, y)
        neighborhoods = self._get_neighborhoods(point_geom)
        number_of_homicides = self._count_homicides_nearby(point_geom)
        subway = self._get_nearest_subway_station(point_geom)

        return {
            "neighborhoods": neighborhoods,
            "number_of_homicides": number_of_homicides,
            "subway": subway,
        }

    def _make_transformed_point(self, x, y, source_srid=3857, target_srid=26918):
        """
        Creates a point geometry from given coordinates (by default in EPSG:3857) and transforms it (by default to EPSG:26918).
        """
        return func.ST_Transform(
            func.ST_SetSRID(func.ST_MakePoint(x, y), source_srid), target_srid
        )

    def _get_neighborhoods(self, point_geom):
        """
        Returns GIDs of neighborhoods that contain the given point geometry, or None if not found.
        """
        stmt = select(NycNeighborhoods.gid).where(
            func.ST_Intersects(NycNeighborhoods.geom, point_geom)
        )
        result = self.session.execute(stmt).all()

        if result:
            neighborhoods = []
            for row in result:
                neighborhoods.append({"neighborhood_gid": row.gid})
        else:
            neighborhoods = None

        return neighborhoods

    def _count_homicides_nearby(self, point_geom, radius=100):
        """
        Counts the number of homicides within a specified distance from the given point geometry.
        The default value of radius is 100 meters.
        """
        stmt = (
            select(func.count())
            .select_from(NycHomicides)
            .where(func.ST_DWithin(NycHomicides.geom, point_geom, radius))
        )

        return self.session.execute(stmt).scalar()

    def _get_nearest_subway_station(self, point_geom):
        """
        Returns the GID and distance in meters of the nearest subway station to the given point geometry.
        """
        stmt = (
            select(
                NycSubwayStations.gid,
                func.ST_Distance(NycSubwayStations.geom, point_geom).label("distance"),
            ).order_by(NycSubwayStations.geom.op("<->")(point_geom))
            # Only fetch the closest station
            .limit(1)
        )
        result = self.session.execute(stmt).first()

        if result:
            response = {"subway_gid": result.gid, "subway_distance": result.distance}
        else:
            response = None

        return response

    def get_fragmented_edge_geojson(self, radius):
        """
        Performs network tracing: returns road segments up to radius (deafult 100 meters) in both directions from each homicide point as GeoJSON.
        """
        # Links each homicide location to its nearest street segment and node geometries.
        raw_sql = self._sql_nearest_edge_for_homicides()

        results = self.session.execute(raw_sql).mappings().all()
        # Stores features
        features = []

        # Transforms geometries from EPSG:26918 (UTM zone 18N) to WGS84 (lat/lon).
        project_to_wgs84 = Transformer.from_crs(
            "EPSG:26918", "EPSG:4326", always_xy=True
        ).transform

        # Build GeoJSON edge fragments around each homicide point within radius.
        for row in results:
            features = self._process_both_directions(
                row, radius, project_to_wgs84, features
            )

        return {"type": "FeatureCollection", "features": features}

    def _sql_nearest_edge_for_homicides(self):
        """
        SQL query for the nearest street edge to each homicide point.
        """
        return text(
            """
            SELECT
                p.id AS point_id,
                e.edge_id,
                e.start_node,
                e.end_node,
                ST_AsText(e.geom) AS edge,
                ST_AsText(ST_ClosestPoint(e.geom, p.geom)) AS closest_point_on_edge,
                ST_AsText(ns.geom) AS start_node_geom,
                ST_AsText(ne.geom) AS end_node_geom
            FROM
                public.nyc_homicides p
            JOIN LATERAL (
                SELECT edge_id, geom, start_node, end_node
                FROM streets_topo.edge_data
                ORDER BY geom <-> p.geom
                LIMIT 1
            ) e ON TRUE
            LEFT JOIN streets_topo.node ns ON ns.node_id = e.start_node
            LEFT JOIN streets_topo.node ne ON ne.node_id = e.end_node
        """
        )

    def _process_both_directions(self, row, radius, project_to_wgs84, features):
        """
        Process edge traversal in both directions from the closest point.
        """
        edge = load_wkt(row["edge"])
        closest_point_on_edge = load_wkt(row["closest_point_on_edge"])
        total_len = edge.length
        fraction_along_edge = edge.project(closest_point_on_edge, normalized=True)
        for direction, node_key in [("start", "start_node"), ("end", "end_node")]:
            node = load_wkt(row[f"{node_key}_geom"])
            distance_node_to_point = closest_point_on_edge.distance(node)

            if direction == "start":
                fraction = max(
                    0.0,
                    fraction_along_edge
                    - (min(distance_node_to_point, radius) / total_len),
                )
            else:
                fraction = min(
                    1.0,
                    fraction_along_edge
                    + (min(distance_node_to_point, radius) / total_len),
                )

            features = self._process_direction(
                row,
                radius,
                project_to_wgs84,
                features,
                node,
                fraction,
                direction,
                row[node_key],
            )
        return features

    def _process_direction(
        self,
        row,
        radius,
        project_to_wgs84,
        features,
        node,
        fraction,
        direction,
        node_id,
    ):
        """
        Extracts edge fragment toward a node and continues traversal if within radius.
        """
        edge = load_wkt(row["edge"])
        closest_point_on_edge = load_wkt(row["closest_point_on_edge"])

        fraction_along_edge = edge.project(closest_point_on_edge, normalized=True)
        distance_node_to_point = closest_point_on_edge.distance(node)

        fragment_base = substring(edge, fraction, fraction_along_edge, normalized=True)
        features.append(
            self._make_feature(fragment_base, row, direction, project_to_wgs84)
        )
        # Continue traversal from start node if within radius
        if distance_node_to_point <= radius:
            remaining = radius - distance_node_to_point
            fragments = self._trace_from_node(node_id, remaining)
            for fragment in fragments:
                features.append(
                    self._make_feature(fragment, row, direction, project_to_wgs84)
                )

        return features

    def _make_feature(self, fragment, row, direction, project_to_wgs84):
        """
        Create a GeoJSON feature from a fragment.
        """
        fragment_wgs84 = transform(project_to_wgs84, fragment)
        return {
            "type": "Feature",
            "geometry": mapping(fragment_wgs84),
            "properties": {
                "point_id": row["point_id"],
                "edge_id": row["edge_id"],
                "direction": direction,
            },
        }

    def _trace_from_node(self, node_id, remaining, visited=None):
        """
        Recursively traces the road network from a node, collecting edge fragments up to the remaining distance.
        """
        if visited is None:
            visited = set()  # Track visited edges to avoid infinite loops

        fragments = []

        # Fetch all edges connected to the given node
        raw_sql = text(
            """
            SELECT edge_id, ST_AsText(geom) AS geom, start_node, end_node
            FROM streets_topo.edge_data
            WHERE start_node = :node_id OR end_node = :node_id
        """
        )
        rows = self.session.execute(raw_sql, {"node_id": node_id}).mappings().all()

        # Explore all connected edges and recurse if distance remains
        for row in rows:
            edge_key = (row["start_node"], row["end_node"], row["edge_id"])
            if edge_key in visited:
                continue
            visited.add(edge_key)

            geom = load_wkt(row["geom"])
            edge_length = geom.length

            next_node, edge = self._get_edge_info(
                row, node_id, remaining, edge_length, geom
            )
            if edge_length > remaining:
                fragments.append(edge)
                continue

            fragments.append(geom)
            fragments.extend(
                self._trace_from_node(next_node, remaining - edge_length, visited)
            )

        return fragments

    def _get_edge_info(self, row, node_id, remaining, edge_length, geom):
        """
        Determine the next node and the traversed edge fragment.
        """
        if row["start_node"] == node_id:
            next_node = row["end_node"]
            edge = substring(geom, 0, remaining)
        else:
            next_node = row["start_node"]
            edge = substring(geom, edge_length - remaining, edge_length)
        return next_node, edge
