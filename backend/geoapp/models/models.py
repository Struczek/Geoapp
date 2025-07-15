from typing import Any, Optional
from geoalchemy2.types import Geometry
from sqlalchemy import (
    Date,
    Double,
    Index,
    Integer,
    Numeric,
    PrimaryKeyConstraint,
    String,
)
from sqlalchemy.dialects.postgresql import TSTZRANGE
import datetime
import decimal
from sqlalchemy.orm import (
    scoped_session,
    sessionmaker,
    Mapped, 
    mapped_column,
    declarative_base,
)
from zope.sqlalchemy import register

DBSession = scoped_session(sessionmaker())
register(DBSession)
Base = declarative_base()


class NycCensusBlocks(Base):
    __tablename__ = "nyc_census_blocks"
    __table_args__ = (
        PrimaryKeyConstraint("gid", name="nyc_census_blocks_pkey"),
        Index("nyc_census_blocks_geom_idx", "geom"),
    )

    gid: Mapped[int] = mapped_column(Integer, primary_key=True)
    blkid: Mapped[Optional[str]] = mapped_column(String(15))
    popn_total: Mapped[Optional[float]] = mapped_column(Double(53))
    popn_white: Mapped[Optional[float]] = mapped_column(Double(53))
    popn_black: Mapped[Optional[float]] = mapped_column(Double(53))
    popn_nativ: Mapped[Optional[float]] = mapped_column(Double(53))
    popn_asian: Mapped[Optional[float]] = mapped_column(Double(53))
    popn_other: Mapped[Optional[float]] = mapped_column(Double(53))
    boroname: Mapped[Optional[str]] = mapped_column(String(32))
    geom: Mapped[Optional[Any]] = mapped_column(
        Geometry("MULTIPOLYGON", 26918, from_text="ST_GeomFromEWKT", name="geometry")
    )


class NycHomicides(Base):
    __tablename__ = "nyc_homicides"
    __table_args__ = (
        PrimaryKeyConstraint("gid", name="nyc_homicides_pkey"),
        Index("nyc_homicides_geom_idx", "geom"),
    )

    gid: Mapped[int] = mapped_column(Integer, primary_key=True)
    incident_d: Mapped[Optional[datetime.date]] = mapped_column(Date)
    boroname: Mapped[Optional[str]] = mapped_column(String(13))
    num_victim: Mapped[Optional[str]] = mapped_column(String(1))
    primary_mo: Mapped[Optional[str]] = mapped_column(String(20))
    id: Mapped[Optional[float]] = mapped_column(Double(53))
    weapon: Mapped[Optional[str]] = mapped_column(String(16))
    light_dark: Mapped[Optional[str]] = mapped_column(String(1))
    year: Mapped[Optional[float]] = mapped_column(Double(53))
    geom: Mapped[Optional[Any]] = mapped_column(
        Geometry("POINT", 26918, from_text="ST_GeomFromEWKT", name="geometry")
    )


class NycNeighborhoods(Base):
    __tablename__ = "nyc_neighborhoods"
    __table_args__ = (
        PrimaryKeyConstraint("gid", name="nyc_neighborhoods_pkey"),
        Index("nyc_neighborhoods_geom_idx", "geom"),
    )

    gid: Mapped[int] = mapped_column(Integer, primary_key=True)
    boroname: Mapped[Optional[str]] = mapped_column(String(43))
    name: Mapped[Optional[str]] = mapped_column(String(64))
    geom: Mapped[Optional[Any]] = mapped_column(
        Geometry("MULTIPOLYGON", 26918, from_text="ST_GeomFromEWKT", name="geometry")
    )
    geom_invalid: Mapped[Optional[Any]] = mapped_column(
        Geometry(spatial_index=False, from_text="ST_GeomFromEWKT", name="geometry")
    )


