class Roles:
    ADMIN = 'ADMIN'
    SUPPORT = 'SUPPORT'
    DEVELOPER = 'DEVELOPER'

def get_user_role(user):
    if not user or not user.is_authenticated or not user.is_active:
        return None

    if user.is_superuser:
        return Roles.ADMIN

    groups = set(user.groups.values_list('name', flat=True))

    if 'Administrador' in groups:
        return Roles.ADMIN

    if 'Suporte' in groups:
        return Roles.SUPPORT

    if 'Programador' in groups:
        return Roles.DEVELOPER

    return None
