from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class SeatMatrix(Base):
    __tablename__ = "seat_matrix"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    college_code = Column(String, ForeignKey("colleges.code"), index=True)
    branch_code = Column(String, ForeignKey("branches.code"), index=True)
    category = Column(String, index=True)
    seats_available = Column(Integer, default=0)

    college = relationship("College")
    branch = relationship("Branch")
