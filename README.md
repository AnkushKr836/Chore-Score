# Earn & Learn

Earn & Learn is a gamified household economy platform designed to teach children financial literacy by connecting chores to rewards.

Parents act as the “Central Bank and Employer” while children act as “Earners and Savers”.

This project is currently a frontend-only prototype built using HTML, CSS, and JavaScript.

---

## Features

### Parent Dashboard
- Add new chores with custom point values
- View tasks awaiting approval
- Approve completed chores
- Set exchange rate (₹ per point)
- Trigger payday to convert points into money
- Automatic reset of points after payday

### Child Dashboard
- View available chores
- Mark chores as complete
- Track total earned points
- View savings balance
- Earn money through completed and approved tasks

---

## How It Works

1. The parent creates a chore with assigned points.
2. The child completes the chore.
3. The parent approves the completed task.
4. Points are added to the child’s account.
5. During Payday:
   - Points are converted using the defined exchange rate.
   - The savings balance is updated.
   - Points reset to zero.

All data is stored using the browser’s LocalStorage API, ensuring persistence without a backend.

---

## Tech Stack

- HTML5
- CSS3 (Modern Dashboard Layout with Gradient Sidebar)
- Vanilla JavaScript
- LocalStorage API

No backend integration yet. This is a frontend prototype.


---

## UI Design

The interface is inspired by modern finance dashboards and includes:

- Gradient sidebar navigation
- Rounded card layouts
- Soft shadow effects
- Pill-style action buttons
- Clean and minimal design system

---

## How to Run

1. Clone or download the repository.
2. Open `parent.html` in a browser.
3. Use the navigation button to switch between Parent and Child views.

No installation or dependencies required.

---

## Future Improvements

- Authentication system with role-based login
- Backend integration (Firebase or Node.js)
- Compound interest implementation
- Automated monthly payday logic
- Analytics and progress tracking
- Fully responsive mobile design
- Multi-child family support

---

## Learning Outcomes

This project demonstrates:

- Role-based UI separation
- State management using LocalStorage
- Dashboard-style layout design
- DOM manipulation with JavaScript
- Basic economic simulation logic

---

## Project Status

Frontend prototype completed.  
Backend integration and advanced financial features planned.
