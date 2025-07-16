# Manual Testing Use Cases for Home Page

## Authentication

- [x] Home page loads for both logged-in and logged-out users
- [ ] Console logs "User is signed in with UID: ..." when user is logged in
- [ ] Console logs "User is logged out" when user is logged out

## UI Components

- [x] Navbar is visible and displays correct navigation links
- [x] Carousel is visible and cycles through images/content correctly
- [x] Cards section is visible and displays expected content
- [x] Accordion is visible and expands/collapses sections correctly
- [x] Footer is visible and displays expected information

## Navigation

- [x] Clicking navigation links in Navbar routes to correct pages
- [x] Links/buttons in Cards, Carousel, or Accordion (if any) work as expected

## Responsiveness & Layout

- [ ] Home page layout is responsive on desktop, tablet, and mobile
- [ ] All components are properly aligned and spaced

## Edge Cases

- [ ] Page renders without errors if user is not authenticated
- [ ] Page renders without errors if user is authenticated
- [ ] Components handle missing or unexpected data gracefully

## Accessibility

- [x] All interactive elements are accessible via keyboard
- [x] Images and icons have appropriate alt text
- [ ] Page structure is accessible for screen readers

## Performance

- [ ] Home page loads quickly without noticeable delays
- [ ] No unnecessary re-renders or console errors
