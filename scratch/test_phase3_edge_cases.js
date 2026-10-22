const BASE_URL = 'http://localhost:5000';

async function runEdgeCases() {
  console.log('========================================================');
  console.log('   PHASE 3: BORROWING & FINES EDGE CASES TEST SUITE     ');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  [PASS] #${total}: ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] #${total}: ${message}`);
    }
  }

  try {
    // 1. Authenticate users
    console.log('1. Authenticating all 4 roles...');
    const [adminLogin, libLogin, staffLogin, studentLogin] = await Promise.all([
      fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@librax.com', password: 'AdminPassword123!' }),
      }),
      fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'librarian@librax.com', password: 'LibrarianPassword123!' }),
      }),
      fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'staff@librax.com', password: 'StaffPassword123!' }),
      }),
      fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student@librax.com', password: 'StudentPassword123!' }),
      }),
    ]);

    const adminData = await adminLogin.json();
    const libData = await libLogin.json();
    const staffData = await staffLogin.json();
    const studentData = await studentLogin.json();

    const adminToken = adminData.token;
    const libToken = libData.token;
    const staffToken = staffData.token;
    const studentToken = studentData.token;

    assert(adminLogin.status === 200 && adminToken, 'Admin authenticated');
    assert(libLogin.status === 200 && libToken, 'Librarian authenticated');
    assert(staffLogin.status === 200 && staffToken, 'Staff authenticated');
    assert(studentLogin.status === 200 && studentToken, 'Student authenticated');

    // 2. Test Invalid ID formats
    console.log('\n2. Testing invalid record ID formats...');
    const resGetInvalid = await fetch(`${BASE_URL}/api/borrow/invalid-record-id`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resGetInvalid.status === 400, 'GET /api/borrow/invalid-id rejects with 400 Bad Request');

    const resReturnInvalid = await fetch(`${BASE_URL}/api/borrow/invalid-record-id/return`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resReturnInvalid.status === 400, 'PATCH /api/borrow/invalid-id/return rejects with 400 Bad Request');

    const resPayInvalid = await fetch(`${BASE_URL}/api/borrow/invalid-record-id/pay-fine`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'Pay' }),
    });
    assert(resPayInvalid.status === 400, 'PATCH /api/borrow/invalid-id/pay-fine rejects with 400 Bad Request');

    // 3. Test Non-existent Record IDs (valid ObjectId format, but not in DB)
    console.log('\n3. Testing non-existent record IDs...');
    const nonExistentId = '64f000000000000000000000';
    const resGet404 = await fetch(`${BASE_URL}/api/borrow/${nonExistentId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resGet404.status === 404, 'GET /api/borrow/:nonExistentId returns 404 Not Found');

    const resReturn404 = await fetch(`${BASE_URL}/api/borrow/${nonExistentId}/return`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(resReturn404.status === 404, 'PATCH /api/borrow/:nonExistentId/return returns 404 Not Found');

    const resPay404 = await fetch(`${BASE_URL}/api/borrow/${nonExistentId}/pay-fine`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'Pay' }),
    });
    assert(resPay404.status === 404, 'PATCH /api/borrow/:nonExistentId/pay-fine returns 404 Not Found');

    // 4. Test RBAC permissions on sensitive endpoints
    console.log('\n4. Testing RBAC restrictions on sensitive actions...');
    const resStudentPay = await fetch(`${BASE_URL}/api/borrow/${nonExistentId}/pay-fine`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ action: 'Pay' }),
    });
    assert(resStudentPay.status === 403, 'Student blocked from paying/waiving fines (403 Forbidden)');

    const resStaffPay = await fetch(`${BASE_URL}/api/borrow/${nonExistentId}/pay-fine`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({ action: 'Pay' }),
    });
    assert(resStaffPay.status === 403, 'Staff blocked from paying/waiving fines (403 Forbidden)');

    const resStudentSettingsUpdate = await fetch(`${BASE_URL}/api/borrow/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ finePerDay: 10 }),
    });
    assert(resStudentSettingsUpdate.status === 403, 'Student blocked from updating borrow settings (403 Forbidden)');

    const resLibSettingsUpdate = await fetch(`${BASE_URL}/api/borrow/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${libToken}` },
      body: JSON.stringify({ finePerDay: 10 }),
    });
    assert(resLibSettingsUpdate.status === 403, 'Librarian blocked from updating borrow settings (Admin only, 403 Forbidden)');

    // 5. Test Settings Update Validation (Admin only)
    console.log('\n5. Testing Settings validation by Admin...');
    const resAdminNegativeFine = await fetch(`${BASE_URL}/api/borrow/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ finePerDay: -5 }),
    });
    assert(resAdminNegativeFine.status === 400, 'Admin cannot set negative fine rate (400 Bad Request)');

    const resAdminInvalidDuration = await fetch(`${BASE_URL}/api/borrow/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ studentBorrowDurationDays: 0 }),
    });
    assert(resAdminInvalidDuration.status === 400, 'Admin cannot set 0-day duration (400 Bad Request)');

    // 6. Test Public Registration cannot elevate to Admin
    console.log('\n6. Testing Public Registration role privilege safety...');
    const testRegEmail = `rogue_${Date.now()}@test.com`;
    const resRogueRegister = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rogue Admin Attempt',
        email: testRegEmail,
        password: 'Password123!',
        role: 'Admin', // Attempting self-assign Admin
      }),
    });
    assert(
      resRogueRegister.status === 400,
      'Public registration explicitly blocks non-Student registration requests (400 Bad Request)'
    );

    const testNormalEmail = `student_${Date.now()}@test.com`;
    const resNormalRegister = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Normal Registrant',
        email: testNormalEmail,
        password: 'Password123!',
      }),
    });
    const normalData = await resNormalRegister.json();
    assert(
      resNormalRegister.status === 201 && normalData.user?.role === 'Student',
      'Public registration without role safely defaults to Student (201 Created)'
    );

    // 7. Borrowing and cross-user authorization tests
    console.log('\n7. Testing cross-user return authorization...');
    // Find an available book
    const booksRes = await fetch(`${BASE_URL}/api/books?available=true&limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const booksData = await booksRes.json();
    const testBook = booksData.data[0];
    assert(!!testBook, `Found test book: '${testBook?.title}' (avail: ${testBook?.availableCopies})`);

    // Student borrows the book
    const studentBorrowRes = await fetch(`${BASE_URL}/api/borrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ bookId: testBook._id }),
    });
    const studentBorrowData = await studentBorrowRes.json();
    const borrowRecordId = studentBorrowData.data?._id;
    assert(studentBorrowRes.status === 201, 'Student borrowed book successfully');

    // Staff user attempts to return Student's borrowed book
    const staffUnauthorizedReturn = await fetch(`${BASE_URL}/api/borrow/${borrowRecordId}/return`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(
      staffUnauthorizedReturn.status === 403,
      "Unauthorized user (Staff) cannot return another user's loan (403 Forbidden)"
    );

    // Prevent deleting a book while it has active loans
    const deleteBorrowedBookRes = await fetch(`${BASE_URL}/api/books/${testBook._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      deleteBorrowedBookRes.status === 400,
      'Cannot delete book from catalog while copies are currently borrowed (400 Bad Request)'
    );

    // Pay-fine on a record with ₹0 fine accrued
    const payZeroFineRes = await fetch(`${BASE_URL}/api/borrow/${borrowRecordId}/pay-fine`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'Pay' }),
    });
    assert(
      payZeroFineRes.status === 400,
      'Cannot record payment for record with zero fine accrued (400 Bad Request)'
    );

    // Invalid action on pay-fine
    const invalidPayActionRes = await fetch(`${BASE_URL}/api/borrow/${borrowRecordId}/pay-fine`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'Refund' }),
    });
    assert(
      invalidPayActionRes.status === 400,
      "pay-fine rejects invalid action ('Refund') with 400 Bad Request"
    );

    // Clean up: Student returns their book
    const studentCleanReturn = await fetch(`${BASE_URL}/api/borrow/${borrowRecordId}/return`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentCleanReturn.status === 200, 'Student can return their own book (200 OK)');

    console.log('\n========================================================');
    console.log(`EDGE CASES SUMMARY: ${passed} / ${total} TESTS PASSED!`);
    console.log('========================================================\n');
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runEdgeCases();
