import sqlalchemy
from sqlalchemy import Column, Integer, String, DateTime, Boolean, func
from sqlalchemy.sql import functions

from config.database import Base, metadata

# User table
users = sqlalchemy.Table(
    "users",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("email", sqlalchemy.String, unique=True, index=True),
    sqlalchemy.Column("hashed_password", sqlalchemy.String),
    sqlalchemy.Column("created_at", sqlalchemy.DateTime, default=func.now()),
    sqlalchemy.Column("is_verified", sqlalchemy.Boolean, default=False),
    sqlalchemy.Column("verification_token", sqlalchemy.String, nullable=True),
    sqlalchemy.Column("verification_token_expires", sqlalchemy.DateTime, nullable=True),
)

# SQLAlchemy ORM model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=functions.now())
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
