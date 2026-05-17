import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import NavBar from "../components/Navbar";
import Footer from "../components/footer";

type Role = "coach" | "player" | "parent" | "alumni" | string;

type UserDoc = {
  id: string;
  email: string;
  role: Role;
  linkedPlayers?: string[];
  firstName?: string;
  lastName?: string;
};

type PlayerDoc = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  grade?: string;
  suburb?: string;
};

type EditForm = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  linkedPlayers: string[];
  playerFirstName: string;
  playerLastName: string;
  playerEmail: string;
  grade: string;
  suburb: string;
};

const roleOrder: Record<string, number> = {
  coach: 0,
  player: 1,
  parent: 2,
  alumni: 3,
};

const roleOptions = ["coach", "player", "parent", "alumni"];

const AdminUserList: React.FC = () => {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [players, setPlayers] = useState<Record<string, PlayerDoc>>({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "all" | "coach" | "player" | "parent" | "alumni"
  >("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const usersData = usersSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as UserDoc[];

        const playersSnap = await getDocs(collection(db, "players"));
        const playersMap: Record<string, PlayerDoc> = {};

        playersSnap.docs.forEach((d) => {
          playersMap[d.id] = {
            id: d.id,
            ...(d.data() as any),
          };
        });

        setUsers(usersData);
        setPlayers(playersMap);
      } catch (e) {
        console.error(e);
        setError("Failed to load users or players.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const playerOptions = useMemo(() => {
    return Object.values(players).sort((a, b) => {
      return prettyPlayerName(a).localeCompare(prettyPlayerName(b));
    });
  }, [players]);

  async function handleDelete(user: UserDoc) {
    const confirmDelete = window.confirm(
      `Delete user "${user.email}" and their player docs, if any?`
    );

    if (!confirmDelete) return;

    setDeletingId(user.id);
    setError(null);
    setSuccess(null);

    try {
      await deleteDoc(doc(db, "users", user.id));

      if (user.role === "player") {
        await deleteDoc(doc(db, "players", user.id));
      }

      if (Array.isArray(user.linkedPlayers) && user.linkedPlayers.length > 0) {
        for (const pid of user.linkedPlayers) {
          await deleteDoc(doc(db, "players", pid));
        }
      }

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setSuccess("User deleted successfully.");
    } catch (e) {
      console.error(e);
      setError("Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  }

  function makeEditForm(user: UserDoc): EditForm {
    const playerDoc = players[user.id];

    return {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
      role: user.role ?? "",
      linkedPlayers: user.linkedPlayers ?? [],
      playerFirstName: playerDoc?.firstName ?? user.firstName ?? "",
      playerLastName: playerDoc?.lastName ?? user.lastName ?? "",
      playerEmail: playerDoc?.email ?? user.email ?? "",
      grade: playerDoc?.grade ?? "",
      suburb: playerDoc?.suburb ?? "",
    };
  }

  function startEditing(user: UserDoc) {
    setError(null);
    setSuccess(null);
    setEditingId(user.id);
    setEditForm(makeEditForm(user));
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm(null);
  }

  function updateEditField<K extends keyof EditForm>(
    key: K,
    value: EditForm[K]
  ) {
    setEditForm((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        [key]: value,
      };
    });
  }

  function handleLinkedPlayersChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const selectedIds = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );

    updateEditField("linkedPlayers", selectedIds);
  }

  function removeLinkedPlayer(playerId: string) {
    if (!editForm) return;

    updateEditField(
      "linkedPlayers",
      editForm.linkedPlayers.filter((id) => id !== playerId)
    );
  }

  async function handleSave(user: UserDoc) {
    if (!editForm) return;

    const cleanEmail = editForm.email.trim();
    const cleanRole = editForm.role.trim() || user.role;
    const linkedPlayers = editForm.linkedPlayers;

    if (!cleanEmail) {
      setError("Email cannot be empty.");
      return;
    }

    setSavingId(user.id);
    setError(null);
    setSuccess(null);

    try {
      const updatedUser: UserDoc = {
        ...user,
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: cleanEmail,
        role: cleanRole,
        linkedPlayers,
      };

      await updateDoc(doc(db, "users", user.id), {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        linkedPlayers: updatedUser.linkedPlayers,
      });

      if (cleanRole === "player") {
        const updatedPlayer: PlayerDoc = {
          id: user.id,
          firstName: editForm.playerFirstName.trim(),
          lastName: editForm.playerLastName.trim(),
          email: editForm.playerEmail.trim() || cleanEmail,
          grade: editForm.grade.trim(),
          suburb: editForm.suburb.trim(),
        };

        await setDoc(doc(db, "players", user.id), updatedPlayer, {
          merge: true,
        });

        setPlayers((prev) => ({
          ...prev,
          [user.id]: {
            ...(prev[user.id] ?? { id: user.id }),
            ...updatedPlayer,
          },
        }));
      }

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === user.id) return updatedUser;
          return u;
        })
      );

      setEditingId(null);
      setEditForm(null);
      setSuccess("User updated successfully.");
    } catch (e) {
      console.error(e);
      setError("Failed to update user. Check Firestore permissions.");
    } finally {
      setSavingId(null);
    }
  }

  function searchableName(user: UserDoc) {
    const baseName = `${user.firstName ?? ""} ${user.lastName ?? ""}`
      .trim()
      .toLowerCase();

    const selfPlayer = user.role === "player" ? players[user.id] : undefined;

    const selfPlayerName = selfPlayer
      ? `${selfPlayer.firstName ?? ""} ${selfPlayer.lastName ?? ""}`
          .trim()
          .toLowerCase()
      : "";

    const linkedNames = (user.linkedPlayers ?? [])
      .map((pid) => players[pid])
      .filter(Boolean)
      .map((p) =>
        `${p!.firstName ?? ""} ${p!.lastName ?? ""}`.trim().toLowerCase()
      )
      .join(" ");

    const emailLocal =
      (user.email || "")
        .split("@")[0]
        ?.replace(/[.\-_]/g, " ")
        .toLowerCase() || "";

    return [
      baseName,
      selfPlayerName,
      linkedNames || "",
      baseName || selfPlayerName ? "" : emailLocal,
    ]
      .filter(Boolean)
      .join(" ");
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users
      .filter((user) => {
        if (!q) return true;
        return searchableName(user).includes(q);
      })
      .sort((a, b) => {
        const roleSort =
          (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99);

        if (roleSort !== 0) return roleSort;

        const aName = searchableName(a);
        const bName = searchableName(b);

        if (aName && bName) return aName.localeCompare(bName);

        return (a.email || "").localeCompare(b.email || "");
      });
  }, [users, search, players]);

  const grouped = useMemo(() => {
    const buckets: Record<
      "coach" | "player" | "parent" | "alumni" | "other",
      UserDoc[]
    > = {
      coach: [],
      player: [],
      parent: [],
      alumni: [],
      other: [],
    };

    for (const user of filteredUsers) {
      if (user.role === "coach") buckets.coach.push(user);
      else if (user.role === "player") buckets.player.push(user);
      else if (user.role === "parent") buckets.parent.push(user);
      else if (user.role === "alumni") buckets.alumni.push(user);
      else buckets.other.push(user);
    }

    return buckets;
  }, [filteredUsers]);

  const counts = {
    all: filteredUsers.length,
    coach: grouped.coach.length,
    player: grouped.player.length,
    parent: grouped.parent.length,
    alumni: grouped.alumni.length,
  };

  const sections: Array<{
    key: "all" | "coach" | "player" | "parent" | "alumni";
    label: string;
    data: UserDoc[];
  }> = [
    {
      key: "all",
      label: `All (${counts.all})`,
      data: filteredUsers,
    },
    {
      key: "coach",
      label: `Coaches (${counts.coach})`,
      data: grouped.coach,
    },
    {
      key: "player",
      label: `Players (${counts.player})`,
      data: grouped.player,
    },
    {
      key: "parent",
      label: `Parents (${counts.parent})`,
      data: grouped.parent,
    },
    {
      key: "alumni",
      label: `Alumni (${counts.alumni})`,
      data: grouped.alumni,
    },
  ];

  const badgeByRole: Record<string, string> = {
    coach: "bg-primary",
    player: "bg-success",
    parent: "bg-warning text-dark",
    alumni: "bg-secondary",
  };

  function prettyPlayerName(player?: PlayerDoc) {
    if (!player) return "Unknown player";

    const fullName = `${player.firstName ?? ""} ${player.lastName ?? ""}`.trim();

    return fullName || player.email || "Unnamed player";
  }

  function prettyPlayerOption(player: PlayerDoc) {
    const name = prettyPlayerName(player);
    const grade = player.grade ? `Grade ${player.grade}` : "";
    const email = player.email || "";

    return [name, grade, email].filter(Boolean).join(" • ");
  }

  function prettyUserName(user: UserDoc) {
    const fromFields = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

    if (fromFields) return fromFields;

    const local = (user.email || "").split("@")[0] || "";

    return (
      local
        .split(/[.\-_]/)
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ") || "Unnamed"
    );
  }

  function avatar(seed: string) {
    const initials =
      (seed.split("@")[0] || "")
        .split(/[.\-_]/)
        .map((s) => s.charAt(0).toUpperCase())
        .filter(Boolean)
        .slice(0, 2)
        .join("") || "U";

    return (
      <div
        className="d-inline-flex align-items-center justify-content-center me-3"
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: "#f3f3f3",
          fontWeight: 700,
          color: "#B71C1C",
        }}
      >
        {initials}
      </div>
    );
  }

  function renderReadOnlyDetails(
    user: UserDoc,
    playerDoc?: PlayerDoc,
    linkedNames?: string
  ) {
    return (
      <>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span
            className={`badge ${badgeByRole[user.role] || "bg-dark"}`}
            style={{ fontSize: 12 }}
          >
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>

          <span className="fw-semibold" style={{ color: "#2e3a59" }}>
            {prettyUserName(user)}
          </span>

          <span className="text-muted" style={{ fontSize: 13 }}>
            • {user.email || "(no email)"}
          </span>
        </div>

        {(user.role === "coach" || user.role === "parent") && (
          <div className="mt-2 text-muted" style={{ fontSize: 14 }}>
            <b>Linked players:</b> {linkedNames}
          </div>
        )}

        {user.role === "player" && (
          <div className="mt-2" style={{ fontSize: 14 }}>
            <div className="text-muted">
              <b>Student:</b>{" "}
              <span className="text-dark">{prettyPlayerName(playerDoc)}</span>
            </div>

            <div className="text-muted">
              <b>Player email:</b>{" "}
              <span className="text-dark">
                {playerDoc?.email || "(no email)"}
              </span>
            </div>

            {playerDoc?.grade && (
              <div className="text-muted">
                <b>Grade:</b>{" "}
                <span className="text-dark">{playerDoc.grade}</span>
              </div>
            )}

            {playerDoc?.suburb && (
              <div className="text-muted">
                <b>Suburb:</b>{" "}
                <span className="text-dark">{playerDoc.suburb}</span>
              </div>
            )}
          </div>
        )}

        {user.role === "alumni" && (
          <div className="mt-2 text-muted" style={{ fontSize: 14 }}>
            Alumni
          </div>
        )}
      </>
    );
  }

  function renderLinkedPlayersDropdown() {
    if (!editForm) return null;

    return (
      <div className="col-12">
        <label className="form-label small text-muted mb-1">
          Linked players
        </label>

        <select
          className="form-select form-select-sm"
          multiple
          size={Math.min(Math.max(playerOptions.length, 4), 8)}
          value={editForm.linkedPlayers}
          onChange={handleLinkedPlayersChange}
        >
          {playerOptions.map((player) => (
            <option key={player.id} value={player.id}>
              {prettyPlayerOption(player)}
            </option>
          ))}
        </select>

        <div className="form-text">
          Hold Command on Mac or Ctrl on Windows to select multiple players.
        </div>

        {editForm.linkedPlayers.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mt-2">
            {editForm.linkedPlayers.map((pid) => (
              <span
                key={pid}
                className="badge bg-light text-dark border d-inline-flex align-items-center gap-2"
                style={{ fontSize: 12 }}
              >
                {prettyPlayerName(players[pid])}
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Remove linked player"
                  style={{ fontSize: 8 }}
                  onClick={() => removeLinkedPlayer(pid)}
                />
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderEditForm(user: UserDoc) {
    if (!editForm) return null;

    const editingAsPlayer = editForm.role === "player";
    const showLinkedPlayers =
      editForm.role === "coach" || editForm.role === "parent";

    return (
      <div className="mt-1">
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label small text-muted mb-1">
              User first name
            </label>
            <input
              className="form-control form-control-sm"
              value={editForm.firstName}
              onChange={(e) => updateEditField("firstName", e.target.value)}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label small text-muted mb-1">
              User last name
            </label>
            <input
              className="form-control form-control-sm"
              value={editForm.lastName}
              onChange={(e) => updateEditField("lastName", e.target.value)}
            />
          </div>

          <div className="col-md-8">
            <label className="form-label small text-muted mb-1">
              User email
            </label>
            <input
              className="form-control form-control-sm"
              value={editForm.email}
              onChange={(e) => updateEditField("email", e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label small text-muted mb-1">Role</label>
            <select
              className="form-select form-select-sm"
              value={editForm.role}
              onChange={(e) => updateEditField("role", e.target.value)}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {showLinkedPlayers && renderLinkedPlayersDropdown()}
        </div>

        {editingAsPlayer && (
          <div
            className="mt-3 p-3 rounded"
            style={{
              background: "#fff7f8",
              border: "1px solid #f0d0d4",
            }}
          >
            <div className="fw-semibold mb-2" style={{ color: "#B71C1C" }}>
              Player info
            </div>

            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label small text-muted mb-1">
                  Player first name
                </label>
                <input
                  className="form-control form-control-sm"
                  value={editForm.playerFirstName}
                  onChange={(e) =>
                    updateEditField("playerFirstName", e.target.value)
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small text-muted mb-1">
                  Player last name
                </label>
                <input
                  className="form-control form-control-sm"
                  value={editForm.playerLastName}
                  onChange={(e) =>
                    updateEditField("playerLastName", e.target.value)
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small text-muted mb-1">
                  Player email
                </label>
                <input
                  className="form-control form-control-sm"
                  value={editForm.playerEmail}
                  onChange={(e) =>
                    updateEditField("playerEmail", e.target.value)
                  }
                />
              </div>

              <div className="col-md-3">
  <label className="form-label small text-muted mb-1">
    Grade
  </label>
  <select
    className="form-select form-select-sm"
    value={editForm.grade}
    onChange={(e) => updateEditField("grade", e.target.value)}
  >
    <option value="">Select grade</option>
    <option value="5th">5th</option>
    <option value="6th">6th</option>
    <option value="7th">7th</option>
    <option value="8th">8th</option>
  </select>
</div>

              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">
                  Suburb
                </label>
                <input
                  className="form-control form-control-sm"
                  value={editForm.suburb}
                  onChange={(e) => updateEditField("suburb", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderCard(user: UserDoc) {
    const linked = Array.isArray(user.linkedPlayers) ? user.linkedPlayers : [];
    const isDeleting = deletingId === user.id;
    const isSaving = savingId === user.id;
    const isEditing = editingId === user.id;

    const playerDoc = user.role === "player" ? players[user.id] : undefined;

    const linkedNames =
      linked.length > 0
        ? linked.map((pid) => prettyPlayerName(players[pid])).join(", ")
        : "None";

    return (
      <div
        key={user.id}
        className="card shadow-sm mb-3"
        style={{
          borderRadius: 16,
          border: "1px solid #f0d0d4",
        }}
      >
        <div className="card-body d-flex align-items-start">
          {avatar(user.email)}

          <div className="flex-grow-1">
            {isEditing
              ? renderEditForm(user)
              : renderReadOnlyDetails(user, playerDoc, linkedNames)}
          </div>

          <div className="ms-3 d-flex flex-column gap-2">
            {isEditing ? (
              <>
                <button
                  className="btn btn-success btn-sm rounded-pill px-3"
                  style={{
                    fontWeight: 600,
                    letterSpacing: ".02em",
                  }}
                  disabled={isSaving}
                  onClick={() => handleSave(user)}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>

                <button
                  className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                  disabled={isSaving}
                  onClick={cancelEditing}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-outline-primary btn-sm rounded-pill px-3"
                  style={{
                    fontWeight: 600,
                    letterSpacing: ".02em",
                  }}
                  disabled={!!editingId || isDeleting}
                  onClick={() => startEditing(user)}
                >
                  Edit
                </button>

                <button
                  className="btn btn-danger btn-sm rounded-pill px-3"
                  style={{
                    fontWeight: 600,
                    letterSpacing: ".02em",
                  }}
                  disabled={isDeleting || !!editingId}
                  onClick={() => handleDelete(user)}
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentList =
    activeTab === "all"
      ? filteredUsers
      : sections.find((section) => section.key === activeTab)?.data || [];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavBar />

      <div className="container py-5 flex-grow-1">
        <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
          <div>
            <h2
              className="fw-bold mb-1 text-danger"
              style={{ letterSpacing: ".02em" }}
            >
              User & Player Management
            </h2>

            <div className="text-muted" style={{ fontSize: 14 }}>
              {filteredUsers.length} total • {grouped.coach.length} coaches •{" "}
              {grouped.player.length} players • {grouped.parent.length} parents
              • {grouped.alumni.length} alumni
            </div>
          </div>

          <div style={{ minWidth: 260 }}>
            <input
              className="form-control"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: 12 }}
            />
          </div>
        </div>

        <ul className="nav nav-pills mb-4" role="tablist" style={{ gap: 8 }}>
          {sections.map((section) => (
            <li className="nav-item" key={section.key}>
              <button
                className={`nav-link ${
                  activeTab === section.key ? "active" : ""
                }`}
                onClick={() => setActiveTab(section.key)}
                style={{ borderRadius: 999 }}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>

        {error && <div className="alert alert-danger mb-3">{error}</div>}
        {success && <div className="alert alert-success mb-3">{success}</div>}

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-danger" role="status" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center text-muted py-5">No users found.</div>
        ) : (
          <div>{currentList.map((user) => renderCard(user))}</div>
        )}

        <div className="text-center text-muted mt-5" style={{ fontSize: 13 }}>
          <b>Note:</b> Deleting a user also deletes their player records from
          Firestore if they exist. Auth accounts are not removed.
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminUserList;