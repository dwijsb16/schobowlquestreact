# Manual Testing Use Cases for Make Teams Page

## UI Components

- [ ] Navbar is visible and displays correct navigation links
- [ ] TeamManagement component is visible and displays team management options
- [ ] Footer is visible and displays expected information

## Team Management Functionality

- [ ] All available players are listed for team assignment
- [ ] User can create a new team and assign players
- [ ] User can edit existing teams (rename, add/remove players)
- [ ] User can delete a team and receives confirmation prompt
- [ ] Team list updates after add/edit/delete actions
- [ ] Error messages are displayed for failed actions (e.g., save fails)
- [ ] Changes are saved and reflected in the team list

## Navigation

- [ ] Clicking navigation links in Navbar routes to correct pages
- [ ] Any links/buttons in the team management section work as expected

## Responsiveness & Layout

- [ ] Page layout is responsive on desktop, tablet, and mobile
- [ ] Team list and controls are properly aligned and spaced

## Edge Cases

- [ ] Page renders without errors if there are no teams or players
- [ ] Page renders without errors if team data is missing or malformed
- [ ] Actions handle unexpected input gracefully (e.g., special characters, long text)
- [ ] Deleting a team that is in use shows appropriate warning or error

## Accessibility

- [ ] All interactive elements are accessible via keyboard
- [ ] Page structure is accessible for screen readers

## Performance

- [ ] Make Teams page loads quickly without noticeable delays
- [ ] No unnecessary re-renders or console errors