class NycStreets(Base):
    __tablename__ = "nyc_streets"
    __table_args__ = (
        PrimaryKeyConstraint("gid", name="nyc_streets_pkey"),
        Index("nyc_streets_geom_idx", "geom"),
        Index("nyc_streets_gix_nd", "geom"),
    )

    gid: Mapped[int] = mapped_column(Integer, primary_key=True)
    id: Mapped[Optional[float]] = mapped_column(Double(53))
    name: Mapped[Optional[str]] = mapped_column(String(200))
    oneway: Mapped[Optional[str]] = mapped_column(String(10))
    type: Mapped[Optional[str]] = mapped_column(String(50))
    geom: Mapped[Optional[Any]] = mapped_column(
        Geometry("MULTILINESTRING", 26918, from_text="ST_GeomFromEWKT", name="geometry")
    )


class NycStreetsHistory(Base):
    __tablename__ = "nyc_streets_history"
    __table_args__ = (
        PrimaryKeyConstraint("hid", name="nyc_streets_history_pkey"),
        Index("nyc_streets_history_geom_x", "geom"),
        Index("nyc_streets_history_tstz_x", "valid_range"),
    )

    hid: Mapped[int] = mapped_column(Integer, primary_key=True)
    gid: Mapped[Optional[int]] = mapped_column(Integer)
    id: Mapped[Optional[float]] = mapped_column(Double(53))
    name: Mapped[Optional[str]] = mapped_column(String(200))
    oneway: Mapped[Optional[str]] = mapped_column(String(10))
    type: Mapped[Optional[str]] = mapped_column(String(50))
    geom: Mapped[Optional[Any]] = mapped_column(
        Geometry("MULTILINESTRING", 26918, from_text="ST_GeomFromEWKT", name="geometry")
    )
    valid_range: Mapped[Optional[Any]] = mapped_column(TSTZRANGE)
    created_by: Mapped[Optional[str]] = mapped_column(String(32))
    deleted_by: Mapped[Optional[str]] = mapped_column(String(32))


class NycSubwayStationEvents(Base):
    __tablename__ = "nyc_subway_station_events"
    __table_args__ = (
        PrimaryKeyConstraint("subways_gid", name="nyc_subway_station_events_pkey"),
    )

    subways_gid: Mapped[int] = mapped_column(Integer, primary_key=True)
    streets_gid: Mapped[Optional[int]] = mapped_column(Integer)
    measure: Mapped[Optional[float]] = mapped_column(Double(53))
    distance: Mapped[Optional[float]] = mapped_column(Double(53))


class NycSubwayStations(Base):
    __tablename__ = "nyc_subway_stations"
    __table_args__ = (
        PrimaryKeyConstraint("gid", name="nyc_subway_stations_pkey"),
        Index("nyc_subway_stations_geom_idx", "geom"),
    )

    gid: Mapped[int] = mapped_column(Integer, primary_key=True)
    objectid: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric)
    id: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric)
    name: Mapped[Optional[str]] = mapped_column(String(31))
    alt_name: Mapped[Optional[str]] = mapped_column(String(38))
    cross_st: Mapped[Optional[str]] = mapped_column(String(27))
    long_name: Mapped[Optional[str]] = mapped_column(String(60))
    label: Mapped[Optional[str]] = mapped_column(String(50))
    borough: Mapped[Optional[str]] = mapped_column(String(15))
    nghbhd: Mapped[Optional[str]] = mapped_column(String(30))
    routes: Mapped[Optional[str]] = mapped_column(String(20))
    transfers: Mapped[Optional[str]] = mapped_column(String(25))
    color: Mapped[Optional[str]] = mapped_column(String(30))
    express: Mapped[Optional[str]] = mapped_column(String(10))
    closed: Mapped[Optional[str]] = mapped_column(String(10))
    geom: Mapped[Optional[Any]] = mapped_column(
        Geometry("POINT", 26918, from_text="ST_GeomFromEWKT", name="geometry")
    )
