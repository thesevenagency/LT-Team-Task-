# LT Task Hub

Welcome to LT Task Hub — a unified system for managing tasks, goals, and KPIs across the entire Liga.Tennis club network. This application is designed to connect the daily work of every employee with the company's strategic goals, enhancing operational efficiency and enabling data-driven decisions.

## ✨ Key Features

- **Comprehensive Task Management**: Create, edit, and delete tasks with detailed attributes like owner, department, category, priority, and due dates.
- **Multiple Project Views**: Visualize your workflow in the way that suits you best:
    - **KPI Dashboard**: A high-level overview of project health and team performance.
    - **Task List**: A detailed, filterable table for granular task management.
    - **Kanban Board**: A visual, drag-and-drop board for tracking task status.
    - **Eisenhower Matrix**: Prioritize tasks based on urgency and importance.
- **Interactive UI**:
    - **Inline Editing**: Quickly update task details directly within the Task List.
    - **Drag & Drop**: Effortlessly change a task's status on the Kanban Board.
    - **Advanced Filtering**: Sift through tasks by title, owner, department, category, and priority.
- **Performance & Gamification**:
    - **Points System**: An automated scoring system rewards points for completed tasks based on priority, punctuality, and custom weights.
    - **Real-time Dashboards**: Track key performance indicators (KPIs) like completion rates, overdue tasks, and top performers.
- **Modern UI/UX**:
    - **Light & Dark Mode**: A sleek, modern interface with a theme toggle for user comfort.
    - **Responsive Design**: A clean and functional layout that works across different screen sizes.

## 🚀 Getting Started

This is a self-contained, build-less web application. To run it, simply open the `index.html` file in any modern web browser.

No installation, dependencies, or build steps are required.

## 📁 File Structure

The project is organized into a few key files:

-   `index.html`: The main HTML file that serves as the entry point for the application. It includes the necessary boilerplate, font imports, and the import map for React.
-   `index.tsx`: The core of the application, written in React and TypeScript. It contains all the components, logic, state management, and initial data.
-   `index.css`: Contains all the styling for the application. It uses CSS custom properties (variables) to implement the light and dark themes and maintain a consistent design system.
-   `metadata.json`: Provides descriptive metadata about the application.
-   `readme.md`: This file, providing documentation and an overview of the project.

##  Views Explained

### 📊 KPI Dashboard
The dashboard provides a strategic overview of the entire project. It features:
- **KPI Cards**: At-a-glance metrics for tasks done, overdue, completion percentage, and more.
- **Top Owners**: A leaderboard showing the most productive team members based on points scored.
- **Charts**: Bar charts visualizing points distribution by department and category.
- **Task Widgets**: Lists of overdue tasks and upcoming deadlines to keep everyone informed.

### 📋 Task List
A powerful table view for managing tasks in detail.
- **Inline Editing**: Click directly on a cell (e.g., Title, Owner, Priority, Status, Due Date) to edit its value without opening a modal.
- **Filtering**: Use the filter controls at the top to narrow down the task list based on multiple criteria.
- **Sub-tasks**: Child tasks are visually indented for clarity.

###  Kanban Board
A classic agile tool for visualizing workflow.
- **Status Columns**: Tasks are organized into columns representing their current status (`Not Started`, `In Progress`, `On Hold`, `Done`).
- **Drag and Drop**: Move tasks between columns to instantly update their status.
- **At-a-glance Info**: Task cards display key information like title, owner, due date, and priority.

###  Eisenhower Matrix
A productivity tool for prioritizing tasks. Tasks are automatically categorized into four quadrants based on their **Urgency** and **Priority**:
1.  **Q1 Do First**: Urgent and important.
2.  **Q2 Schedule**: Not urgent, but important.
3.  **Q3 Delegate**: Urgent, but not important.
4.  **Q4 Don’t Do**: Neither urgent nor important.
