// =============================================================================
// components/adminSections.js
// -----------------------------------------------------------------------------
// Shared config for the admin dashboard (no React here):
//   * MAX_FAILED_ATTEMPTS — mirrors the backend block threshold.
//   * SECTIONS — column config per content resource (drives display + which
//     fields are editable).
// =============================================================================

export const MAX_FAILED_ATTEMPTS = 10; // mirrors the backend block threshold

export const SECTIONS = [
  {
    resource: "todos",
    title: "Todos",
    columns: [
      { key: "id", label: "ID" },
      { key: "user_id", label: "Owner" },
      { key: "title", label: "Title", editable: true },
      { key: "completed", label: "Done" },
    ],
  },
  {
    resource: "posts",
    title: "Posts",
    columns: [
      { key: "id", label: "ID" },
      { key: "user_id", label: "Owner" },
      { key: "title", label: "Title", editable: true },
      { key: "body", label: "Body", editable: true },
    ],
  },
  {
    resource: "comments",
    title: "Comments",
    columns: [
      { key: "id", label: "ID" },
      { key: "post_id", label: "Post" },
      { key: "user_id", label: "Owner" },
      { key: "name", label: "Name", editable: true },
      { key: "body", label: "Body", editable: true },
    ],
  },
  {
    resource: "albums",
    title: "Albums",
    columns: [
      { key: "id", label: "ID" },
      { key: "user_id", label: "Owner" },
      { key: "title", label: "Title", editable: true },
    ],
  },
  {
    resource: "photos",
    title: "Photos",
    columns: [
      { key: "id", label: "ID" },
      { key: "album_id", label: "Album" },
      { key: "title", label: "Title", editable: true },
      { key: "url", label: "URL", editable: true },
    ],
  },
];
