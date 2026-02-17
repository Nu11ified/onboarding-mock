# Ticket Projects Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a file-explorer-style Projects panel to the dashboard that lets users categorize tickets into projects (Alerts, General, custom), with auto-sorting, context menus, and integration with existing ticket views.

**Architecture:** New `Project` type + state in `DashboardPageContent`. A `ProjectsPanel` component renders in a dedicated sidebar when activeNav is "projects". The existing ticket kanban/table views get filtered by the selected project. All logic stays in the single dashboard page file following the existing pattern.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Radix UI DropdownMenu (already used), lucide-react icons

---

### Task 1: Add Project type and "projects" NavKey

**Files:**
- Modify: `src/app/dashboard/page.tsx:242-250` (NavKey type)
- Modify: `src/app/dashboard/page.tsx:113-118` (SIDENAV_ITEMS)
- Modify: `src/app/dashboard/page.tsx:291-311` (after TicketRow type)

**Step 1: Add "projects" to NavKey union**

At line 242, add `"projects"` to the NavKey union:

```typescript
type NavKey =
  | "overview"
  | "view-machine"
  | "machines"
  | "security"
  | "apm"
  | "tickets"
  | "projects"
  | "apps"
  | "settings";
```

**Step 2: Add Project type after TicketRow (around line 312)**

```typescript
type Project = {
  id: string;
  name: string;
  color: string; // Tailwind color name: "red", "blue", "green", "amber", "purple", "pink"
  isDefault: boolean;
  autoFilter?: {
    alertCategory?: ("Error" | "Warning")[];
  };
  ticketIds: string[];
};
```

**Step 3: Add "Projects" to SIDENAV_ITEMS between Assets and Tickets**

Import `FolderKanban` from lucide-react (add to the existing import block at line 17).

Update SIDENAV_ITEMS at line 113:

```typescript
const SIDENAV_ITEMS: Array<{ key: NavKey; label: string; icon: LucideIcon }> = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "view-machine", label: "Assets", icon: Gauge },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "tickets", label: "Tickets", icon: Ticket },
  { key: "settings", label: "Settings", icon: Settings },
];
```

**Step 4: Verify the app compiles**

Run: `cd /Users/saimanasr/Desktop/onboarding-mock && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds (the "projects" nav will show but do nothing yet)

**Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add Project type and projects NavKey to dashboard"
```

---

### Task 2: Add project state and default projects initialization

**Files:**
- Modify: `src/app/dashboard/page.tsx:480-580` (DashboardPageContent state declarations)
- Modify: `src/app/dashboard/page.tsx:943-970` (after existing useMemo blocks)

**Step 1: Add default projects constant (before DashboardPageContent function)**

Place this near line 470 (before `function DashboardPageContent()`):

```typescript
const DEFAULT_PROJECTS: Project[] = [
  {
    id: "proj-alerts",
    name: "Alerts",
    color: "red",
    isDefault: true,
    autoFilter: { alertCategory: ["Error", "Warning"] },
    ticketIds: [],
  },
  {
    id: "proj-general",
    name: "General",
    color: "blue",
    isDefault: true,
    ticketIds: [],
  },
];
```

**Step 2: Add project state variables in DashboardPageContent**

After the existing `newTicketOpen` state (around line 570), add:

```typescript
const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
```

**Step 3: Add auto-assignment effect**

After the existing pagination effects (around line 981), add an effect that auto-assigns tickets to projects on load:

```typescript
// Auto-assign tickets to projects when tickets load
useEffect(() => {
  if (tickets.length === 0) return;

  setProjects((prev) => {
    // Only auto-assign tickets that aren't already in any project
    const assignedIds = new Set(prev.flatMap((p) => p.ticketIds));
    const unassigned = tickets.filter((t) => !assignedIds.has(t.workorder));
    if (unassigned.length === 0) return prev;

    const updated = prev.map((p) => ({ ...p, ticketIds: [...p.ticketIds] }));
    for (const ticket of unassigned) {
      const alertProject = updated.find(
        (p) =>
          p.autoFilter?.alertCategory &&
          ticket.alertCategory &&
          p.autoFilter.alertCategory.includes(ticket.alertCategory),
      );
      if (alertProject) {
        alertProject.ticketIds.push(ticket.workorder);
      } else {
        const general = updated.find((p) => p.id === "proj-general");
        if (general) general.ticketIds.push(ticket.workorder);
      }
    }
    return updated;
  });
}, [tickets]);
```

