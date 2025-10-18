import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
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
  email?: string;   // only shown on player rows
  grade?: string;
  suburb?: string;
};

const roleOrder: Record<string, number> = {
  coach: 0,
  player: 1,
  parent: 2,
  alumni: 3,
};

const AdminUserList: React.FC = () => {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [players, setPlayers] = useState<Record<string, PlayerDoc>>({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"all" | "coach" | "player" | "parent" | "alumni">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const usersData = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as UserDoc[];

        const playersSnap = await getDocs(collection(db, "players"));
        const playersMap: Record<string, PlayerDoc> = {};
        playersSnap.docs.forEach((d) => {
          playersMap[d.id] = { id: d.id, ...(d.data() as any) };
        });

        setUsers(usersData);
        setPlayers(playersMap);
      } catch (e) {
        console.error(e);
        setError("Failed to load users or players.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleDelete(user: UserDoc) {
    if (!window.confirm(`Delete user "${user.email}" and their player docs (if any)?`)) return;
    setDeletingId(user.id);
    setError(null);
    setSuccess(null);
    try {
      await deleteDoc(doc(db, "users", user.id));
      if (user.role === "player") {
        await deleteDoc(doc(db, "players", user.id));
      }
      if (Array.isArray(user.linkedPlayers) && user.linkedPlayers.length) {
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
  // Build a lowercase "name haystack" for searching
const searchableName = (u: UserDoc) => {
  const baseName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim().toLowerCase();

  // player’s own name (from players collection) if this user is a player
  const selfPlayer = u.role === "player" ? players[u.id] : undefined;
  const selfPlayerName = selfPlayer
    ? `${selfPlayer.firstName ?? ""} ${selfPlayer.lastName ?? ""}`.trim().toLowerCase()
    : "";

  // linked player names (for coaches/parents)
  const linkedNames = (u.linkedPlayers ?? [])
    .map(pid => players[pid])
    .filter(Boolean)
    .map(p => `${p!.firstName ?? ""} ${p!.lastName ?? ""}`.trim().toLowerCase())
    .join(" ");

  // if no explicit names, fall back to email local part as a last resort
  const emailLocal = (u.email || "").split("@")[0]?.replace(/[.\-_]/g, " ").toLowerCase() || "";

  return [baseName, selfPlayerName, linkedNames || "", baseName || selfPlayerName ? "" : emailLocal]
    .filter(Boolean)
    .join(" ");
};
const filteredUsers = useMemo(() => {
  const q = search.trim().toLowerCase();
  return users
    .filter(u => (q ? searchableName(u).includes(q) : true)) // 🔍 search by name
    .sort((a, b) => {
      const ro = (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99);
      if (ro !== 0) return ro;
      // within same role, sort by display name
      const an = searchableName(a);
      const bn = searchableName(b);
      if (an && bn) return an.localeCompare(bn);
      return (a.email || "").localeCompare(b.email || "");
    });
}, [users, search, players]);

  const grouped = useMemo(() => {
    const buckets: Record<Exclude<typeof activeTab, "all"> | "other", UserDoc[]> = {
      coach: [],
      player: [],
      parent: [],
      alumni: [],
      other: [],
    };
    for (const u of filteredUsers) {
      if (u.role === "coach") buckets.coach.push(u);
      else if (u.role === "player") buckets.player.push(u);
      else if (u.role === "parent") buckets.parent.push(u);
      else if (u.role === "alumni") buckets.alumni.push(u);
      else buckets.other.push(u);
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

  const sections: Array<{ key: "all" | "coach" | "player" | "parent" | "alumni"; label: string; data: UserDoc[] }> = [
    { key: "all", label: `All (${counts.all})`, data: filteredUsers },
    { key: "coach", label: `Coaches (${counts.coach})`, data: grouped.coach },
    { key: "player", label: `Players (${counts.player})`, data: grouped.player },
    { key: "parent", label: `Parents (${counts.parent})`, data: grouped.parent },
    { key: "alumni", label: `Alumni (${counts.alumni})`, data: grouped.alumni },
  ];

  const badgeByRole: Record<string, string> = {
    coach: "bg-primary",
    player: "bg-success",
    parent: "bg-warning text-dark",
    alumni: "bg-secondary",
  };

  const prettyPlayerName = (p?: PlayerDoc) =>
    p ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Unnamed" : "Unknown player";

  const prettyUserName = (u: UserDoc) => {
    const fromFields = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
    if (fromFields) return fromFields;
    const local = (u.email || "").split("@")[0] || "";
    return local
      .split(/[.\-_]/)
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ") || "Unnamed";
  };

  const avatar = (seed: string) => {
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
  };

  const renderCard = (u: UserDoc) => {
    const roleBadge = badgeByRole[u.role] || "bg-dark";
    const linked = Array.isArray(u.linkedPlayers) ? u.linkedPlayers : [];
    const isDeleting = deletingId === u.id;

    const pSelf = u.role === "player" ? players[u.id] : undefined; // the player's own doc

    const linkedNames =
      linked.length ? linked.map((pid) => prettyPlayerName(players[pid])).join(", ") : "None";

    return (
      <div key={u.id} className="card shadow-sm mb-3" style={{ borderRadius: 16, border: "1px solid #f0d0d4" }}>
        <div className="card-body d-flex align-items-start">
          {avatar(u.email)}
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className={`badge ${roleBadge}`} style={{ fontSize: 12 }}>
                {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
              </span>
              <span className="fw-semibold" style={{ color: "#2e3a59" }}>
                {prettyUserName(u)}
              </span>
              {u.role === "player" && (
                <span className="text-muted" style={{ fontSize: 13 }}>
                  • {pSelf?.email || "(no email)"}
                </span>
              )}
            </div>

            {u.role === "coach" && (
              <div className="mt-2 text-muted" style={{ fontSize: 14 }}>
                <b>Linked players:</b> {linkedNames}
              </div>
            )}

            {u.role === "player" && (
              <div className="mt-2" style={{ fontSize: 14 }}>
                <div className="text-muted">
                  <b>Student:</b> <span className="text-dark">{prettyPlayerName(pSelf)}</span>
                </div>
                {pSelf?.grade && (
                  <div className="text-muted">
                    <b>Grade:</b> <span className="text-dark">{pSelf.grade}</span>
                  </div>
                )}
                {pSelf?.suburb && (
                  <div className="text-muted">
                    <b>Suburb:</b> <span className="text-dark">{pSelf.suburb}</span>
                  </div>
                )}
              </div>
            )}

            {u.role === "parent" && (
              <div className="mt-2 text-muted" style={{ fontSize: 14 }}>
                <b>Linked players:</b> {linkedNames}
              </div>
            )}

            {u.role === "alumni" && (
              <div className="mt-2 text-muted" style={{ fontSize: 14 }}>
                Alumni
              </div>
            )}
          </div>

          <div className="ms-3">
            <button
              className="btn btn-danger btn-sm rounded-pill px-3"
              style={{ fontWeight: 600, letterSpacing: ".02em" }}
              disabled={isDeleting}
              onClick={() => handleDelete(u)}
            >
              {isDeleting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const currentList = activeTab === "all"
    ? filteredUsers
    : sections.find((s) => s.key === activeTab)?.data || [];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar />
      <div className="container py-5 flex-grow-1">
        <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1 text-danger" style={{ letterSpacing: ".02em" }}>
              User & Player Management
            </h2>
            <div className="text-muted" style={{ fontSize: 14 }}>
              {filteredUsers.length} total • {grouped.coach.length} coaches • {grouped.player.length} players •{" "}
              {grouped.parent.length} parents • {grouped.alumni.length} alumni
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
          {sections.map((s) => (
            <li className="nav-item" key={s.key}>
              <button
                className={`nav-link ${activeTab === s.key ? "active" : ""}`}
                onClick={() => setActiveTab(s.key)}
                style={{ borderRadius: 999 }}
              >
                {s.label}
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
          <div>{currentList.map((u) => renderCard(u))}</div>
        )}

        <div className="text-center text-muted mt-5" style={{ fontSize: 13 }}>
          <b>Note:</b> Deleting a user also deletes their player records (if any) from Firestore.
          Auth accounts are not removed.
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminUserList;
