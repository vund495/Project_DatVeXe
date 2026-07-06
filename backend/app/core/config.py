from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres.bqoshsbirwfyuvdhzrjm:password@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
    alembic_database_url: str = ""
    secret_key: str = "your-secret-key"
    gemini_api_key: str = ""
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,https://project-datvexe.onrender.com"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
