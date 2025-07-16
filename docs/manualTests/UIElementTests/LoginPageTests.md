# Manual Testing Use Cases for Login Page

## UI Components

- [x] Navbar is visible and displays correct navigation links
- [ ] Login illustration image is visible, properly sized, and has correct alt text
    - ![#1589F0](https://placehold.co/15x15/1589F0/1589F0.png)Image needs to be updated?
- [x] LoginForm component is visible and all form fields are present
- [ ] Footer is visible and displays expected information  
    ![#f03c15](https://placehold.co/15x15/f03c15/f03c15.png) Footer logo is left-algined. Needs to be in center with the copyright

## Login Functionality

- [x] User can enter email and password to log in
- [x] Form validation prevents submission with missing or invalid data
- [ ] Error message appears for incorrect email or password
    ![#f03c15](https://placehold.co/15x15/f03c15/f03c15.png) Need useful error message that is actionable
- [x] Error message appears for invalid email format
- [x] User is redirected to the correct page after successful login
- [ ] Loading indicator appears during login process (if applicable)
- [ ] "Forgot password" link works as expected (if present)
    - ![#1589F0](https://placehold.co/15x15/1589F0/1589F0.png) Link shows up but does not work
- [x] "Sign up" link works as expected (if present)
- [x] Login page password should also have an `eyeball` to check password

## Navigation

- [x] Clicking navigation links in Navbar routes to correct pages
- [x] Any links/buttons in the LoginForm or footer work as expected

## Responsiveness & Layout

- [ ] Page layout is responsive on desktop, tablet, and mobile
- [ ] Login form and illustration are properly aligned and spaced

## Edge Cases

- [ ] Page renders without errors if authentication service is unavailable
- [ ] Form handles unexpected input gracefully (e.g., special characters, long text)
- [ ] Multiple failed login attempts are handled appropriately

## Accessibility

- [x] All form fields are accessible via keyboard
- [ ] Labels are associated with form fields for screen readers
- [ ] Page structure is accessible for screen readers
- [ ] Login illustration image has descriptive alt text

## Performance

- [ ] Login page loads quickly without noticeable delays
- [ ] No unnecessary re-renders or console errors
