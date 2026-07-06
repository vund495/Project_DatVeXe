from .camel import CamelModel


class CityDto(CamelModel):
    id: int
    name: str
    region: str
