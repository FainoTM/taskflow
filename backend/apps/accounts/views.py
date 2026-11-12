from django.contrib.auth import get_user_model

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .permissions import IsAppMember
from .serializers import UserSerializer
from .roles import get_user_role

User = get_user_model()


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsAppMember]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(
            is_active=True
        ).order_by(
            'first_name',
            'username'
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAppMember])
def me(request):
    user = request.user

    return Response({
        'id': user.id,
        'username': user.username,
        'full_name': user.get_full_name() or user.username,
        'email': user.email,
        'role': get_user_role(user),
        'is_staff': user.is_staff,
    })
