"""Backend tests for Gallery and Testimonials features"""

import os
import tempfile
from pathlib import Path

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
# Read from the environment rather than hardcoding — this used to be the
# actual literal default password, which was leaked via source control and
# is now permanently blocked by server.py's require_env() at startup.
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@e3c-construction.com")
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]


@pytest.fixture(scope="module")
def admin_token():
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert resp.status_code == 200
    cookies = resp.cookies
    return cookies


@pytest.fixture(scope="module")
def admin_session(admin_token):
    s = requests.Session()
    s.cookies.update(admin_token)
    return s


# ─── Testimonials ─────────────────────────────────────────────────────────────


class TestTestimonials:
    """Testimonials API tests"""

    def test_submit_testimonial_public(self):
        """POST /api/testimonials - public endpoint, no auth required"""
        resp = requests.post(
            f"{BASE_URL}/api/testimonials",
            json={
                "name": "TEST_Jean Dupont",
                "commune": "Pointe-à-Pitre",
                "service": "Maçonnerie",
                "stars": 5,
                "text": "Excellent travail, très professionnel.",
                "email": "test_jean@example.com",
            },
        )
        assert (
            resp.status_code == 200
        ), f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "message" in data
        assert "id" in data
        print(f"PASS: Submit testimonial - id={data['id']}")
        TestTestimonials.testimonial_id = data["id"]

    def test_submit_testimonial_missing_fields(self):
        """POST /api/testimonials - should fail with missing name/text"""
        resp = requests.post(
            f"{BASE_URL}/api/testimonials", json={"name": "", "text": "", "stars": 5}
        )
        assert resp.status_code == 400
        print("PASS: Missing fields validation works")

    def test_submit_testimonial_invalid_stars(self):
        """POST /api/testimonials - invalid star rating"""
        resp = requests.post(
            f"{BASE_URL}/api/testimonials",
            json={"name": "TEST_User", "text": "Good work", "stars": 6},
        )
        assert resp.status_code == 400
        print("PASS: Invalid star rating rejected")

    def test_get_testimonials_public_only_approved(self):
        """GET /api/testimonials - only approved testimonials"""
        resp = requests.get(f"{BASE_URL}/api/testimonials")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        # All returned testimonials should be approved
        for t in data:
            assert (
                t.get("status") == "approved"
            ), f"Non-approved testimonial returned: {t}"
        print(f"PASS: GET testimonials returns {len(data)} approved testimonials")

    def test_get_testimonials_admin_requires_auth(self):
        """GET /api/testimonials/admin - requires admin auth"""
        resp = requests.get(f"{BASE_URL}/api/testimonials/admin")
        assert resp.status_code == 401
        print("PASS: Admin testimonials endpoint requires auth")

    def test_get_testimonials_admin(self, admin_session):
        """GET /api/testimonials/admin - admin can see all"""
        resp = admin_session.get(f"{BASE_URL}/api/testimonials/admin")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        print(f"PASS: Admin GET testimonials returns {len(data)} total testimonials")

    def test_approve_testimonial(self, admin_session):
        """PATCH /api/testimonials/{id} - approve"""
        t_id = getattr(TestTestimonials, "testimonial_id", None)
        if not t_id:
            pytest.skip("No testimonial ID available")
        resp = admin_session.patch(
            f"{BASE_URL}/api/testimonials/{t_id}", json={"status": "approved"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "message" in data
        print(f"PASS: Approve testimonial {t_id}")

    def test_approved_testimonial_visible_publicly(self):
        """After approval, testimonial should appear in public GET"""
        resp = requests.get(f"{BASE_URL}/api/testimonials")
        assert resp.status_code == 200
        data = resp.json()
        t_id = getattr(TestTestimonials, "testimonial_id", None)
        ids = [t["id"] for t in data]
        assert t_id in ids, f"Approved testimonial {t_id} not in public list"
        print(f"PASS: Approved testimonial visible publicly")

    def test_reject_testimonial(self, admin_session):
        """PATCH /api/testimonials/{id} - reject"""
        t_id = getattr(TestTestimonials, "testimonial_id", None)
        if not t_id:
            pytest.skip("No testimonial ID available")
        resp = admin_session.patch(
            f"{BASE_URL}/api/testimonials/{t_id}", json={"status": "rejected"}
        )
        assert resp.status_code == 200
        print(f"PASS: Reject testimonial {t_id}")

    def test_rejected_testimonial_not_visible_publicly(self):
        """After rejection, testimonial should NOT appear in public GET"""
        resp = requests.get(f"{BASE_URL}/api/testimonials")
        assert resp.status_code == 200
        data = resp.json()
        t_id = getattr(TestTestimonials, "testimonial_id", None)
        ids = [t["id"] for t in data]
        assert t_id not in ids, f"Rejected testimonial {t_id} still in public list"
        print(f"PASS: Rejected testimonial hidden from public")


# ─── Gallery ──────────────────────────────────────────────────────────────────


class TestGallery:
    """Gallery API tests"""

    def test_get_gallery_public(self):
        """GET /api/gallery - public endpoint"""
        resp = requests.get(f"{BASE_URL}/api/gallery")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        print(f"PASS: GET gallery returns {len(data)} images")

    def test_upload_gallery_requires_auth(self):
        """POST /api/gallery - requires admin auth"""
        # Create a small test image
        tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        tmp.write(b"\xff\xd8\xff\xe0" + b"\x00" * 100)  # minimal JPEG header
        tmp.close()
        resp = requests.post(
            f"{BASE_URL}/api/gallery",
            files={"file": ("test.jpg", open(tmp.name, "rb"), "image/jpeg")},
            data={"label": "Test", "category": "Maçonnerie"},
        )
        assert resp.status_code == 401
        print("PASS: Gallery upload requires auth")

    def test_upload_gallery_image(self, admin_session):
        """POST /api/gallery - upload test image as admin"""
        # Create minimal valid JPEG
        import struct

        # 1x1 white JPEG
        jpeg_bytes = bytes(
            [
                0xFF,
                0xD8,
                0xFF,
                0xE0,
                0x00,
                0x10,
                0x4A,
                0x46,
                0x49,
                0x46,
                0x00,
                0x01,
                0x01,
                0x00,
                0x00,
                0x01,
                0x00,
                0x01,
                0x00,
                0x00,
                0xFF,
                0xDB,
                0x00,
                0x43,
                0x00,
                0x08,
                0x06,
                0x06,
                0x07,
                0x06,
                0x05,
                0x08,
                0x07,
                0x07,
                0x07,
                0x09,
                0x09,
                0x08,
                0x0A,
                0x0C,
                0x14,
                0x0D,
                0x0C,
                0x0B,
                0x0B,
                0x0C,
                0x19,
                0x12,
                0x13,
                0x0F,
                0x14,
                0x1D,
                0x1A,
                0x1F,
                0x1E,
                0x1D,
                0x1A,
                0x1C,
                0x1C,
                0x20,
                0x24,
                0x2E,
                0x27,
                0x20,
                0x22,
                0x2C,
                0x23,
                0x1C,
                0x1C,
                0x28,
                0x37,
                0x29,
                0x2C,
                0x30,
                0x31,
                0x34,
                0x34,
                0x34,
                0x1F,
                0x27,
                0x39,
                0x3D,
                0x38,
                0x32,
                0x3C,
                0x2E,
                0x33,
                0x34,
                0x32,
                0xFF,
                0xC0,
                0x00,
                0x0B,
                0x08,
                0x00,
                0x01,
                0x00,
                0x01,
                0x01,
                0x01,
                0x11,
                0x00,
                0xFF,
                0xC4,
                0x00,
                0x1F,
                0x00,
                0x00,
                0x01,
                0x05,
                0x01,
                0x01,
                0x01,
                0x01,
                0x01,
                0x01,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0x01,
                0x02,
                0x03,
                0x04,
                0x05,
                0x06,
                0x07,
                0x08,
                0x09,
                0x0A,
                0x0B,
                0xFF,
                0xC4,
                0x00,
                0xB5,
                0x10,
                0x00,
                0x02,
                0x01,
                0x03,
                0x03,
                0x02,
                0x04,
                0x03,
                0x05,
                0x05,
                0x04,
                0x04,
                0x00,
                0x00,
                0x01,
                0x7D,
                0x01,
                0x02,
                0x03,
                0x00,
                0x04,
                0x11,
                0x05,
                0x12,
                0x21,
                0x31,
                0x41,
                0x06,
                0x13,
                0x51,
                0x61,
                0x07,
                0x22,
                0x71,
                0x14,
                0x32,
                0x81,
                0x91,
                0xA1,
                0x08,
                0x23,
                0x42,
                0xB1,
                0xC1,
                0x15,
                0x52,
                0xD1,
                0xF0,
                0x24,
                0x33,
                0x62,
                0x72,
                0x82,
                0x09,
                0x0A,
                0x16,
                0x17,
                0x18,
                0x19,
                0x1A,
                0x25,
                0x26,
                0x27,
                0x28,
                0x29,
                0x2A,
                0x34,
                0x35,
                0x36,
                0x37,
                0x38,
                0x39,
                0x3A,
                0x43,
                0x44,
                0x45,
                0x46,
                0x47,
                0x48,
                0x49,
                0x4A,
                0x53,
                0x54,
                0x55,
                0x56,
                0x57,
                0x58,
                0x59,
                0x5A,
                0x63,
                0x64,
                0x65,
                0x66,
                0x67,
                0x68,
                0x69,
                0x6A,
                0x73,
                0x74,
                0x75,
                0x76,
                0x77,
                0x78,
                0x79,
                0x7A,
                0x83,
                0x84,
                0x85,
                0x86,
                0x87,
                0x88,
                0x89,
                0x8A,
                0x92,
                0x93,
                0x94,
                0x95,
                0x96,
                0x97,
                0x98,
                0x99,
                0x9A,
                0xA2,
                0xA3,
                0xA4,
                0xA5,
                0xA6,
                0xA7,
                0xA8,
                0xA9,
                0xAA,
                0xB2,
                0xB3,
                0xB4,
                0xB5,
                0xB6,
                0xB7,
                0xB8,
                0xB9,
                0xBA,
                0xC2,
                0xC3,
                0xC4,
                0xC5,
                0xC6,
                0xC7,
                0xC8,
                0xC9,
                0xCA,
                0xD2,
                0xD3,
                0xD4,
                0xD5,
                0xD6,
                0xD7,
                0xD8,
                0xD9,
                0xDA,
                0xE1,
                0xE2,
                0xE3,
                0xE4,
                0xE5,
                0xE6,
                0xE7,
                0xE8,
                0xE9,
                0xEA,
                0xF1,
                0xF2,
                0xF3,
                0xF4,
                0xF5,
                0xF6,
                0xF7,
                0xF8,
                0xF9,
                0xFA,
                0xFF,
                0xDA,
                0x00,
                0x08,
                0x01,
                0x01,
                0x00,
                0x00,
                0x3F,
                0x00,
                0xFB,
                0xD3,
                0xFF,
                0xD9,
            ]
        )
        import io

        resp = admin_session.post(
            f"{BASE_URL}/api/gallery",
            files={"file": ("test_gallery.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")},
            data={"label": "TEST_Image Maçonnerie", "category": "Maçonnerie"},
        )
        assert (
            resp.status_code == 200
        ), f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "id" in data
        assert "url" in data
        assert "label" in data
        assert data["label"] == "TEST_Image Maçonnerie"
        assert data["category"] == "Maçonnerie"
        print(f"PASS: Upload gallery image - id={data['id']}, url={data['url']}")
        TestGallery.image_id = data["id"]
        TestGallery.image_url = data["url"]

    def test_gallery_image_accessible(self):
        """Uploaded image URL should be accessible"""
        url = getattr(TestGallery, "image_url", None)
        if not url:
            pytest.skip("No image URL available")
        full_url = f"{BASE_URL}{url}"
        resp = requests.get(full_url)
        assert resp.status_code == 200, f"Image not accessible at {full_url}"
        print(f"PASS: Image accessible at {full_url}")

    def test_get_gallery_contains_uploaded(self):
        """GET /api/gallery should include newly uploaded image"""
        resp = requests.get(f"{BASE_URL}/api/gallery")
        assert resp.status_code == 200
        data = resp.json()
        img_id = getattr(TestGallery, "image_id", None)
        ids = [img["id"] for img in data]
        assert img_id in ids, f"Uploaded image {img_id} not found in gallery"
        print(f"PASS: Uploaded image in gallery list")

    def test_delete_gallery_image(self, admin_session):
        """DELETE /api/gallery/{id}"""
        img_id = getattr(TestGallery, "image_id", None)
        if not img_id:
            pytest.skip("No image ID available")
        resp = admin_session.delete(f"{BASE_URL}/api/gallery/{img_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert "message" in data
        print(f"PASS: Delete gallery image {img_id}")

    def test_get_gallery_after_delete(self):
        """Image should not be in gallery after deletion"""
        resp = requests.get(f"{BASE_URL}/api/gallery")
        assert resp.status_code == 200
        data = resp.json()
        img_id = getattr(TestGallery, "image_id", None)
        ids = [img["id"] for img in data]
        assert img_id not in ids, f"Deleted image {img_id} still in gallery"
        print(f"PASS: Deleted image not in gallery")
