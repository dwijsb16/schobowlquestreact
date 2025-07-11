# Manual Testing Use Cases for Sign Up / Profile Completion Page

## Account Creation

- [x] Page loads and displays "Create an Account" if user is not signed in
- [ ] Page loads and displays "Complete Your Profile" if user is signed in
- [x] User can enter a valid email and password to create an account
- [x] Error message appears if email is already in use
- [x] Error message appears for invalid email format
- [x] Error message appears for weak password
- [x] Pop up Modal appears when user has succesfully created profile
- [x] User is redirected to home page upon acknowledgement of the modal
- [x] Homepage has Signout button as a logout option
- [ ] User should be logged out automatically after a period of inactivity
    - ![#1589F0](https://placehold.co/15x15/1589F0/1589F0.png) Needs to be added
- [ ] Password verification should be added
    - ![#1589F0](https://placehold.co/15x15/1589F0/1589F0.png) Needs to be added

### Observations
- ~~email textbox should dynamically authenticate for email addr pattern. Not only on `submit` action~~
- ~~when tried to set `password` to `1111` got this error~~
- ~~Rules for strong password should be specified~~
- ~~Got a login page trying to navigate to calendar with non google email even when user was supposed to have been logged in~~
- ~~After logging in with a non google email and navigating to Calendar page, saw this:~~ 

## Profile Information

- [x] User can enter first name and last name (required)
- [ ] User can select a role (Player, Parent)
    - ![#1589F0](https://placehold.co/15x15/1589F0/1589F0.png) Needs to be updated
- [x] If role is "Player", grade dropdown is visible and required
- [x] If role is "Coach" or "Parent", grade dropdown is hidden
- [x] Error message appears if required fields are missing
- [ ] User should be able to edit their profile information
    - ![#1589F0](https://placehold.co/15x15/1589F0/1589F0.png) Needs to be added


## Existing User Handling

- [ ] If already signed in, email field is pre-filled and disabled
- [ ] User can complete profile for existing account
- [ ] Error message appears if a profile already exists for the account

## Submission

- [x] Clicking "Sign Up" or "Save Profile" submits the form
- [x] Success message or alert appears after successful signup/profile completion
- [x] User is redirected to home page after successful signup/profile completion

## Edge Cases

- [ ] Page renders without errors if Firestore or Auth is temporarily unavailable
- [ ] Form handles unexpected input gracefully (e.g., special characters, long text)
- [ ] Submitting duplicate profile data is handled appropriately

## Accessibility

- [ ] All form fields are accessible via keyboard
- [ ] Labels are associated with form fields for screen readers
- [ ] Page structure is accessible for screen readers

## Responsiveness & Layout

- [ ] Page layout is responsive on desktop, tablet, and mobile
- [ ] All components are properly aligned and spaced

## Performance

- [ ] Sign Up page loads quickly without noticeable delays
- [ ] No unnecessary re-renders or console errors
