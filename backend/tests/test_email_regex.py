import re
import pytest

CU_EMAIL_REGEX = re.compile(r"^[^@\s]+@(student\.)?chula\.ac\.th$")


@pytest.mark.parametrize("email,expected", [
    ("a@chula.ac.th", True),
    ("a@student.chula.ac.th", True),
    ("a@gmail.com", False),
    ("a@chula.ac.th.evil.com", False),
    ("", False),
    ("nodomain", False),
])
def test_email_regex(email, expected):
    assert bool(CU_EMAIL_REGEX.match(email)) == expected