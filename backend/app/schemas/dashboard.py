from .camel import CamelModel


class DashboardDto(CamelModel):
    tickets_today: int
    active_buses: int
    online_users: int
    ai_recommendations: int
    satisfaction: float
