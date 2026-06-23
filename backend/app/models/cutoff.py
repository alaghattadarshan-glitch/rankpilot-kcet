from sqlalchemy import Column, String, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db.database import Base

class Cutoff(Base):
    __tablename__ = "cutoffs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    year = Column(Integer, index=True)
    round = Column(String, index=True)
    college_code = Column(String, ForeignKey("colleges.code"), index=True)
    branch_code = Column(String, ForeignKey("branches.code"), index=True)
    category = Column(String, index=True)
    cutoff_rank = Column(Integer)

    college = relationship("College", back_populates="cutoffs")
    branch = relationship("Branch", back_populates="cutoffs")

class Placement(Base):
    __tablename__ = "placements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    college_code = Column(String, ForeignKey("colleges.code"), index=True)
    year = Column(Integer)
    avg_package = Column(Float)
    highest_package = Column(Float)
    placement_percentage = Column(Float)

    college = relationship("College", back_populates="placements")

class Fee(Base):
    __tablename__ = "fees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    college_code = Column(String, ForeignKey("colleges.code"), index=True)
    quota = Column(String) # Govt, SNQ, Private
    fee_amount = Column(Integer)

    college = relationship("College", back_populates="fees")
