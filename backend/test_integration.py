import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def make_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    req_data = None
    if data:
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"HTTPError: {e.code} - {err_body}")
        return e.code, json.loads(err_body) if err_body else {}
    except Exception as e:
        print(f"Error: {e}")
        return 500, {"detail": str(e)}

def run_tests():
    print("--- STARTING INTEGRATION TESTS ---")
    
    # 1. Sign Up Test
    user_email = f"test_user_{int(urllib.request.time.time())}@example.com"
    signup_payload = {
        "email": user_email,
        "password": "testpassword123"
    }
    print(f"\n1. Testing User Signup with email: {user_email}")
    status, res = make_request("/api/auth/signup", method="POST", data=signup_payload)
    assert status == 201, f"Signup failed, status: {status}"
    assert res["email"] == user_email, "Signup returned incorrect email"
    print("✓ Signup succeeded!")
    
    # 2. Login Test
    print("\n2. Testing User Login")
    status, res = make_request("/api/auth/login", method="POST", data=signup_payload)
    assert status == 200, f"Login failed, status: {status}"
    token = res.get("access_token")
    assert token is not None, "Login did not return access token"
    print("✓ Login succeeded! Token retrieved.")

    # 3. Create Student Test (Protected)
    student_payload = {
        "name": "Jane Doe",
        "email": f"jane.doe_{int(urllib.request.time.time())}@example.com",
        "phone": "+1-555-123-4567",
        "course": "Mathematics",
        "grade": "A+"
    }
    print(f"\n3. Testing Student Creation (Protected)")
    status, res = make_request("/api/students", method="POST", data=student_payload, token=token)
    assert status == 201, f"Student creation failed, status: {status}"
    student_id = res["id"]
    assert res["name"] == "Jane Doe", "Created student name mismatch"
    print(f"✓ Student creation succeeded! ID: {student_id}")

    # 4. Get All Students Test (Protected)
    print("\n4. Testing Get All Students (Protected)")
    status, res = make_request("/api/students", token=token)
    assert status == 200, f"Get all students failed, status: {status}"
    assert len(res) >= 1, "Student list empty"
    # Find our created student
    my_student = next((s for s in res if s["id"] == student_id), None)
    assert my_student is not None, "Created student not found in list"
    print(f"✓ Student list retrieve succeeded! Total students: {len(res)}")

    # 5. Get Student by ID Test (Protected)
    print(f"\n5. Testing Get Student by ID: {student_id}")
    status, res = make_request(f"/api/students/{student_id}", token=token)
    assert status == 200, f"Get student by ID failed, status: {status}"
    assert res["email"] == student_payload["email"], "Student email mismatch"
    print("✓ Get student by ID succeeded!")

    # 6. Update Student Test (Protected)
    update_payload = {
        "name": "Jane Doe Smith",
        "grade": "A"
    }
    print(f"\n6. Testing Student Update on ID: {student_id}")
    status, res = make_request(f"/api/students/{student_id}", method="PUT", data=update_payload, token=token)
    assert status == 200, f"Update student failed, status: {status}"
    assert res["name"] == "Jane Doe Smith", "Name update failed"
    assert res["grade"] == "A", "Grade update failed"
    print("✓ Student update succeeded!")

    # 7. Delete Student Test (Protected)
    print(f"\n7. Testing Student Deletion on ID: {student_id}")
    status, res = make_request(f"/api/students/{student_id}", method="DELETE", token=token)
    assert status == 204, f"Delete student failed, status: {status}"
    print("✓ Student deletion succeeded!")

    # 8. Get Deleted Student (Should fail with 404)
    print(f"\n8. Verifying Deletion of ID: {student_id} (Should fail with 404)")
    status, res = make_request(f"/api/students/{student_id}", token=token)
    assert status == 404, f"Fetch deleted student returned code {status} instead of 404"
    print("✓ Verified student record was removed from database!")

    # 9. Test Unauthorized Access (Should fail with 401)
    print("\n9. Testing Security Constraints (Should return 401)")
    status, res = make_request("/api/students", method="GET")
    assert status == 401, f"Unauthorized request returned code {status} instead of 401"
    print("✓ Verified security constraints return 401 Unauthorized correctly!")

    print("\n--- ALL TESTS COMPLETED SUCCESSFULLY ---")
    sys.exit(0)

if __name__ == "__main__":
    run_tests()
