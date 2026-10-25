from rest_framework import serializers


class AskQuestionSerializer(serializers.Serializer):
    """Validates incoming question submission and targeted document list."""

    question = serializers.CharField(
        required=True,
        min_length=1,
        max_length=1000,
        trim_whitespace=True
    )
    document_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list
    )
