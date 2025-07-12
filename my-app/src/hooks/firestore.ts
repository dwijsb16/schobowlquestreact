import { collection, addDoc, getDocs, getDoc, updateDoc, arrayUnion, doc, query, where } from "firebase/firestore";
import { db} from "../.firebase/utils/firebase";
import { arrayRemove, deleteDoc} from "firebase/firestore";
import { useState, useEffect } from "react";


// General Firestore add function (no types)
export async function addDocument(collectionName: string, data: any) {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    console.log("Document written with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    return null;
  }
}

// Generic get collection function
export async function getCollection<T>(collectionName: string): Promise<(T & { id: string })[]> {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as T)
      }));
    } catch (e) {
      console.error("Error fetching collection: ", e);
      return [];
    }
  }


export async function addToArrayInDocument(
  collectionName: string,
  docId: string,
  field: string,
  value: any
) {
  try {
    const ref = doc(db, collectionName, docId);
    await updateDoc(ref, {
      [field]: arrayUnion(value),
    });
    console.log(`Added to array '${field}' in document ${docId}`);
  } catch (e) {
    console.error("Error updating document array:", e);
    throw e;
  }
}
export async function updateDocumentFields(
  collectionName: string,
  docId: string,
  updatedFields: Partial<any>
) {
  try {
    const ref = doc(db, collectionName, docId);
    await updateDoc(ref, updatedFields);
    console.log("Document updated");
  } catch (e) {
    console.error("Error updating document:", e);
  }
}
export async function getDocumentById<T>(collectionName: string, docId: string): Promise<T & {
  role: string;
  firstName: string;
  lastName: string;
  linkedPlayers: never[]; id: string 
} | null> {
  try {
    const ref = doc(db, collectionName, docId);
    const snap = await getDoc(ref);
    if (snap.exists()) return { 
      id: snap.id, 
      role: '', // default value
      firstName: '', // default value
      lastName: '', // default value
      linkedPlayers: [], // default value
      ...(snap.data() as T) 
    };
    return null;
  } catch (e) {
    console.error("Error fetching document:", e);
    return null;
  }
}

export async function removeFromArrayInDocument(
  collectionName: string,
  docId: string,
  field: string,
  value: any
) {
  try {
    const ref = doc(db, collectionName, docId);
    await updateDoc(ref, {
      [field]: arrayRemove(value),
    });
    console.log(`Removed from array '${field}' in document ${docId}`);
  } catch (e) {
    console.error("Error removing from document array:", e);
    throw e;
  }
}
export async function deleteDocument(collectionName: string, docId: string) {
  try {
    const ref = doc(db, collectionName, docId);
    await deleteDoc(ref);
    console.log("Document deleted");
  } catch (e) {
    console.error("Error deleting document:", e);
  }
}
// Get users by role (players, coaches, parents)
export async function getUsersByRole(role: string): Promise<any[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, "users"), where("role", "==", role))
    );
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
  } catch (e) {
    console.error("Error fetching users by role:", e);
    return [];
  }
}

// Get users for a team (by team ID)
export async function getUsersByTeam(teamId: string): Promise<any[]> {
  try {
    const teamDoc = await getDoc(doc(db, "teams", teamId));
    if (!teamDoc.exists()) return [];
    const data = teamDoc.data();
    // Example: data.players = array of emails or user ids
    return data.players || [];
  } catch (e) {
    console.error("Error fetching team:", e);
    return [];
  }
}

// Get users for a tournament (by tournament ID, expects attendees: email[] or user IDs)
export async function getUsersByTournament(tournId: string): Promise<any[]> {
  try {
    const tournDoc = await getDoc(doc(db, "tournaments", tournId));
    if (!tournDoc.exists()) return [];
    const data = tournDoc.data();
    // Example: data.attendees = array of emails or user ids
    return data.attendees || [];
  } catch (e) {
    console.error("Error fetching tournament:", e);
    return [];
  }
}
