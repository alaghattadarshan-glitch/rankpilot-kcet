from pydantic import BaseModel
from typing import List, Optional

class PreferenceBase(BaseModel):
    kcet_rank: Optional[int] = None
    category: Optional[str] = None
    is_rural: Optional[bool] = False
    is_kannada: Optional[bool] = False
    preferred_branches: Optional[List[str]] = []
    preferred_locations: Optional[List[str]] = []
    max_budget: Optional[int] = None
    counselling_round: Optional[str] = "Mock"

class PreferenceCreate(PreferenceBase):
    pass

class PreferenceResponse(PreferenceBase):
    id: str
    user_id: str

    class Config:
        from_attributes = True
