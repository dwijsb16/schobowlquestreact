import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import NavBar from "../components/Navbar";
import Footer from "../components/footer";

type UserDoc = {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
};

const AssignCoaches: React.FC = () => {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [assignId, setAssignId] = useState<string>("");
  const [removeId, setRemoveId] = useState<string>("");
  const [newRole, setNewRole] = useState<"parent" | "player">("parent");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const userList: UserDoc[] = usersSnap.docs.map(docu => ({
          id: docu.id,
          ...(docu.data() as any),
        }));
        setUsers(userList);
      } catch {
        setError("Failed to load users.");
      }
      setLoading(false);
    }
    loadUsers();
  }, []);

  // Assign as coach
  async function handleAssignCoach(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const userRef = doc(db, "users", assignId);
      await updateDoc(userRef, { role: "coach" });
      setSuccess("User assigned as coach!");
      setUsers(users =>
        users.map(u =>
          u.id === assignId ? { ...u, role: "coach" } : u
        )
      );
      setAssignId("");
    } catch {
      setError("Failed to assign coach role.");
    }
    setSubmitting(false);
  }

  // Remove coach role
  async function handleRemoveCoach(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const userRef = doc(db, "users", removeId);
      await updateDoc(userRef, { role: newRole });
      setSuccess(`Coach role removed! User is now a ${newRole}.`);
      setUsers(users =>
        users.map(u =>
          u.id === removeId ? { ...u, role: newRole } : u
        )
      );
      setRemoveId("");
    } catch {
      setError("Failed to update user role.");
    }
    setSubmitting(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#fff"
      }}
    >
      <NavBar />
      <main style={{ flex: 1, width: "100%" }}>
        <div
          className="container py-5"
          style={{ maxWidth: 700, color: "#161616", fontSize: "1.25rem" }}
        >
          <div
            className="card shadow-lg rounded-4 border-0"
            style={{
              background: "#f9f9f9",
              fontSize: "1.18em",
              color: "#161616"
            }}
          >
            <div className="card-body p-5">
              <h3
                className="fw-bold mb-4 text-center"
                style={{ fontSize: "2.3rem", color: "#B71C1C" }}
              >
                Assign or Remove Coach Role
              </h3>
              {/* Assign Coach */}
              <form onSubmit={handleAssignCoach}>
                <label className="mb-3 fw-semibold" style={{ fontSize: "1.18em" }}>
                  Assign Coach Role to User
                </label>
                <select
                  className="form-select mb-4"
                  value={assignId}
                  disabled={loading || submitting}
                  onChange={e => setAssignId(e.target.value)}
                  style={{
                    fontSize: "1.15rem",
                    borderRadius: 18,
                    minHeight: 60,
                    marginBottom: 32
                  }}
                >
                  <option value="">-- Choose a user --</option>
                  {users
                    .filter(u => u.role !== "coach")
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName || ""} {user.lastName || ""} ({user.email})
                      </option>
                    ))}
                </select>
                <button
                  className="btn btn-success w-100 rounded-pill mb-5"
                  type="submit"
                  disabled={!assignId || submitting || loading}
                  style={{
                    fontWeight: 700,
                    fontSize: "1.18em",
                    borderRadius: 22,
                    padding: "18px 0"
                  }}
                >
                  {submitting ? "Assigning..." : "Assign as Coach"}
                </button>
              </form>
              <hr style={{ margin: "34px 0" }} />
              {/* Remove Coach */}
              <form onSubmit={handleRemoveCoach}>
                <label className="mb-3 fw-semibold" style={{ fontSize: "1.18em" }}>
                  Remove Coach Role from User
                </label>
                <select
                  className="form-select mb-4"
                  value={removeId}
                  disabled={loading || submitting}
                  onChange={e => setRemoveId(e.target.value)}
                  style={{
                    fontSize: "1.15rem",
                    borderRadius: 18,
                    minHeight: 60,
                    marginBottom: 32
                  }}
                >
                  <option value="">-- Choose a coach --</option>
                  {users
                    .filter(u => u.role === "coach")
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName || ""} {user.lastName || ""} ({user.email})
                      </option>
                    ))}
                </select>
                <div className="mb-4 d-flex align-items-center gap-3">
                  <span className="fw-semibold" style={{ fontSize: "1.11em" }}>New role:</span>
                  <select
                    className="form-select w-auto"
                    value={newRole}
                    disabled={submitting}
                    onChange={e => setNewRole(e.target.value as "parent" | "player")}
                    style={{ borderRadius: 14, fontSize: "1.11em" }}
                  >
                    <option value="parent">Parent</option>
                    <option value="player">Player</option>
                  </select>
                </div>
                <button
                  className="btn btn-danger w-100 rounded-pill"
                  type="submit"
                  disabled={!removeId || submitting || loading}
                  style={{
                    fontWeight: 700,
                    fontSize: "1.18em",
                    borderRadius: 22,
                    padding: "18px 0"
                  }}
                >
                  {submitting ? "Updating..." : "Remove Coach Role"}
                </button>
              </form>
              {/* Feedback */}
              {success && (
                <div className="alert alert-success mt-5" style={{ fontSize: "1.12em" }}>
                  {success}
                </div>
              )}
              {error && (
                <div className="alert alert-danger mt-5" style={{ fontSize: "1.12em" }}>
                  {error}
                </div>
              )}
              {loading && (
                <div className="text-center text-secondary mt-4" style={{ fontSize: "1.10em" }}>
                  <span className="spinner-border spinner-border-sm" /> Loading users...
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AssignCoaches;
