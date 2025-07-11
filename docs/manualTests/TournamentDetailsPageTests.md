# Manual Testing Use Cases for Tournament Detail Page

## Tournament Information

- [ ] Tournament details (name, date, location, type, status, start/end time, RSVP, rules, shirt color, notes) are displayed correctly
- [ ] Status badge color matches tournament status (confirmed, cancelled, tentative)
- [ ] Loading indicator appears while tournament data is loading

## Player Selection

- [ ] "Select Player" dropdown lists all linked players
- [ ] If no players are linked, an info alert is shown
- [ ] Selecting a player enables registration form fields

## Registration Form Functionality

- [ ] Availability dropdown displays all options and updates form as expected
- [ ] Arrival and departure time fields appear for relevant availability selections
- [ ] Carpool options can be selected (can drive, needs ride)
- [ ] If "can drive" is selected, drive capacity field appears and accepts only numbers
- [ ] Parent attending dropdown works and updates volunteer options
- [ ] Parent volunteer checkboxes (moderate, scorekeep) are enabled only if parent is attending
- [ ] Additional information textarea accepts input

## Submission

- [ ] "Submit Registration" button is enabled only when required fields are filled
- [ ] Clicking submit shows loading indicator and disables button
- [ ] Duplicate signup is prevented and shows alert if already registered
- [ ] Successful submission shows confirmation alert
- [ ] Form resets or disables after successful submission (if applicable)
- [ ] Error messages appear for failed submission

## Navigation

- [ ] Page loads correctly for valid tournament ID
- [ ] Page shows error or fallback for invalid tournament ID
- [ ] All links/buttons on the page work as expected

## Responsiveness & Layout

- [ ] Page layout is responsive on desktop, tablet, and mobile
- [ ] All components are properly aligned and spaced

## Edge Cases

- [ ] Page renders without errors if tournament or player data is missing/malformed
- [ ] Form handles unexpected input gracefully (e.g., special characters, long text)
- [ ] Large number of linked players or carpool options does not break layout

## Accessibility

- [ ] All form fields are accessible via keyboard
- [ ] Labels are associated with form fields for screen readers
- [ ] Page structure is accessible for screen readers

## Performance

- [ ] Tournament detail page loads quickly without noticeable delays
- [ ] No unnecessary re-renders or console errors
