from sqlalchemy import Column, String, Float, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base

class College(Base):
    __tablename__ = "colleges"

    code = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city = Column(String)
    district = Column(String)
    type = Column(String)
    is_active = Column(Boolean, default=True)

    cutoffs = relationship("Cutoff", back_populates="college")
    placements = relationship("Placement", back_populates="college")
    fees = relationship("Fee", back_populates="college")


class Branch(Base):
    __tablename__ = "branches"

    code = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    cutoffs = relationship("Cutoff", back_populates="branch")
