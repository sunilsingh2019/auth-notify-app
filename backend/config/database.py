import databases
import sqlalchemy
from sqlalchemy.ext.declarative import declarative_base

from config.settings import DATABASE_URL

# SQLAlchemy setup
database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

# Base class for all models
Base = declarative_base()

# Function to create all database tables
def create_tables():
    engine = sqlalchemy.create_engine(DATABASE_URL)
    Base.metadata.create_all(engine)
