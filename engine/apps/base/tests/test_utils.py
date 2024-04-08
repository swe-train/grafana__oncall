import pytest

from apps.base.utils import LiveSettingValidator



class TestLiveSettingValidator:

    NUMBER_INVALID_ERROR = "Please specify a valid phone number"

    @pytest.mark.parametrize(
        "phone_number,expected",
        [
            ("+15145555555", None),
            ("+1 (514) 555-5555", None),
            ("+3197010525555", None),
            ("gibberish", NUMBER_INVALID_ERROR)
        ],
    )
    def test_check_twilio_number(self, phone_number, expected):
        assert LiveSettingValidator(None)._check_twilio_number(phone_number) == expected
