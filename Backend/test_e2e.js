const axios = require('axios');
const assert = require('assert');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting E2E Tests ---');

  try {
    // 1. Register User 1
    console.log('1. Registering User 1...');
    const user1Email = `user1_${Date.now()}@test.com`;
    const resUser1 = await axios.post(`${API_URL}/auth/users/register`, {
      name: 'Test User 1',
      email: user1Email,
      password: 'password123'
    });
    const user1Token = resUser1.data.token;
    assert.ok(user1Token, 'User 1 registered and got token');

    // 2. Register User 2
    console.log('2. Registering User 2...');
    const user2Email = `user2_${Date.now()}@test.com`;
    const resUser2 = await axios.post(`${API_URL}/auth/users/register`, {
      name: 'Test User 2',
      email: user2Email,
      password: 'password123'
    });
    const user2Token = resUser2.data.token;
    const user2Refresh = resUser2.data.refreshToken;
    assert.ok(user2Token, 'User 2 registered and got token');
    assert.ok(user2Refresh, 'User 2 registered and got refresh token');

    // 2.5 Verify Refresh Token
    console.log('2.5 Testing Token Refresh for User 2...');
    const resRefresh = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: user2Refresh
    });
    assert.ok(resRefresh.data.token, 'Token refreshed successfully');
    assert.notStrictEqual(resRefresh.data.token, user2Token, 'New token should be different (though technically could be the same, usually new)');
    console.log('    -> Token refresh works.');

    // 3. Register Vendor
    console.log('3. Registering Vendor...');
    const vendorEmail = `vendor_${Date.now()}@test.com`;
    const resVendor = await axios.post(`${API_URL}/auth/vendors/register`, {
      name: 'Test Vendor',
      business_name: 'Vendor Inc',
      email: vendorEmail,
      phone: '1234567890',
      password: 'password123'
    });
    const vendorToken = resVendor.data.token;
    assert.ok(vendorToken, 'Vendor registered and got token');

    // 4. Vendor Creates a Station
    console.log('4. Vendor creates a station (1 slot)...');
    const resStation = await axios.post(`${API_URL}/stations`, {
      name: 'Test Station 1',
      latitude: 40.7128,
      longitude: -74.0060,
      contact: '1234567890',
      total_slots: 1
    }, {
      headers: { Authorization: `Bearer ${vendorToken}` }
    });
    const stationId = resStation.data.station.id;
    assert.ok(stationId, 'Station created');

    const bookingPayload = {
      station_id: stationId,
      booking_date: new Date().toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '11:00'
    };

    // 5. User 1 Books the slot
    console.log('5. User 1 books the slot...');
    const resBooking1 = await axios.post(`${API_URL}/bookings`, bookingPayload, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    const booking1Id = resBooking1.data.booking.id;
    assert.ok(booking1Id, 'User 1 booked successfully');

    // 6. User 2 Tries to Book (should fail)
    console.log('6. User 2 tries to book (should fail)...');
    try {
      await axios.post(`${API_URL}/bookings`, bookingPayload, {
        headers: { Authorization: `Bearer ${user2Token}` }
      });
      assert.fail('User 2 booking should have failed due to no slots');
    } catch (error) {
      assert.strictEqual(error.response.status, 409, 'Expected 409 Conflict for fully booked station');
      console.log('   -> Successfully blocked User 2 from booking.');
    }

    // 7. User 2 Joins Waiting Queue
    console.log('7. User 2 joins waiting queue...');
    const resQueue = await axios.post(`${API_URL}/queue/${stationId}/join`, bookingPayload, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    assert.strictEqual(resQueue.data.queue_length, 1, 'Queue length should be 1');

    // 8. User 1 Checks In
    console.log('8. User 1 checks in (simulating coordinates close to station)...');
    const resCheckin = await axios.post(`${API_URL}/arrivals/${booking1Id}/checkin`, {
      latitude: 40.7128, 
      longitude: -74.0060
    }, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    assert.strictEqual(resCheckin.status, 201, 'Check-in successful');

    // 9. User 1 Checks Out
    console.log('9. User 1 checks out...');
    const resCheckout = await axios.post(`${API_URL}/arrivals/${booking1Id}/checkout`, {
      latitude: 40.7128, 
      longitude: -74.0060
    }, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    assert.strictEqual(resCheckout.status, 200, 'Check-out successful');
    assert.strictEqual(resCheckout.data.message, 'Check-out recorded — booking completed');

    console.log('--- All Tests Passed Successfully! ---');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
