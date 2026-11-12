from rest_framework.routers import DefaultRouter
from .views import UserViewSet, me
from django.urls import path
router = DefaultRouter()

router.register(
    r'users',
    UserViewSet,
    basename='users'
)

urlpatterns = [
    path('auth/me/', me, name='auth-me'),
] + router.urls