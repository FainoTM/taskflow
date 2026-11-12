from rest_framework.permissions import BasePermission
from .roles import Roles, get_user_role


class IsAppMember(BasePermission):
    message = 'Seu usuário não possui perfil no TaskFlow.'

    def has_permission(self, request, view):
        return get_user_role(request.user) is not None


class IsAppAdmin(BasePermission):
    message = 'Apenas administradores podem executar esta ação.'

    def has_permission(self, request, view):
        return get_user_role(request.user) == Roles.ADMIN


class CanDevelop(BasePermission):
    message = 'Apenas programadores e administradores podem alterar o progresso.'

    def has_permission(self, request, view):
        return get_user_role(request.user) in [
            Roles.ADMIN,
            Roles.DEVELOPER,
        ]


class CanValidate(BasePermission):
    message = 'Apenas suporte e administradores podem validar tasks.'

    def has_permission(self, request, view):
        return get_user_role(request.user) in [
            Roles.ADMIN,
            Roles.SUPPORT,
        ]
