from pydantic import BaseModel
from typing import Any, Optional

class ResponseModel(BaseModel):
    success: bool = True
    message: str = "OK"
    data: Optional[Any] = None