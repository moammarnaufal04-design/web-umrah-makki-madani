"""End-to-end backend API tests for Makki Madani Tour & Travel."""
import os
import io
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://hajj-travel-id.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "moammarnaufal04@gmail.com"
ADMIN_PASSWORD = "MakkiAdmin2026!"


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


@pytest.fixture(scope="session")
def admin(api, token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    return s


# ---------- Health & Public ----------
class TestHealth:
    def test_health(self, api):
        r = api.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


class TestPublic:
    def test_site(self, api):
        r = api.get(f"{BASE_URL}/api/public/site")
        assert r.status_code == 200
        j = r.json()
        assert "settings" in j and "sections" in j and "categories" in j

    def test_categories(self, api):
        r = api.get(f"{BASE_URL}/api/public/categories")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_packages_list(self, api):
        r = api.get(f"{BASE_URL}/api/public/packages")
        assert r.status_code == 200
        j = r.json()
        assert "items" in j
        assert isinstance(j["items"], list)

    def test_packages_filters(self, api):
        r = api.get(f"{BASE_URL}/api/public/packages", params={"group": "UMRAH", "sort": "price_asc", "page": 1})
        assert r.status_code == 200

    def test_packages_months(self, api):
        r = api.get(f"{BASE_URL}/api/public/packages/months")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_package_detail(self, api):
        pkgs = api.get(f"{BASE_URL}/api/public/packages").json()["items"]
        assert pkgs, "No published packages"
        slug = pkgs[0]["slug"]
        r = api.get(f"{BASE_URL}/api/public/packages/{slug}")
        assert r.status_code == 200
        assert r.json()["slug"] == slug

    def test_package_detail_404(self, api):
        r = api.get(f"{BASE_URL}/api/public/packages/nonexistent-slug-xyz")
        assert r.status_code == 404

    def test_articles(self, api):
        r = api.get(f"{BASE_URL}/api/public/articles")
        assert r.status_code == 200

    def test_article_categories(self, api):
        r = api.get(f"{BASE_URL}/api/public/article-categories")
        assert r.status_code == 200

    def test_tags(self, api):
        r = api.get(f"{BASE_URL}/api/public/tags")
        assert r.status_code == 200

    def test_faqs(self, api):
        r = api.get(f"{BASE_URL}/api/public/faqs")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_testimonials(self, api):
        r = api.get(f"{BASE_URL}/api/public/testimonials")
        assert r.status_code == 200


# ---------- Public Submissions ----------
class TestSubmissions:
    def test_registration_invalid_whatsapp(self, api):
        pkgs = api.get(f"{BASE_URL}/api/public/packages").json()["items"]
        pkg_id = pkgs[0]["id"]
        r = api.post(f"{BASE_URL}/api/public/registrations", json={
            "package_id": pkg_id, "full_name": "TEST User", "gender": "MALE",
            "address": "Jl. Test 1", "whatsapp": "123",
        })
        assert r.status_code == 422

    def test_registration_honeypot(self, api):
        pkgs = api.get(f"{BASE_URL}/api/public/packages").json()["items"]
        pkg_id = pkgs[0]["id"]
        r = api.post(f"{BASE_URL}/api/public/registrations", json={
            "package_id": pkg_id, "full_name": "TEST Bot", "gender": "MALE",
            "address": "Jl. Bot", "whatsapp": "081234567890", "website": "spam",
        })
        assert r.status_code == 201
        assert r.json() == {"ok": True}

    def test_registration_success(self, api, admin):
        pkgs = api.get(f"{BASE_URL}/api/public/packages").json()["items"]
        pkg_id = pkgs[0]["id"]
        r = api.post(f"{BASE_URL}/api/public/registrations", json={
            "package_id": pkg_id, "full_name": "TEST E2E Jamaah", "gender": "MALE",
            "address": "Jl. Testing No. 1", "whatsapp": "081299887766",
            "plan_month": "2026-05", "notes": "pytest",
        })
        assert r.status_code == 201, r.text
        j = r.json()
        assert "registration" in j and "whatsapp_url" in j
        assert j["whatsapp_url"] and "wa.me" in j["whatsapp_url"]
        reg_id = j["registration"]["id"]
        pytest.reg_id_created = reg_id
        # verify present in admin list
        rl = admin.get(f"{BASE_URL}/api/admin/registrations", params={"q": "TEST E2E"})
        assert rl.status_code == 200
        items = rl.json().get("items", rl.json())
        if isinstance(items, dict):
            items = items.get("items", [])
        assert any(it.get("id") == reg_id or it.get("full_name") == "TEST E2E Jamaah" for it in items)

    def test_contact(self, api):
        r = api.post(f"{BASE_URL}/api/public/contact", json={
            "name": "TEST Contact", "whatsapp": "081234567890",
            "email": "test_contact@example.com", "subject": "hi", "message": "test message",
        })
        assert r.status_code == 201
        assert "id" in r.json()

    def test_newsletter_and_duplicate(self, api):
        email = f"test_news_{int(time.time())}@example.com"
        r1 = api.post(f"{BASE_URL}/api/public/newsletter", json={"email": email})
        assert r1.status_code == 201
        r2 = api.post(f"{BASE_URL}/api/public/newsletter", json={"email": email})
        assert r2.status_code == 201


# ---------- Auth ----------
class TestAuth:
    def test_login_invalid(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "WrongPassword123!"})
        assert r.status_code == 401

    def test_admin_requires_token(self, api):
        for p in ["/api/admin/me", "/api/admin/dashboard", "/api/admin/registrations", "/api/admin/packages"]:
            r = requests.get(f"{BASE_URL}{p}")
            assert r.status_code in (401, 403), f"{p} returned {r.status_code}"

    def test_me(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/me")
        assert r.status_code == 200
        assert r.json().get("email") == ADMIN_EMAIL

    def test_dashboard(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/dashboard")
        assert r.status_code == 200


# ---------- Admin resources ----------
class TestAdminResources:
    def test_settings(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/settings")
        assert r.status_code == 200

    def test_settings_bad_key(self, admin):
        r = admin.put(f"{BASE_URL}/api/admin/settings/__unknown_key__", json={"value": {}})
        assert r.status_code == 400

    def test_homepage_sections(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/homepage-sections")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_categories(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/categories")
        assert r.status_code == 200

    def test_packages(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/packages")
        assert r.status_code == 200

    def test_registrations(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/registrations")
        assert r.status_code == 200

    def test_customers(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/customers")
        assert r.status_code == 200

    def test_payments(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/payments")
        assert r.status_code == 200

    def test_payments_summary(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/payments/summary")
        assert r.status_code == 200

    def test_contact_messages(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/contact-messages")
        assert r.status_code == 200

    def test_newsletter(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/newsletter")
        assert r.status_code == 200

    def test_articles(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/articles")
        assert r.status_code == 200

    def test_article_categories(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/article-categories")
        assert r.status_code == 200

    def test_tags(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/tags")
        assert r.status_code == 200

    def test_faqs(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/faqs")
        assert r.status_code == 200

    def test_testimonials(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/testimonials")
        assert r.status_code == 200

    def test_admin_users(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/admin-users")
        assert r.status_code == 200

    def test_media_list(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/media")
        assert r.status_code == 200


# ---------- CRUD: Testimonial (create -> verify -> delete) ----------
class TestTestimonialCRUD:
    def test_crud(self, admin):
        payload = {"name": "TEST Testi", "content": "pytest testimonial", "is_active": True}
        r = admin.post(f"{BASE_URL}/api/admin/testimonials", json=payload)
        assert r.status_code == 201, r.text
        tid = r.json()["id"]
        # verify list
        r2 = admin.get(f"{BASE_URL}/api/admin/testimonials")
        assert any(x["id"] == tid for x in r2.json())
        # delete
        rd = admin.delete(f"{BASE_URL}/api/admin/testimonials/{tid}")
        assert rd.status_code in (200, 204)


class TestFaqCRUD:
    def test_crud(self, admin):
        payload = {"question": "TEST Q?", "answer": "TEST A", "is_active": True}
        r = admin.post(f"{BASE_URL}/api/admin/faqs", json=payload)
        assert r.status_code == 201, r.text
        fid = r.json()["id"]
        rd = admin.delete(f"{BASE_URL}/api/admin/faqs/{fid}")
        assert rd.status_code in (200, 204)


class TestTagCRUD:
    def test_crud(self, admin):
        import uuid
        name = f"TEST_tag_{uuid.uuid4().hex[:6]}"
        r = admin.post(f"{BASE_URL}/api/admin/tags", json={"name": name})
        assert r.status_code == 201, r.text
        tid = r.json()["id"]
        rd = admin.delete(f"{BASE_URL}/api/admin/tags/{tid}")
        assert rd.status_code in (200, 204)


# ---------- Exports ----------
class TestExports:
    @pytest.mark.parametrize("resource", ["registrations", "customers", "payments", "packages"])
    @pytest.mark.parametrize("fmt", ["csv", "xlsx"])
    def test_export(self, admin, resource, fmt):
        r = admin.get(f"{BASE_URL}/api/admin/export/{resource}", params={"format": fmt})
        assert r.status_code == 200, f"{resource} {fmt} -> {r.status_code}"
        assert len(r.content) > 0
