from pydantic import BaseModel, ConfigDict


def _camelize(snake_str: str) -> str:
    first, *rest = snake_str.split("_")
    return first + "".join(w.capitalize() for w in rest)


class CamelModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=_camelize,
        populate_by_name=True,
    )
