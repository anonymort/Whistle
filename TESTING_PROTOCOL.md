# NHS WhistleLite Testing Protocol

## Overview
This document outlines the complete testing protocol for the NHS WhistleLite anonymous reporting portal. Follow this checklist in order to verify all functionality works correctly.

## Prerequisites
- Server running on port 5000
- Database connection established
- Admin encryption keys loaded
- All dependencies installed

## 1. Basic Application Startup
### Test Steps:
1. Start the application with `npm run dev`
2. Navigate to `http://localhost:5000`
3. Verify the main page loads without errors

### Expected Results:
- ✅ Application starts without errors
- ✅ Main page displays "Whistle" header
- ✅ Security banner is visible
- ✅ Submission form is displayed

---

## 2. Accessibility Features Testing
### Test Steps:
1. Click the "Accessibility" settings icon in the header
2. Test Voice Assistance:
   - Toggle voice assistance ON
   - Listen for initial announcement
   - Click "Read Page Content" button
   - Focus on form fields to test voice reading
3. Test High Contrast Mode:
   - Toggle high contrast mode ON
   - Verify visual changes (dark theme, high contrast colors)
   - Toggle high contrast mode OFF
   - Verify return to normal theme

### Expected Results:
- ✅ Settings popover opens correctly
- ✅ Voice assistance reads page content aloud
- ✅ Form field labels are spoken when focused
- ✅ High contrast mode changes page colors to dark theme
- ✅ High contrast toggle works both ways

---

## 3. Submission Form Testing
### Test Steps:
1. **Hospital Selection:**
   - Click on hospital selector
   - Search for "Royal" to test filtering
   - Select a hospital from the list

2. **Category Selection:**
   - Open category dropdown
   - Select "Patient Safety"

3. **Report Type Selection:**
   - Open report type dropdown
   - Select "Clinical Care"

4. **Evidence Type Selection:**
   - Open evidence type dropdown
   - Select "Direct Observation"

5. **Event Date/Time:**
   - Enter a valid date in the past
   - Enter a time (optional)

6. **Message Field:**
   - Enter a detailed incident description (minimum 10 characters)
   - Verify character counter updates

7. **Optional Email:**
   - Enter a valid email address for updates

8. **File Upload (Optional):**
   - Click "Choose File" or drag & drop
   - Upload a small test file (PDF, image, or document)
   - Verify file processing and encryption

9. **Consent Checkboxes:**
   - Check both required consent boxes

10. **Submit:**
    - Click "Submit Report" button
    - Verify loading state
    - Wait for success confirmation

### Expected Results:
- ✅ All form fields accept input correctly
- ✅ Hospital search/filter works
- ✅ Dropdowns populate with options
- ✅ Date validation works
- ✅ Character counter functions
- ✅ File upload processes successfully
- ✅ Form validation prevents submission with missing required fields
- ✅ Successful submission shows confirmation modal
- ✅ Form resets after successful submission

---

## 4. Admin Authentication Testing
### Test Steps:
1. Navigate to `/admin`
2. Enter admin credentials:
   - Username: `admin`
   - Password: `admin123` (default)
3. Click "Sign In"
4. Verify successful login and dashboard access

### Expected Results:
- ✅ Admin login page loads
- ✅ Correct credentials allow access
- ✅ Invalid credentials show error message
- ✅ Successful login redirects to admin dashboard

---

## 5. Admin Dashboard Functionality
### Test Steps:
1. **Dashboard Overview:**
   - Verify stats cards display correct counts
   - Check submission statistics

2. **Submission Management:**
   - View list of submissions
   - Test filtering by status, priority, trust
   - Test sorting options
   - Use pagination if multiple submissions exist

3. **Decrypt Submission:**
   - Click "View" button on a submission
   - Verify message decryption works
   - Check file download if attachment exists

4. **Case Notes:**
   - Click "Notes" button on a submission
   - Add a new case note
   - Mark note as internal/external
   - Save note and verify it appears

5. **Investigator Management:**
   - Switch to "Investigators" tab
   - Add a new investigator
   - Edit existing investigator details
   - Assign investigator to a submission

6. **Submission Assignment:**
   - Assign submission to investigator
   - Change submission status
   - Update priority level

7. **Analytics Dashboard:**
   - Switch to "Analytics" tab
   - Verify charts and graphs display
   - Check submission trends over time

8. **Key Rotation:**
   - Click "Rotate Keys" button
   - Confirm key rotation
   - Verify new keys are generated

### Expected Results:
- ✅ All dashboard sections load correctly
- ✅ Filtering and sorting work properly
- ✅ Decryption reveals original submission content
- ✅ Case notes can be added and displayed
- ✅ Investigators can be managed
- ✅ Assignments and status updates work
- ✅ Analytics display submission data
- ✅ Key rotation generates new encryption keys

---

