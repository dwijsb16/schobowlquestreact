# Manual Testing Use Cases for Profile Page

## Authentication & Profile

- [x] Page loads for authenticated users
- [ ] If user has no profile, "Create Your Profile" form is shown
- [ ] User can create a profile with valid first name, last name, and role
- [ ] Error message appears if profile creation fields are incomplete
- [ ] After profile creation, user is redirected to main profile page

## Profile Editing

- [x] "Edit Profile" button toggles profile edit form
- [ ] User can update first name, last name, and role
    - First Name, Last Name Labels need to be added
- [ ] Changes are saved and reflected on the profile card
- [ ] Error message appears if profile update fails
- [x] "Cancel" button closes the edit form without saving

## Linked Players (for non-player roles)

- [ ] Linked players section is visible for coach/parent roles
- [ ] All linked players are listed with correct names and emails
- [ ] "Edit Linked Players" button toggles add/remove UI
- [ ] User can add a linked player from dropdown and list updates
- [ ] User can remove a linked player and list updates
- [ ] Linked player changes are reflected in both user and player records
- [ ] "No linked players yet" message appears if none are linked

## Tournament Signups

- [ ] "My Tournament Signups" section lists upcoming tournaments
- [ ] Each tournament displays name, date, and signup status
- [ ] Status badge color matches signup status (Attending, Not Attending, etc.)
- [ ] Clicking tournament name navigates to tournament detail page
- [ ] "No upcoming tournaments found" message appears if none exist
- [ ] Loading indicator appears while tournaments are loading

## Navigation

- [ ] Navbar is visible and routes to correct pages
- [ ] All links/buttons on the page work as expected

## Responsiveness & Layout

- [ ] Page layout is responsive on desktop, tablet, and mobile
- [ ] All components are properly aligned and spaced

## Edge Cases

- [ ] Page renders without errors if profile or tournament data is missing/malformed
- [ ] Linked players section handles empty or invalid data gracefully
- [ ] Tournament signups handle large number of tournaments gracefully

## Accessibility

- [ ] All interactive elements are accessible via keyboard
- [ ] Labels are associated with form fields for screen readers
- [ ] Page structure is accessible for screen readers

## Performance

- [ ] Profile page loads quickly without noticeable delays
- [ ] No unnecessary re-renders or console errors
