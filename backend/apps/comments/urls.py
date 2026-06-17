from rest_framework.routers import DefaultRouter
from .views import TaskCommentViewSet

router = DefaultRouter()
router.register(r'comments', TaskCommentViewSet, basename='comments')

urlpatterns = router.urls