**Step 4: Add project-filtered tickets memo**

After the existing `paginatedTickets` memo (around line 970), add:

```typescript
// Filter tickets by selected project
const projectFilteredTickets = useMemo(() => {
  if (!selectedProjectId) return sortedTickets; // "All Tickets"
  const project = projects.find((p) => p.id === selectedProjectId);
  if (!project) return sortedTickets;
  const idSet = new Set(project.ticketIds);
  return sortedTickets.filter((t) => idSet.has(t.workorder));
}, [sortedTickets, selectedProjectId, projects]);
```

**Step 5: Verify the app compiles**

Run: `cd /Users/saimanasr/Desktop/onboarding-mock && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add project state, defaults, and auto-assignment logic"
```

---

### Task 3: Build the ProjectsPanel component

**Files:**
- Modify: `src/app/dashboard/page.tsx` (add new component before DashboardMain, around line 3160)

**Step 1: Add the ProjectsPanel component**

Insert this component definition before the `function DashboardMain(` line (around line 3160):

```typescript
const PROJECT_COLORS: { name: string; dot: string; bg: string }[] = [
  { name: "red", dot: "bg-red-500", bg: "bg-red-50" },
  { name: "blue", dot: "bg-blue-500", bg: "bg-blue-50" },
  { name: "green", dot: "bg-green-500", bg: "bg-green-50" },
  { name: "amber", dot: "bg-amber-500", bg: "bg-amber-50" },
  { name: "purple", dot: "bg-purple-500", bg: "bg-purple-50" },
  { name: "pink", dot: "bg-pink-500", bg: "bg-pink-50" },
];

function getProjectColor(color: string) {
  return PROJECT_COLORS.find((c) => c.name === color) ?? PROJECT_COLORS[1];
}

function ProjectsPanel({
  projects,
  selectedProjectId,
  onSelectProject,
  tickets,
  onSelectTicket,
  onMoveTicket,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onChangeProjectColor,
}: {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  tickets: TicketRow[];
  onSelectTicket: (related: string) => void;
  onMoveTicket: (workorder: string, projectId: string) => void;
  onCreateProject: (name: string, color: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
  onChangeProjectColor: (id: string, color: string) => void;
}) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(projects.map((p) => p.id)),
  );
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("green");
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalTickets = tickets.length;

  const handleCreateSubmit = () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    onCreateProject(trimmed, newProjectColor);
    setNewProjectName("");
    setNewProjectColor("green");
    setCreatingProject(false);
  };

  const handleRenameSubmit = (id: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenamingProjectId(null);
      return;
    }
    onRenameProject(id, trimmed);
    setRenamingProjectId(null);
  };

  return (
    <div className="flex h-full w-60 flex-col border-r border-purple-100 bg-white/90 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Projects
        </p>
        <button
          onClick={() => setCreatingProject(true)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-purple-50 hover:text-purple-600 transition"
          title="New project"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable project list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {/* All Tickets */}
        <button
          onClick={() => onSelectProject(null)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
            selectedProjectId === null
              ? "bg-purple-50 text-purple-700 font-semibold"
              : "text-slate-700 hover:bg-slate-50",
          )}
        >
          <Ticket className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 text-left truncate">All Tickets</span>
          <span className="text-xs text-slate-400">{totalTickets}</span>
        </button>

        {/* Project folders */}
        {projects.map((project) => {
          const color = getProjectColor(project.color);
          const isExpanded = expandedProjects.has(project.id);
          const isSelected = selectedProjectId === project.id;
          const projectTickets = tickets.filter((t) =>
            project.ticketIds.includes(t.workorder),
          );
          const count = projectTickets.length;
          const displayTickets = projectTickets.slice(0, 5);
          const overflow = count - 5;

          return (
            <div key={project.id}>
              {/* Project row */}
              <DropdownMenu>
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      onSelectProject(project.id);
                    }}
                    className={cn(
                      "flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm transition min-w-0",
                      isSelected
                        ? "bg-purple-50 text-purple-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(project.id);
                      }}
                      className="flex-shrink-0"
                    >
                      <ChevronRight
                        className={cn(
                          "h-3 w-3 text-slate-400 transition-transform",
                          isExpanded && "rotate-90",
                        )}
                      />
                    </button>
                    <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", color.dot)} />
                    {renamingProjectId === project.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleRenameSubmit(project.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSubmit(project.id);
                          if (e.key === "Escape") setRenamingProjectId(null);
                        }}
                        className="flex-1 min-w-0 bg-transparent text-sm border-b border-purple-300 outline-none px-0 py-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="flex-1 text-left truncate">{project.name}</span>
                    )}
                    <span className="text-xs text-slate-400">{count}</span>
                  </button>

                  {/* Context menu trigger */}
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition opacity-0 group-hover:opacity-100"
                      style={{ opacity: isSelected ? 1 : undefined }}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      setRenamingProjectId(project.id);
                      setRenameValue(project.name);
                    }}
                  >
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-slate-400">Color</DropdownMenuLabel>
                  <div className="flex gap-1.5 px-2 py-1.5">
                    {PROJECT_COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => onChangeProjectColor(project.id, c.name)}
                        className={cn(
                          "h-5 w-5 rounded-full border-2 transition",
                          c.dot,
                          project.color === c.name
                            ? "border-slate-800 scale-110"
                            : "border-transparent hover:border-slate-300",
                        )}
                      />
                    ))}
                  </div>
                  {!project.isDefault && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => onDeleteProject(project.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete project
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Expanded ticket list */}
              {isExpanded && (
                <div className="ml-5 space-y-0.5 py-0.5">
                  {displayTickets.map((ticket) => (
                    <DropdownMenu key={ticket.workorder}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition text-left"
                          onDoubleClick={() => onSelectTicket(ticket.related)}
                        >
                          <FileText className="h-3 w-3 flex-shrink-0 text-slate-400" />
                          <span className="truncate">
                            <span className="font-medium text-slate-700">
                              {ticket.workorder}
                            </span>{" "}
                            {ticket.summary}
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem onClick={() => onSelectTicket(ticket.related)}>
                          Open ticket
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-slate-400">
                          Move to project
                        </DropdownMenuLabel>
                        {projects
                          .filter((p) => p.id !== project.id)
                          .map((p) => {
                            const c = getProjectColor(p.color);
                            return (
                              <DropdownMenuItem
                                key={p.id}
                                onClick={() =>
                                  onMoveTicket(ticket.workorder, p.id)
                                }
                              >
                                <span className={cn("h-2 w-2 rounded-full mr-2", c.dot)} />
                                {p.name}
                              </DropdownMenuItem>
                            );
                          })}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => onSelectTicket(ticket.related)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete ticket
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ))}
                  {overflow > 0 && (
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className="px-2 py-1 text-xs text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      + {overflow} more
                    </button>
                  )}
                  {count === 0 && (
                    <p className="px-2 py-1.5 text-xs text-slate-400 italic">
                      No tickets
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* New project inline form */}
        {creatingProject && (
          <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-3 space-y-2">
            <input
              autoFocus
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSubmit();
                if (e.key === "Escape") setCreatingProject(false);
              }}
              className="w-full rounded-md border border-purple-200 bg-white px-2 py-1.5 text-sm focus:border-purple-400 focus:outline-none"
            />
            <div className="flex items-center gap-1.5">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setNewProjectColor(c.name)}
                  className={cn(
                    "h-5 w-5 rounded-full border-2 transition",
                    c.dot,
                    newProjectColor === c.name
                      ? "border-slate-800 scale-110"
                      : "border-transparent hover:border-slate-300",
                  )}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateSubmit}
                className="rounded-md bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-700 transition"
              >
                Create
              </button>
              <button
                onClick={() => setCreatingProject(false)}
                className="rounded-md px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify the app compiles**

Run: `cd /Users/saimanasr/Desktop/onboarding-mock && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds (component defined but not yet used)

**Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add ProjectsPanel component with folders, context menus, and inline create"
```

---

### Task 4: Add project management handlers in DashboardPageContent

**Files:**
- Modify: `src/app/dashboard/page.tsx` (inside DashboardPageContent, after existing ticket handlers)

**Step 1: Add project CRUD handlers**

Find the existing `handleDeleteTicket` handler in DashboardPageContent (search for `const handleDeleteTicket`). After it, add:

```typescript
// ── Project management handlers ──
const handleCreateProject = useCallback((name: string, color: string) => {
  const id = `proj-${Date.now()}`;
  setProjects((prev) => [
    ...prev,
    { id, name, color, isDefault: false, ticketIds: [] },
  ]);
}, []);

const handleRenameProject = useCallback((id: string, name: string) => {
  setProjects((prev) =>
    prev.map((p) => (p.id === id ? { ...p, name } : p)),
  );
}, []);

const handleDeleteProject = useCallback((id: string) => {
  setProjects((prev) => {
    const target = prev.find((p) => p.id === id);
    if (!target || target.isDefault) return prev;
    // Move orphaned tickets to General
    const general = prev.find((p) => p.id === "proj-general");
    return prev
      .filter((p) => p.id !== id)
      .map((p) =>
        p.id === "proj-general" && general
          ? { ...p, ticketIds: [...p.ticketIds, ...target.ticketIds] }
          : p,
      );
  });
  if (selectedProjectId === id) setSelectedProjectId(null);
}, [selectedProjectId]);

