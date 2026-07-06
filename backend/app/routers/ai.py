from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.models.user import User
from app.services import ai as ai_service
from app.services.deps import get_current_user

router = APIRouter(tags=["ai"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@router.post("/api/ai/chat")
async def chat(request: ChatRequest, current_user: User = Depends(get_current_user)) -> ChatResponse:
    reply = ai_service.generate_reply(request.message)
    return ChatResponse(reply=reply)
