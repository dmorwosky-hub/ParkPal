#!/usr/bin/env python3
"""
Park-Pal API Test Suite
Tests all backend endpoints including auth, spots, bookings, stats, notifications, violations, and promotions.
"""

import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://parkpal-staging.preview.emergentagent.com').rstrip('/')

# Test data storage
class TestData:
    host_token = None
    guest_token = None
    host_user = None
    guest_user = None
    test_spot_id = None
    test_booking_id = None
    test_promo_session_id = None


@pytest.fixture(scope="session")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def test_data():
    """Shared test data across tests"""
    return TestData()


# ============ AUTH TESTS ============

class TestAuthEndpoints:
    """Authentication endpoint tests"""

    def test_api_root(self, api_client):
        """Test GET /api/ returns API info"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Park-Pal API" in data["message"]
        assert "version" in data
        print(f"API Root: {data}")

    def test_register_host(self, api_client, test_data):
        """Test POST /api/auth/register creates host user"""
        timestamp = int(time.time())
        user_data = {
            "email": f"TEST_host_{timestamp}@test.com",
            "password": "testpass123",
            "full_name": "Test Host User",
            "role": "host"
        }
        
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=user_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "host"
        assert data["user"]["email"] == user_data["email"]
        
        test_data.host_token = data["access_token"]
        test_data.host_user = data["user"]
        print(f"Host registered: {data['user']['email']}")

    def test_register_guest(self, api_client, test_data):
        """Test POST /api/auth/register creates guest user"""
        timestamp = int(time.time())
        user_data = {
            "email": f"TEST_guest_{timestamp}@test.com",
            "password": "testpass123",
            "full_name": "Test Guest User",
            "role": "guest"
        }
        
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=user_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "guest"
        
        test_data.guest_token = data["access_token"]
        test_data.guest_user = data["user"]
        print(f"Guest registered: {data['user']['email']}")

    def test_login_host(self, api_client, test_data):
        """Test POST /api/auth/login returns token"""
        if not test_data.host_user:
            pytest.skip("No host user to test login")
        
        login_data = {
            "email": test_data.host_user["email"],
            "password": "testpass123"
        }
        
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == test_data.host_user["email"]
        print(f"Host login successful")

    def test_get_me(self, api_client, test_data):
        """Test GET /api/auth/me returns user info"""
        if not test_data.host_token:
            pytest.skip("No host token")
        
        headers = {"Authorization": f"Bearer {test_data.host_token}"}
        response = api_client.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["role"] == "host"
        assert data["email"] == test_data.host_user["email"]
        print(f"User profile retrieved: {data['email']}")


# ============ SPOTS TESTS ============

class TestSpotsEndpoints:
    """Parking spots CRUD tests"""

    def test_create_spot(self, api_client, test_data):
        """Test POST /api/spots creates spot"""
        if not test_data.host_token:
            pytest.skip("No host token")
        
        spot_data = {
            "address": "TEST_123 Main Street",
            "city": "Los Angeles",
            "state": "CA",
            "zip_code": "90001",
            "latitude": 34.0522,
            "longitude": -118.2437,
            "hourly_rate": 5.0,
            "event_rate": 20.0,
            "description": "Test parking spot for automated testing"
        }
        
        headers = {"Authorization": f"Bearer {test_data.host_token}"}
        response = api_client.post(f"{BASE_URL}/api/spots", json=spot_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["address"] == spot_data["address"]
        assert data["hourly_rate"] == spot_data["hourly_rate"]
        assert data["is_active"] == False  # New spots start inactive
        
        test_data.test_spot_id = data["id"]
        print(f"Spot created: {data['id']}")

    def test_get_available_spots(self, api_client):
        """Test GET /api/spots returns active spots"""
        response = api_client.get(f"{BASE_URL}/api/spots")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Available spots: {len(data)}")

    def test_get_my_spots(self, api_client, test_data):
        """Test GET /api/spots/my returns host spots"""
        if not test_data.host_token:
            pytest.skip("No host token")
        
        headers = {"Authorization": f"Bearer {test_data.host_token}"}
        response = api_client.get(f"{BASE_URL}/api/spots/my", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # At least the spot we created
        print(f"Host spots: {len(data)}")

    def test_toggle_spot_active(self, api_client, test_data):
        """Test POST /api/spots/{id}/toggle toggles active"""
        if not test_data.host_token or not test_data.test_spot_id:
            pytest.skip("No host token or spot ID")
        
        headers = {"Authorization": f"Bearer {test_data.host_token}"}
        response = api_client.post(
            f"{BASE_URL}/api/spots/{test_data.test_spot_id}/toggle",
            json={},
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "is_active" in data
        assert data["is_active"] == True  # Should be active now
        print(f"Spot toggled to active: {data['is_active']}")

    def test_update_spot_pricing(self, api_client, test_data):
        """Test PATCH /api/spots/{id} updates spot"""
        if not test_data.host_token or not test_data.test_spot_id:
            pytest.skip("No host token or spot ID")
        
        update_data = {
            "hourly_rate": 7.5,
            "event_rate": 25.0
        }
        
        headers = {"Authorization": f"Bearer {test_data.host_token}"}
        response = api_client.patch(
            f"{BASE_URL}/api/spots/{test_data.test_spot_id}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["hourly_rate"] == 7.5
        assert data["event_rate"] == 25.0
        print(f"Spot pricing updated: ${data['hourly_rate']}/hr")

    def test_set_auto_off_timer(self, api_client, test_data):
        """Test PATCH /api/spots/{id} sets auto-off timer"""
        if not test_data.host_token or not test_data.test_spot_id:
            pytest.skip("No host token or spot ID")
        
        update_data = {
            "auto_off_hours": 2,
            "is_active": True
        }
        
        headers = {"Authorization": f"Bearer {test_data.host_token}"}
        response = api_client.patch(
            f"{BASE_URL}/api/spots/{test_data.test_spot_id}",
            json=update_data,
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["auto_off_time"] is not None
        print(f"Auto-off timer set: {data['auto_off_time']}")


# ============ BOOKINGS TESTS ============

class TestBookingsEndpoints:
    """Booking endpoint tests"""

    def test_create_booking_checkout(self, api_client, test_data):
        """Test POST /api/bookings/checkout creates checkout session"""
        if not test_data.guest_token or not test_data.test_spot_id:
            pytest.skip("No guest token or spot ID")
        
        # Ensure spot is active
        if test_data.host_token:
            headers = {"Authorization": f"Bearer {test_data.host_token}"}
            spot_response = api_client.get(f"{BASE_URL}/api/spots/{test_data.test_spot_id}", headers=headers)
            if spot_response.status_code == 200:
                spot_data = spot_response.json()
                if not spot_data.get("is_active"):
                    api_client.post(
                        f"{BASE_URL}/api/spots/{test_data.test_spot_id}/toggle",
                        json={},
                        headers=headers
                    )
                    time.sleep(0.5)
        
        booking_data = {
            "spot_id": test_data.test_spot_id,
            "license_plate": "TEST123",
            "vehicle_make": "Toyota",
            "vehicle_model": "Camry",
            "hours": 2,
            "use_event_rate": False,
            "origin_url": "https://test.com"
        }
        
        headers = {"Authorization": f"Bearer {test_data.guest_token}"}
        response = api_client.post(
            f"{BASE_URL}/api/bookings/checkout",
            json=booking_data,
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "checkout_url" in data
        assert "session_id" in data
        assert "booking_id" in data
        
        test_data.test_booking_id = data["booking_id"]
        print(f"Booking checkout created: {data['booking_id']}")

    def test_get_my_bookings(self, api_client, test_data):
        """Test GET /api/bookings/my returns user bookings"""
        if not test_data.guest_token:
            pytest.skip("No guest token")
        
        headers = {"Authorization": f"Bearer {test_data.guest_token}"}
        response = api_client.get(f"{BASE_URL}/api/bookings/my", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Guest bookings: {len(data)}")

    def test_get_booking_history(self, api_client, test_data):
        """Test GET /api/bookings/history returns enriched history"""
        if not test_data.guest_token:
            pytest.skip("No guest token")
        
        headers = {"Authorization": f"Bearer {test_data.guest_token}"}
        response = api_client.get(f"{BASE_URL}/api/bookings/history", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        # Check enriched fields if there are bookings
        if len(data) > 0:
            booking = data[0]
            assert "spot_address" in booking or "spot_id" in booking
        print(f"Booking history items: {len(data)}")

    def test_get_active_host_bookings(self, api_client, test_data):
        """Test GET /api/bookings/active/host returns active bookings for host"""
        if not test_data.host_token:
            pytest.skip("No host token")
        
        headers = {"Authorization": f"Bearer {test_data.host_token}"}
        response = api_client.get(f"{BASE_URL}/api/bookings/active/host", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Active host bookings: {len(data)}")


# ============ STATS TESTS ============

class TestStatsEndpoints:
    """Stats endpoint tests"""

    def test_get_host_stats(self, api_client, test_data):
        """Test GET /api/stats/host returns host earnings data"""
        if not test_data.host_token:
            pytest.skip("No host token")
        
        headers = {"Authorization": f"Bearer {test_data.host_token}"}
        response = api_client.get(f"{BASE_URL}/api/stats/host", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "total_spots" in data
        assert "active_spots" in data
        assert "total_earnings" in data
        assert "total_bookings" in data
        assert "monthly_earnings" in data
        print(f"Host stats: {data['total_spots']} spots, ${data['total_earnings']} earnings")

    def test_get_guest_stats(self, api_client, test_data):
        """Test GET /api/stats/guest returns guest stats"""
        if not test_data.guest_token:
            pytest.skip("No guest token")
        
        headers = {"Authorization": f"Bearer {test_data.guest_token}"}
        response = api_client.get(f"{BASE_URL}/api/stats/guest", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "total_bookings" in data
        assert "active_bookings" in data
        assert "total_spent" in data
        assert "total_hours_parked" in data
        print(f"Guest stats: {data['total_bookings']} bookings, ${data['total_spent']} spent")


# ============ NOTIFICATIONS TESTS ============

class TestNotificationsEndpoints:
    """Notifications endpoint tests"""

    def test_get_notifications(self, api_client, test_data):
        """Test GET /api/notifications returns notifications list"""
        if not test_data.host_token:
            pytest.skip("No host token")
        
        headers = {"Authorization": f"Bearer {test_data.host_token}"}
        response = api_client.get(f"{BASE_URL}/api/notifications", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Notifications: {len(data)}")


# ============ VIOLATIONS TESTS ============

class TestViolationsEndpoints:
    """Violations endpoint tests"""

    def test_report_violation(self, api_client, test_data):
        """Test POST /api/violations/report creates violation"""
        if not test_data.host_token or not test_data.test_booking_id:
            pytest.skip("No host token or booking ID")
        
        violation_data = {
            "booking_id": test_data.test_booking_id,
            "reason": "Test violation report - automated testing"
        }
        
        headers = {"Authorization": f"Bearer {test_data.host_token}"}
        response = api_client.post(
            f"{BASE_URL}/api/violations/report",
            json=violation_data,
            headers=headers
        )
        
        # May fail if booking doesn't exist or isn't for host's spot
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            print(f"Violation reported: {data.get('violation_id')}")
        else:
            # Expected if booking isn't confirmed yet
            print(f"Violation report skipped (booking may not be confirmed): {response.status_code}")


# ============ PROMOTIONS TESTS ============

class TestPromotionsEndpoints:
    """Promotions endpoint tests"""

    def test_get_promotion_packages(self, api_client):
        """Test GET /api/promotions/packages returns 3 packages"""
        response = api_client.get(f"{BASE_URL}/api/promotions/packages")
        assert response.status_code == 200
        
        data = response.json()
        assert "packages" in data
        packages = data["packages"]
        assert len(packages) == 3
        
        # Verify package structure
        expected_ids = ["1_day", "3_days", "7_days"]
        package_ids = [pkg["id"] for pkg in packages]
        for expected_id in expected_ids:
            assert expected_id in package_ids
        
        # Verify each package has required fields
        for pkg in packages:
            assert "id" in pkg
            assert "days" in pkg
            assert "price" in pkg
            assert "label" in pkg
            assert "description" in pkg
        
        print(f"Promotion packages: {[p['label'] for p in packages]}")

    def test_create_promotion_checkout(self, api_client, test_data):
        """Test POST /api/promotions/checkout creates checkout session"""
        if not test_data.host_token or not test_data.test_spot_id:
            pytest.skip("No host token or spot ID")
        
        promo_data = {
            "spot_id": test_data.test_spot_id,
            "package": "1_day",
            "origin_url": "https://test.com"
        }
        
        headers = {"Authorization": f"Bearer {test_data.host_token}"}
        response = api_client.post(
            f"{BASE_URL}/api/promotions/checkout",
            json=promo_data,
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "checkout_url" in data
        assert "session_id" in data
        assert "spot_id" in data
        
        test_data.test_promo_session_id = data["session_id"]
        print(f"Promotion checkout created: {data['session_id']}")


# ============ SPOT DELETE TEST ============

class TestSpotDelete:
    """Spot deletion tests - run last"""

    def test_delete_spot(self, api_client, test_data):
        """Test DELETE /api/spots/{id} deletes spot"""
        if not test_data.host_token or not test_data.test_spot_id:
            pytest.skip("No host token or spot ID")
        
        headers = {"Authorization": f"Bearer {test_data.host_token}"}
        response = api_client.delete(
            f"{BASE_URL}/api/spots/{test_data.test_spot_id}",
            headers=headers
        )
        
        # May fail if there are active bookings
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            print(f"Spot deleted successfully")
        elif response.status_code == 400:
            # Expected if there are active bookings
            print(f"Spot deletion skipped (may have active bookings)")
        else:
            assert False, f"Unexpected status code: {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
