import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase"; // Adjust path to your Firebase config
import NavBar from "../components/Navbar"; // Adjust path to your NavBar component
import Footer from "../components/footer";

type UserDoc = {
  id: string;
  email: string;
  role: string;
  linkedPlayers?: string[];
};

type PlayerDoc = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
};

const AdminUserList: React.FC = () => {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [players, setPlayers] = useState<Record<string, PlayerDoc>>({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load all users and all players on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        // Get all users
        const usersSnap = await getDocs(collection(db, "users"));
        const usersData: UserDoc[] = usersSnap.docs.map(docu => ({
          id: docu.id,
          ...(docu.data() as any),
        }));

        // Get all players
        const playersSnap = await getDocs(collection(db, "players"));
        const playersMap: Record<string, PlayerDoc> = {};
        playersSnap.docs.forEach(docu => {
          playersMap[docu.id] = { id: docu.id, ...(docu.data() as any) };
        });

        setUsers(usersData);
        setPlayers(playersMap);
      } catch (err: any) {
        setError("Failed to load users or players.");
      }
      setLoading(false);
    }
    load();
  }, []);

  // Delete handler
  async function handleDelete(user: UserDoc) {
    if (!window.confirm(`Delete user "${user.email}" and their player docs (if any)?`)) return;
    setDeletingId(user.id);
    setError(null);
    setSuccess(null);
    try {
      await deleteDoc(doc(db, "users", user.id));
      // If user is a player, or has linkedPlayers, delete those as well
      if (user.role === "player") {
        await deleteDoc(doc(db, "players", user.id));
      }
      if (user.linkedPlayers && user.linkedPlayers.length) {
        for (const pid of user.linkedPlayers) {
          await deleteDoc(doc(db, "players", pid));
        }
      }
      setUsers(users => users.filter(u => u.id !== user.id));
      setSuccess("User deleted successfully.");
    } catch (err) {
      setError("Failed to delete user.");
    }
    setDeletingId(null);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <NavBar></NavBar>
        <div className="container py-5">
      <h2 className="fw-bold mb-4 text-danger text-center" style={{ letterSpacing: ".02em" }}>
        User & Player Management
      </h2>

      {error && <div className="alert alert-danger mb-3">{error}</div>}
      {success && <div className="alert alert-success mb-3">{success}</div>}
      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-danger" role="status" />
        </div>
      ) : (
        <div className="card shadow-sm rounded-4">
          <div className="card-body p-0">
            <div style={{ overflowX: "auto" }}>
              <table className="table align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ minWidth: 120 }}>User Email</th>
                    <th style={{ minWidth: 90 }}>Role</th>
                    <th style={{ minWidth: 180 }}>Linked Players</th>
                    <th style={{ minWidth: 90 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4">
                        No users found.
                      </td>
                    </tr>
                  )}
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <span className="fw-semibold">{user.email}</span>
                      </td>
                      <td>
                        <span className="badge bg-secondary" style={{ fontSize: 13 }}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td>
                        {/* List all linked players */}
                        {user.linkedPlayers && user.linkedPlayers.length > 0 ? (
                          <ul className="mb-0 ps-3">
                            {user.linkedPlayers.map(pid => {
                              const p = players[pid];
                              return (
                                <li key={pid} style={{ fontSize: 15 }}>
                                  {p
                                    ? `${p.firstName || ""} ${p.lastName || ""} (${p.email || "no email"})`
                                    : pid}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <span className="text-muted" style={{ fontSize: 15 }}>None</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm rounded-pill px-3"
                          style={{ fontWeight: 600, letterSpacing: ".02em" }}
                          disabled={deletingId === user.id}
                          onClick={() => handleDelete(user)}
                        >
                          {deletingId === user.id ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" /> Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-muted mt-5" style={{ fontSize: 15 }}>
        <b>Note:</b> Deleting a user also deletes their player records (if any) from Firestore.<br />
        Auth accounts are not removed.
      </div>
      </div>
      <Footer></Footer>
    </div>
  );
};

export default AdminUserList;
