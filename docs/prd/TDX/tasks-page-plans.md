## Main Pages

- Overview
- Tasks
- Calendar
- Docs
- Execution
- Actions/Workflows/Execution Global Panel?

### Tasks Page

1. Tasks Sidebar/Panel
   1. Schedules
      1. Today
      2. Tomorrow
   2. Spaces
      1. Boards
      2. Folders
         1. Boards
      3. Plus button to create a new Board or Folder
   3. Expand/Collapse button - leaves just icons to see what’s still clickable?
2. Opened Space - Main Content:
   1. Root page w/ all Spaces and Folders
   2. - Board View
   - List View
   - Single List View - consists of ‘Tasks’ and ‘Done’
   - Create a new task - quick action as the pile at the start of the List or at the ToDo in Board view
   - [Top Right Corner] Space settings - view, sorting.
   - [Top Right Corner] Create Task button to create a new task inside the Task View.
   3. Single space for one specific space
   4. Multiple space for multiple spaces (applied in Today/Tomorrow schedule)
3. In Progress workflow on the right side from the main content?

## Final Conclusions

- **The existing Taken Do Tasks architecture can be carried over to Todex with minimal changes.**
- **Task Sidebar = navigation.** It remains the stable way to move between Schedules and Spaces.
- **Main Content = task view.** Boards and lists are views of the selected space; Today/Tomorrow aggregate tasks across spaces.
- **Root = Tasks Home / index.** Keep it simple: an entry point to boards/spaces and a place to create a new board. It should not duplicate Today/Tomorrow or add unnecessary stats.
- **Folders = optional organization.** Users can keep boards at the root; folders become useful as the number of boards grows, especially for teams.
- **Todex should be workspace-first at the architecture level**, so the same Tasks model works for both individual users and B2B/team workspaces from day one.

### Recommended Tasks Structure

```
Tasks
├── Sidebar
│   ├── Schedules
│   │   ├── Inbox
│   │   ├── Today
│   │   └── Tomorrow
│   └── Spaces
│       ├── Boards
│       └── Folders (optional)
│           └── Boards
└── Main Content
    ├── Board View
    ├── List View
    └── Single List (Tasks / Done)
```

**Bottom line:** Don’t redesign the Tasks architecture from scratch. Keep the proven Taken Do structure, simplify the semantics, and clearly separate **navigation and task views**.