const handleChangeProjectColor = useCallback((id: string, color: string) => {
  setProjects((prev) =>
    prev.map((p) => (p.id === id ? { ...p, color } : p)),
  );
}, []);

const handleMoveTicket = useCallback((workorder: string, targetProjectId: string) => {
  setProjects((prev) =>
    prev.map((p) => {
      if (p.ticketIds.includes(workorder) && p.id !== targetProjectId) {
        return { ...p, ticketIds: p.ticketIds.filter((id) => id !== workorder) };
      }
      if (p.id === targetProjectId && !p.ticketIds.includes(workorder)) {
        return { ...p, ticketIds: [...p.ticketIds, workorder] };
      }
      return p;
    }),
  );
}, []);
```

**Step 2: Verify the app compiles**

Run: `cd /Users/saimanasr/Desktop/onboarding-mock && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds (handlers defined, not yet wired)

**Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add project CRUD and ticket move handlers"
```

---

### Task 5: Wire up the "projects" view in DashboardMain

**Files:**
- Modify: `src/app/dashboard/page.tsx` (DashboardMain function signature and body)

**Step 1: Add project-related props to DashboardMain**

Find the DashboardMain function signature (line 3167). Add these new props to both the destructured params and the type annotation:

Add to destructured params (after `onUpdateFields`):
```
  projects,
  selectedProjectId,
  onSelectProject,
  onMoveTicket,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onChangeProjectColor,
