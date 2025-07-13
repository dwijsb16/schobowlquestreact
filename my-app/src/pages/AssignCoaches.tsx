import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../.firebase/utils/firebase";
import NavBar from "../components/Navbar"; // Adjust path to your NavBar component
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
    <div className="container py-5" style={{ maxWidth: 540 }}>
        <NavBar></NavBar>
      <div className="card shadow-lg rounded-4 border-0">
        <div className="card-body p-4">
          <h3 className="fw-bold mb-3 text-center text-primary">Assign or Remove Coach Role</h3>
          {/* Assign Coach */}
          <form onSubmit={handleAssignCoach}>
            <label className="mb-2 fw-semibold">Assign Coach Role to User</label>
            <select
              className="form-select mb-3"
              value={assignId}
              disabled={loading || submitting}
              onChange={e => setAssignId(e.target.value)}
              style={{ fontSize: 17, borderRadius: 14, minHeight: 46 }}
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
              className="btn btn-success w-100 rounded-pill mb-4"
              type="submit"
              disabled={!assignId || submitting || loading}
              style={{ fontWeight: 700, fontSize: 17, borderRadius: 18 }}
            >
              {submitting ? "Assigning..." : "Assign as Coach"}
            </button>
          </form>
          <hr />
          {/* Remove Coach */}
          <form onSubmit={handleRemoveCoach}>
            <label className="mb-2 fw-semibold">Remove Coach Role from User</label>
            <select
              className="form-select mb-2"
              value={removeId}
              disabled={loading || submitting}
              onChange={e => setRemoveId(e.target.value)}
              style={{ fontSize: 17, borderRadius: 14, minHeight: 46 }}
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
            <div className="mb-3 d-flex align-items-center gap-3">
              <span className="fw-semibold">New role:</span>
              <select
                className="form-select w-auto"
                value={newRole}
                disabled={submitting}
                onChange={e => setNewRole(e.target.value as "parent" | "player")}
                style={{ borderRadius: 12, fontSize: 16 }}
              >
                <option value="parent">Parent</option>
                <option value="player">Player</option>
              </select>
            </div>
            <button
              className="btn btn-warning w-100 rounded-pill"
              type="submit"
              disabled={!removeId || submitting || loading}
              style={{ fontWeight: 700, fontSize: 17, borderRadius: 18 }}
            >
              {submitting ? "Updating..." : "Remove Coach Role"}
            </button>
          </form>
          {/* Feedback */}
          {success && <div className="alert alert-success mt-4">{success}</div>}
          {error && <div className="alert alert-danger mt-4">{error}</div>}
          {loading && (
            <div className="text-center text-secondary mt-3">
              <span className="spinner-border spinner-border-sm" /> Loading users...
            </div>
          )}
        </div>
      </div>
      <Footer></Footer>
    </div>
  );
};

export default AssignCoaches;
