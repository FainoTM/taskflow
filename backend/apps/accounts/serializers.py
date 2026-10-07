from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    fullname = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'fullname', 'email')

    def get_fullname(self, obj):
        fullname = obj.get_full_name()

        return fullname if fullname else obj.username