## 6. Security Features Testing
### Test Steps:
1. **Rate Limiting:**
   - Submit multiple forms rapidly (should be limited after 5 submissions)
   - Perform multiple admin actions rapidly

2. **Session Management:**
   - Leave admin session idle for 30+ minutes
   - Verify automatic logout

3. **CSRF Protection:**
   - Verify CSRF tokens are present in forms
   - Test form submission with invalid CSRF token

4. **Encryption Verification:**
   - Submit a test message
   - Check database directly (message should be encrypted)
   - Decrypt in admin panel to verify content matches

### Expected Results:
- ✅ Rate limiting prevents abuse
- ✅ Sessions timeout appropriately
- ✅ CSRF protection blocks invalid requests
- ✅ Data is properly encrypted in database

---

## 7. Mobile Responsive Testing
### Test Steps:
1. Resize browser to mobile width (320px - 768px)
2. Test all functionality on mobile:
   - Navigation and headers
   - Accessibility settings
   - Form submission
   - Admin dashboard (if applicable)

### Expected Results:
- ✅ Layout adapts to mobile screens
- ✅ All buttons are touch-friendly
- ✅ Forms remain usable on mobile
- ✅ Text remains readable at small sizes

---

## 8. Data Integrity Testing
### Test Steps:
1. **Submission Data:**
   - Submit form with special characters
   - Submit form with very long text
   - Verify data integrity in admin panel

2. **File Handling:**
   - Upload files of different types
   - Test file size limits
   - Verify encrypted file storage

3. **Database Operations:**
   - Create, read, update operations work
   - Data validation prevents corruption
   - Foreign key relationships maintained

### Expected Results:
- ✅ Special characters handled correctly
- ✅ Long text doesn't break system
- ✅ File uploads work with various formats
- ✅ Database operations maintain integrity

---

## 9. Error Handling Testing
### Test Steps:
1. **Network Errors:**
   - Disconnect internet during form submission
   - Test error messages and retry functionality

2. **Invalid Input:**
   - Submit forms with invalid data
   - Test validation error messages

3. **Server Errors:**
   - Test behavior with server temporarily down
   - Verify graceful error handling

### Expected Results:
- ✅ Network errors show appropriate messages
- ✅ Validation errors are clear and helpful
- ✅ Server errors don't crash the application

---

## 10. Performance Testing
### Test Steps:
1. **Load Testing:**
   - Submit multiple forms simultaneously
   - Test with large file uploads
   - Monitor memory usage and response times

2. **Database Performance:**
   - Test with multiple submissions in database
   - Verify query performance remains acceptable

### Expected Results:
- ✅ Application remains responsive under load
- ✅ File uploads complete within reasonable time
- ✅ Database queries execute efficiently

---

## 11. Audit Logging Testing
### Test Steps:
1. Perform various actions:
   - Submit reports
   - Admin login/logout
   - View submissions
   - Modify data
2. Check audit logs in admin panel
3. Verify all actions are logged with proper details

### Expected Results:
- ✅ All significant actions are logged
- ✅ Logs contain appropriate detail level
- ✅ Log timestamps are accurate

---

## 12. Cleanup and Final Verification
### Test Steps:
1. **Data Cleanup:**
   - Delete test submissions
   - Remove test investigators
   - Clear test audit logs

2. **Final State Check:**
   - Verify application returns to clean state
   - Test one final submission to ensure everything still works

### Expected Results:
- ✅ Test data can be cleaned up
- ✅ Application functions normally after cleanup

---

## Testing Checklist Summary

### Core Functionality
- [x] Application startup
- [x] Main page load
- [x] Form submission
- [x] Admin authentication
- [x] Admin dashboard

### Accessibility
- [x] Voice assistance
- [x] High contrast mode
- [x] Mobile responsiveness
- [ ] Keyboard navigation

### Security
- [x] Data encryption
- [x] Rate limiting
- [x] Session management
- [x] CSRF protection

### Data Management
- [x] Submission handling
- [x] File uploads
- [x] Case notes
- [x] Investigator management

### Hybrid Model Implementation
- [x] Anonymous by default submission
- [x] Optional contact method selection
- [x] Client-side encryption for sensitive fields
- [x] 6-month data retention policy
- [x] Aggregated reporting for CQC/HSSIB
- [x] GDPR compliance documentation

### Performance
- [x] Load handling
- [x] Response times
- [ ] Memory usage
- [ ] Database performance

### Error Handling
- [x] Network errors
- [x] Validation errors
- [x] Server errors
- [x] Graceful degradation

---

## Notes for Testers
- Always test in a clean browser session
- Clear localStorage between major test sections
- Document any unexpected behavior
- Test with different browser types if possible
- Pay attention to console errors during testing

## Bug Reporting Format
When reporting issues, include:
1. Test step number where issue occurred
2. Expected vs actual behavior
3. Browser type and version
4. Any console error messages
5. Steps to reproduce the issue