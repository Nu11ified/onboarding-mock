# Ticket Projects — File Explorer Panel Design

## Overview

Add a project-based ticket categorization system to the dashboard. Projects group tickets into logical categories (Alerts, General, custom). A dedicated file-explorer-style sidebar panel lets users browse, organize, and manage ticket projects.

## Data Model

```typescript
interface Project {
  id: string;           // "proj-alerts", "proj-general", "proj-xxx"
  name: string;         // "Alerts", "General", "Maintenance"
  color: string;        // Tailwind color for project icon/badge
  isDefault: boolean;   // Can't be deleted (Alerts, General)
  autoFilter?: {        // Auto-sort rule for new tickets
    alertCategory?: ("Error" | "Warning")[];
  };
  ticketIds: string[];  // Ordered list of ticket workorder IDs
}
```

- Each ticket belongs to exactly one project (via ticketIds in Project)
- Unassigned tickets go to "General"
- Alert tickets (alertCategory Error/Warning) auto-sort into "Alerts"

**Default projects:**
1. **Alerts** — red color, auto-filters alertCategory: ["Error", "Warning"]
2. **General** — blue color, catches everything else

## UI: Projects Panel

~240px fixed-width panel between nav sidebar and main content. Appears when "Projects" nav item is selected.

**Structure:**
- Header: "PROJECTS" label + [+] new project button
- "All Tickets" row (shows total count, no project filter)
- Collapsible project folders with colored dot, name, ticket count
- Each folder expands to show up to 5 ticket rows (workorder + truncated summary)
- Overflow: "+ N more" link
- Clicking a project highlights it and filters the main area
- Clicking a ticket opens TicketModal

**Context menu on tickets:**
- Move to project (submenu listing all projects)
- Open ticket
- Delete ticket

**Context menu on projects:**
- Rename
- Change color
- Delete project (moves tickets to "General")

## Navigation

- New "Projects" sidebar nav item with FolderKanban icon
- Positioned between "Assets" and "Tickets"
- "Tickets" remains as the flat/unfiltered ticket view

## Main Content Integration

- Reuses existing TicketWorkspace (table/kanban views)
- Filtered by selected project's ticketIds
- Existing filters (status, severity, machine) layer on top
- New tickets created while a project is selected get added to that project
- "All Tickets" shows everything unfiltered

## State Management

- New state: `projects: Project[]`, `selectedProjectId: string | null`
- Stored in DashboardPageContent alongside existing ticket state
- Persisted via existing `/api/state` endpoint
- On initial load, auto-assign existing tickets based on alertCategory

## Mobile

- Projects panel becomes collapsible overlay (like mobile sidebar)
- Toggle button in top bar to show/hide

## New Project Creation

- [+] button opens inline form in the panel
- Fields: project name (text input), color picker (preset palette)
- No auto-filter rules for user-created projects (manual assignment only)