```

Add to the type annotation (after `onUpdateFields: ...`):
```typescript
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onMoveTicket: (workorder: string, projectId: string) => void;
  onCreateProject: (name: string, color: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
  onChangeProjectColor: (id: string, color: string) => void;
```

**Step 2: Add the "projects" view branch**

Before the `if (activeNav === "tickets")` block (around line 3432), add:

```typescript
  if (activeNav === "projects") {
    return (
      <div className="flex h-full overflow-hidden">
        {/* Projects sidebar panel */}
        <ProjectsPanel
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={onSelectProject}
          tickets={allTickets}
          onSelectTicket={(id) => {
            onSelectTicket(id);
            onTicketModalChange(true);
          }}
          onMoveTicket={onMoveTicket}
          onCreateProject={onCreateProject}
          onRenameProject={onRenameProject}
          onDeleteProject={onDeleteProject}
          onChangeProjectColor={onChangeProjectColor}
        />

        {/* Main content: filtered tickets */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-10">
            <header className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-lg backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                {selectedProjectId
                  ? projects.find((p) => p.id === selectedProjectId)?.name ?? "Project"
                  : "All Projects"}
              </p>
              <h1 className="text-3xl font-semibold text-slate-900">
                {selectedProjectId
                  ? projects.find((p) => p.id === selectedProjectId)?.name ?? "Tickets"
                  : "All Tickets"}
              </h1>
              <p className="text-sm text-slate-500">
                {selectedProjectId
                  ? "Tickets in this project"
                  : "All tickets across all projects"}
              </p>
            </header>

            <div className="rounded-3xl border border-purple-100 bg-white/80 p-5 shadow-md">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Ticket Board
                  </p>
                  <p className="text-xs text-slate-500">
                    Drag tickets between columns to update status
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1">
                    <span className="text-slate-400">Severity</span>
                    <select
                      value={severityFilter}
                      onChange={(event) =>
                        onSeverityFilterChange(
                          event.target.value as
                            | "All"
                            | "Error"
                            | "Warning"
                            | "Resolved",
                        )
                      }
                      className="rounded-full border border-purple-100 bg-white px-2 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
                    >
                      {["All", "Error", "Warning", "Resolved"].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1">
                    <span className="text-slate-400">Machine</span>
                    <select
                      value={machineFilter}
                      onChange={(event) =>
                        onMachineFilterChange(event.target.value)
                      }
                      className="rounded-full border border-purple-100 bg-white px-2 py-1 text-xs text-slate-600 focus:border-purple-400 focus:outline-none"
                    >
                      {[
                        "All",
                        ...Array.from(
                          new Set(
                            allTickets.map((t) => t.machine).filter(Boolean),
                          ),
                        ),
                      ].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-3 py-1 text-xs text-slate-500">
                    <span>Total</span>
                    <span className="font-semibold text-slate-800">
                      {tickets.length}
                    </span>
                  </div>
                  <button
                    onClick={() => onNewTicketOpenChange(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4" /> New Ticket
                  </button>
                </div>
              </div>

              <KanbanBoard
                tickets={tickets}
                onSelectTicket={(id) => {
                  onSelectTicket(id);
                  onTicketModalChange(true);
                }}
                onStatusChange={onStatusChange}
              />
            </div>
          </div>
        </div>

        {/* Ticket Detail Modal */}
        <TicketModal
          ticket={selectedTicket}
          open={ticketModalOpen}
          onOpenChange={onTicketModalChange}
          onStatusChange={onStatusChange}
          onAssign={onAssign}
          onSeverityChange={onSeverityChange}
          onAddNote={onAddNote}
          onDelete={onDeleteTicket}
          collaborators={collaborators}
          machines={machines}
          onUpdateFields={onUpdateFields}
        />
      </div>
    );
  }
```

**Step 3: Pass project props in ALL DashboardMain call sites**

There are 4 places DashboardMain is rendered in DashboardPageContent (search for `<DashboardMain`). In each one, add these props after the existing `renderOnboardingWidget` prop:

```
                  projects={projects}
                  selectedProjectId={selectedProjectId}
                  onSelectProject={setSelectedProjectId}
                  onMoveTicket={handleMoveTicket}
                  onCreateProject={handleCreateProject}
                  onRenameProject={handleRenameProject}
                  onDeleteProject={handleDeleteProject}
                  onChangeProjectColor={handleChangeProjectColor}
```

**Important:** When `activeNav === "projects"`, pass `projectFilteredTickets` instead of `paginatedTickets` for the `tickets` prop. To do this cleanly, update the `tickets` prop in all 4 DashboardMain calls to:

```
tickets={activeNav === "projects" ? projectFilteredTickets : paginatedTickets}
```

And update the `total` prop similarly:

```
total={activeNav === "projects" ? projectFilteredTickets.length : filteredTickets.length}
```

**Step 4: Verify the app compiles and the projects view renders**

Run: `cd /Users/saimanasr/Desktop/onboarding-mock && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: wire projects view into DashboardMain with panel and filtered tickets"
```

---

### Task 6: Add right-click context menu on ticket table rows

**Files:**
- Modify: `src/app/dashboard/page.tsx` (TicketWorkspace table rows, around line 5713)

**Step 1: Add project props to TicketWorkspace**

Add to TicketWorkspace's props interface and destructured params:

```typescript
  projects?: Project[];
  onMoveTicket?: (workorder: string, projectId: string) => void;
```

**Step 2: Wrap each table row with a DropdownMenu for right-click context**

In the TicketWorkspace table body (around line 5713), wrap each `<tr>` with a right-click DropdownMenu. Replace the existing `tickets.map` block:

```typescript
{tickets.map((ticket) => (
  <DropdownMenu key={ticket.workorder}>
    <DropdownMenuTrigger asChild>
      <tr
        className={cn(
          "cursor-pointer px-4 py-3 transition",
          selectedTicket?.related === ticket.related
            ? "bg-purple-50/80"
            : "odd:bg-white even:bg-purple-50/40 hover:bg-purple-50/60",
        )}
        onClick={() => onSelectTicket(ticket.related)}
        onContextMenu={(e) => {
          if (projects && projects.length > 0) {
            e.preventDefault();
          }
        }}
      >
        {/* ...existing td cells unchanged... */}
      </tr>
    </DropdownMenuTrigger>
    {projects && onMoveTicket && (
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem onClick={() => onSelectTicket(ticket.related)}>
          Open ticket
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-slate-400">
          Move to project
        </DropdownMenuLabel>
        {projects.map((p) => {
          const c = getProjectColor(p.color);
          return (
            <DropdownMenuItem
              key={p.id}
              onClick={() => onMoveTicket(ticket.workorder, p.id)}
            >
              <span className={cn("h-2 w-2 rounded-full mr-2", c.dot)} />
              {p.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    )}
  </DropdownMenu>
))}
```

**Step 3: Pass projects props from the "projects" view DashboardMain call**

In the `activeNav === "projects"` block's TicketWorkspace usage (if you added one) or in the inline table inside DashboardMain's projects view, pass `projects` and `onMoveTicket`.

**Step 4: Verify the app compiles**

Run: `cd /Users/saimanasr/Desktop/onboarding-mock && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add right-click context menu for moving tickets between projects"
```

---

### Task 7: Visual testing and polish

**Files:**
- Modify: `src/app/dashboard/page.tsx` (minor style tweaks)

**Step 1: Start the dev server and test**

Run: `cd /Users/saimanasr/Desktop/onboarding-mock && npm run dev`

**Step 2: Manual testing checklist**

1. Click "Projects" in sidebar — verify panel appears with Alerts and General
2. Verify existing tickets are auto-sorted (alert tickets in Alerts, others in General)
3. Click on a project — verify main area filters to show only that project's tickets
4. Click "All Tickets" — verify all tickets shown
5. Expand/collapse project folders in the panel
6. Click [+] to create a new project — verify it appears
7. Right-click a ticket — verify context menu with "Move to project" options
8. Move a ticket to a different project — verify it moves
9. Right-click a project — rename it, change color, delete it
10. Verify deleted project's tickets move to General
11. Test on mobile viewport — verify panel behavior

**Step 3: Fix any visual issues found during testing**

Common fixes:
- Adjust panel width if too wide/narrow
- Fix text truncation
- Ensure context menus don't overflow viewport
- Check purple color scheme consistency

**Step 4: Commit final polish**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: polish projects panel styling and fix edge cases"
```

---

## Summary

| Task | Description | Est. |
|------|-------------|------|
| 1 | Add Project type + "projects" NavKey + sidebar item | 3 min |
| 2 | Add project state, defaults, auto-assignment, filtered memo | 5 min |
| 3 | Build ProjectsPanel component | 10 min |
| 4 | Add project CRUD handlers | 3 min |
| 5 | Wire projects view into DashboardMain | 8 min |
| 6 | Add right-click context menu on ticket rows | 5 min |
| 7 | Visual testing and polish | 5 min |
