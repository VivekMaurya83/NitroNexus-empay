from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import ResponseModel
from app.api.v1.deps import get_current_user
from app.services.ai_service import ask_ai
from app.models.enums import UserRole

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


class AIQuery(BaseModel):
    question: str


@router.post("/ask", response_model=ResponseModel)
def ask(payload: AIQuery, db: Session = Depends(get_db),
        cu: User = Depends(get_current_user)):
    if not payload.question.strip():
        raise HTTPException(400, "Question cannot be empty")
    employee_id = None
    if cu.role == UserRole.EMPLOYEE and cu.employee:
        employee_id = cu.employee.id
    answer = ask_ai(db, payload.question, cu.company_id, employee_id)
    return ResponseModel(data={"question": payload.question, "answer": answer})