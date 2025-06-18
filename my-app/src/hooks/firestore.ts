import { collection, addDoc, getDocs, updateDoc, arrayUnion, doc } from "firebase/firestore";
import { db} from "../.firebase/utils/firebase";
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