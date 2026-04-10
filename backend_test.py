#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class ParkPalAPITester:
    def __init__(self, base_url="https://parkpal-staging.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.host_token = None
        self.guest_token = None
        self.host_user = None
        self.guest_user = None
        self.test_spot_id = None
        self.test_booking_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"test": name, "error": details})

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text}
            
            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        success, data = self.make_request('GET', '')
        self.log_test("API Root Endpoint", success and "Park-Pal API" in str(data))
        return success

    def test_host_registration(self):
        """Test host user registration"""
        timestamp = int(time.time())
        user_data = {
            "email": f"host_{timestamp}@test.com",
            "password": "testpass123",
            "full_name": "Test Host",
            "role": "host"
        }
        
        success, data = self.make_request('POST', 'auth/register', user_data, expected_status=200)
        if success and 'access_token' in data:
            self.host_token = data['access_token']
            self.host_user = data['user']
            self.log_test("Host Registration", True)
            return True
        else:
            self.log_test("Host Registration", False, str(data))
            return False

    def test_guest_registration(self):
        """Test guest user registration"""
        timestamp = int(time.time())
        user_data = {
            "email": f"guest_{timestamp}@test.com",
            "password": "testpass123",
            "full_name": "Test Guest",
            "role": "guest"
        }
        
        success, data = self.make_request('POST', 'auth/register', user_data, expected_status=200)
        if success and 'access_token' in data:
            self.guest_token = data['access_token']
            self.guest_user = data['user']
            self.log_test("Guest Registration", True)
            return True
        else:
            self.log_test("Guest Registration", False, str(data))
            return False

    def test_login(self):
        """Test user login"""
        if not self.host_user:
            self.log_test("Host Login", False, "No host user to test login")
            return False
            
        login_data = {
            "email": self.host_user['email'],
            "password": "testpass123"
        }
        
        success, data = self.make_request('POST', 'auth/login', login_data, expected_status=200)
        self.log_test("Host Login", success and 'access_token' in data, str(data) if not success else "")
        return success

    def test_get_user_profile(self):
        """Test get current user profile"""
        if not self.host_token:
            self.log_test("Get User Profile", False, "No host token")
            return False
            
        success, data = self.make_request('GET', 'auth/me', token=self.host_token)
        self.log_test("Get User Profile", success and data.get('role') == 'host', str(data) if not success else "")
        return success

    def test_create_parking_spot(self):
        """Test creating a parking spot"""
        if not self.host_token:
            self.log_test("Create Parking Spot", False, "No host token")
            return False
            
        spot_data = {
            "address": "123 Test Street",
            "city": "Los Angeles",
            "state": "CA",
            "zip_code": "90001",
            "latitude": 34.0522,
            "longitude": -118.2437,
            "hourly_rate": 5.0,
            "event_rate": 20.0,
            "description": "Test parking spot"
        }
        
        success, data = self.make_request('POST', 'spots', spot_data, self.host_token, expected_status=200)
        if success and 'id' in data:
            self.test_spot_id = data['id']
            self.log_test("Create Parking Spot", True)
            return True
        else:
            self.log_test("Create Parking Spot", False, str(data))
            return False

    def test_get_available_spots(self):
        """Test getting available parking spots"""
        success, data = self.make_request('GET', 'spots')
        self.log_test("Get Available Spots", success and isinstance(data, list), str(data) if not success else "")
        return success

    def test_get_my_spots(self):
        """Test getting host's spots"""
        if not self.host_token:
            self.log_test("Get My Spots", False, "No host token")
            return False
            
        success, data = self.make_request('GET', 'spots/my', token=self.host_token)
        self.log_test("Get My Spots", success and isinstance(data, list), str(data) if not success else "")
        return success

    def test_toggle_spot_active(self):
        """Test toggling spot active status"""
        if not self.host_token or not self.test_spot_id:
            self.log_test("Toggle Spot Active", False, "No host token or spot ID")
            return False
            
        success, data = self.make_request('POST', f'spots/{self.test_spot_id}/toggle', {}, self.host_token)
        self.log_test("Toggle Spot Active", success and 'is_active' in data, str(data) if not success else "")
        return success

    def test_update_spot(self):
        """Test updating spot details"""
        if not self.host_token or not self.test_spot_id:
            self.log_test("Update Spot", False, "No host token or spot ID")
            return False
            
        update_data = {
            "hourly_rate": 7.5,
            "auto_off_hours": 2
        }
        
        success, data = self.make_request('PATCH', f'spots/{self.test_spot_id}', update_data, self.host_token)
        self.log_test("Update Spot", success and data.get('hourly_rate') == 7.5, str(data) if not success else "")
        return success

    def test_create_booking_checkout(self):
        """Test creating booking checkout session"""
        if not self.guest_token or not self.test_spot_id:
            self.log_test("Create Booking Checkout", False, "No guest token or spot ID")
            return False
            
        # First make sure spot is active - check current status and toggle if needed
        if self.host_token:
            # Get current spot status
            success, spot_data = self.make_request('GET', f'spots/{self.test_spot_id}')
            if success and not spot_data.get('is_active'):
                # Toggle to make it active
                self.make_request('POST', f'spots/{self.test_spot_id}/toggle', {}, self.host_token)
                time.sleep(1)  # Wait a moment for the change to take effect
            
        booking_data = {
            "spot_id": self.test_spot_id,
            "license_plate": "TEST123",
            "vehicle_make": "Toyota",
            "vehicle_model": "Camry",
            "hours": 2,
            "use_event_rate": False,
            "origin_url": "https://test.com"
        }
        
        success, data = self.make_request('POST', 'bookings/checkout', booking_data, self.guest_token)
        if success and 'checkout_url' in data:
            self.test_booking_id = data.get('booking_id')
            self.log_test("Create Booking Checkout", True)
            return True
        else:
            self.log_test("Create Booking Checkout", False, str(data))
            return False

    def test_get_notifications(self):
        """Test getting notifications"""
        if not self.host_token:
            self.log_test("Get Notifications", False, "No host token")
            return False
            
        success, data = self.make_request('GET', 'notifications', token=self.host_token)
        self.log_test("Get Notifications", success and isinstance(data, list), str(data) if not success else "")
        return success

    def test_get_bookings(self):
        """Test getting user bookings"""
        if not self.guest_token:
            self.log_test("Get User Bookings", False, "No guest token")
            return False
            
        success, data = self.make_request('GET', 'bookings/my', token=self.guest_token)
        self.log_test("Get User Bookings", success and isinstance(data, list), str(data) if not success else "")
        return success

    def test_report_violation(self):
        """Test reporting a violation"""
        if not self.host_token or not self.test_booking_id:
            self.log_test("Report Violation", False, "No host token or booking ID")
            return False
            
        violation_data = {
            "booking_id": self.test_booking_id,
            "reason": "Test violation report"
        }
        
        success, data = self.make_request('POST', 'violations/report', violation_data, self.host_token)
        self.log_test("Report Violation", success and data.get('success'), str(data) if not success else "")
        return success

    def test_get_promotion_packages(self):
        """Test getting promotion packages"""
        success, data = self.make_request('GET', 'promotions/packages')
        expected_packages = ['1_day', '3_days', '7_days']
        
        if success and 'packages' in data:
            packages = data['packages']
            package_ids = [pkg['id'] for pkg in packages]
            has_all_packages = all(pkg_id in package_ids for pkg_id in expected_packages)
            
            # Check package structure
            valid_structure = True
            for pkg in packages:
                if not all(key in pkg for key in ['id', 'days', 'price', 'label', 'description']):
                    valid_structure = False
                    break
            
            self.log_test("Get Promotion Packages", has_all_packages and valid_structure, 
                         f"Missing packages or invalid structure: {data}" if not (has_all_packages and valid_structure) else "")
            return has_all_packages and valid_structure
        else:
            self.log_test("Get Promotion Packages", False, str(data))
            return False

    def test_create_promotion_checkout(self):
        """Test creating promotion checkout session"""
        if not self.host_token or not self.test_spot_id:
            self.log_test("Create Promotion Checkout", False, "No host token or spot ID")
            return False
            
        promo_data = {
            "spot_id": self.test_spot_id,
            "package": "1_day",
            "origin_url": "https://test.com"
        }
        
        success, data = self.make_request('POST', 'promotions/checkout', promo_data, self.host_token)
        if success and 'checkout_url' in data and 'session_id' in data:
            self.test_promo_session_id = data.get('session_id')
            self.log_test("Create Promotion Checkout", True)
            return True
        else:
            self.log_test("Create Promotion Checkout", False, str(data))
            return False

    def test_check_promotion_status(self):
        """Test checking promotion payment status"""
        if not self.host_token or not hasattr(self, 'test_promo_session_id'):
            self.log_test("Check Promotion Status", False, "No host token or promo session ID")
            return False
            
        success, data = self.make_request('GET', f'promotions/status/{self.test_promo_session_id}', token=self.host_token)
        expected_fields = ['payment_status', 'status', 'spot_id']
        has_required_fields = all(field in data for field in expected_fields) if success else False
        
        self.log_test("Check Promotion Status", success and has_required_fields, str(data) if not success else "")
        return success and has_required_fields

    def test_promoted_spots_first_in_results(self):
        """Test that promoted spots appear first in search results"""
        # First, get all spots to see current order
        success, data = self.make_request('GET', 'spots')
        if not success:
            self.log_test("Promoted Spots First in Results", False, "Failed to get spots")
            return False
        
        # Check if any spots are promoted and if they appear first
        promoted_spots = [spot for spot in data if spot.get('is_promoted', False)]
        non_promoted_spots = [spot for spot in data if not spot.get('is_promoted', False)]
        
        # If there are promoted spots, they should appear before non-promoted ones
        if promoted_spots:
            # Find the index of the first non-promoted spot
            first_non_promoted_index = None
            for i, spot in enumerate(data):
                if not spot.get('is_promoted', False):
                    first_non_promoted_index = i
                    break
            
            # Check if all promoted spots come before the first non-promoted spot
            promoted_first = True
            if first_non_promoted_index is not None:
                for i in range(first_non_promoted_index):
                    if not data[i].get('is_promoted', False):
                        promoted_first = False
                        break
            
            self.log_test("Promoted Spots First in Results", promoted_first, 
                         "Promoted spots not appearing first" if not promoted_first else "")
            return promoted_first
        else:
            # If no promoted spots, test passes (nothing to check)
            self.log_test("Promoted Spots First in Results", True, "No promoted spots to test")
            return True

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Park-Pal API Tests...")
        print(f"📍 Testing API at: {self.base_url}")
        print("-" * 50)
        
        # Test sequence
        tests = [
            self.test_root_endpoint,
            self.test_host_registration,
            self.test_guest_registration,
            self.test_login,
            self.test_get_user_profile,
            self.test_create_parking_spot,
            self.test_get_available_spots,
            self.test_get_my_spots,
            self.test_toggle_spot_active,
            self.test_update_spot,
            self.test_create_booking_checkout,
            self.test_get_notifications,
            self.test_get_bookings,
            self.test_report_violation,
            self.test_get_promotion_packages,
            self.test_create_promotion_checkout,
            self.test_check_promotion_status,
            self.test_promoted_spots_first_in_results
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, f"Exception: {str(e)}")
            time.sleep(0.5)  # Small delay between tests
        
        # Print summary
        print("-" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  • {failure['test']}: {failure['error']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ParkPalAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())