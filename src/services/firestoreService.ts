import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { EmergencyContact, CommunityReport, ActiveJourney } from '../types';

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------
// Emergency Contacts
// ---------------------------------------------

export async function getEmergencyContactsFromFirestore(uid: string): Promise<EmergencyContact[]> {
  try {
    const contactsRef = collection(db, 'users', uid, 'emergencyContacts');
    const snapshot = await getDocs(contactsRef);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || '',
        relationship: data.relationship || 'Friend',
        phone: data.phone || '',
        email: data.email || '',
        isPrimary: Boolean(data.isPrimary),
      };
    });
  } catch (err) {
    console.warn('Failed to load emergency contacts from Firestore:', err);
    return [];
  }
}

export async function saveEmergencyContactToFirestore(
  uid: string,
  contact: Omit<EmergencyContact, 'id'>,
  customId?: string
): Promise<string> {
  const contactId = customId || `ec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const contactRef = doc(db, 'users', uid, 'emergencyContacts', contactId);
  await setDoc(contactRef, {
    ...contact,
    id: contactId,
    userId: uid,
    createdAt: new Date().toISOString(),
  });
  return contactId;
}

export async function deleteEmergencyContactFromFirestore(uid: string, contactId: string): Promise<void> {
  const contactRef = doc(db, 'users', uid, 'emergencyContacts', contactId);
  await deleteDoc(contactRef);
}

export async function setPrimaryContactInFirestore(uid: string, contactId: string): Promise<void> {
  const contactsRef = collection(db, 'users', uid, 'emergencyContacts');
  const snapshot = await getDocs(contactsRef);
  const updates: Promise<void>[] = [];
  snapshot.docs.forEach((docSnap) => {
    updates.push(
      updateDoc(docSnap.ref, {
        isPrimary: docSnap.id === contactId,
      })
    );
  });
  await Promise.all(updates);
}

// ---------------------------------------------
// Community Safety Reports
// ---------------------------------------------

export async function getCommunityReportsFromFirestore(): Promise<CommunityReport[]> {
  try {
    const reportsRef = collection(db, 'communityReports');
    const q = query(reportsRef, orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        category: data.category || 'other',
        title: data.title || '',
        description: data.description || '',
        location: [data.location?.lat || 0, data.location?.lng || 0] as [number, number],
        address: data.address || '',
        createdAt: data.createdAt || new Date().toISOString(),
        upvotes: data.upvotes || 0,
        status: data.status || 'active',
      };
    });
  } catch (err) {
    console.warn('Failed to load community reports from Firestore:', err);
    return [];
  }
}

export async function addCommunityReportToFirestore(
  report: Omit<CommunityReport, 'id' | 'createdAt' | 'upvotes' | 'status'>,
  authorUid: string
): Promise<string> {
  const reportId = `rep-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const reportRef = doc(db, 'communityReports', reportId);
  await setDoc(reportRef, {
    id: reportId,
    category: report.category,
    title: report.title,
    description: report.description,
    location: {
      lat: report.location[0],
      lng: report.location[1],
    },
    address: report.address || '',
    authorUid,
    createdAt: new Date().toISOString(),
    status: 'active',
    upvotes: 1,
  });
  return reportId;
}

export async function upvoteCommunityReportInFirestore(reportId: string, currentUpvotes: number): Promise<void> {
  const reportRef = doc(db, 'communityReports', reportId);
  await updateDoc(reportRef, {
    upvotes: currentUpvotes + 1,
  });
}

// ---------------------------------------------
// User Journey Logs
// ---------------------------------------------

export async function getUserJourneysFromFirestore(uid: string): Promise<ActiveJourney[]> {
  try {
    const journeysRef = collection(db, 'users', uid, 'journeys');
    const q = query(journeysRef, orderBy('startedAt', 'desc'), limit(25));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        route: data.route,
        originName: data.originName,
        destinationName: data.destinationName,
        originCoords: [data.originCoords?.lat, data.originCoords?.lng],
        destinationCoords: [data.destinationCoords?.lat, data.destinationCoords?.lng],
        mode: data.mode || 'safest',
        startedAt: data.startedAt,
        checkInIntervalMinutes: data.checkInIntervalMinutes || 15,
        nextCheckInTimestamp: data.nextCheckInTimestamp || 0,
        lastCheckInTimestamp: data.lastCheckInTimestamp || 0,
        status: data.status || 'completed',
      };
    });
  } catch (err) {
    console.warn('Failed to load user journeys from Firestore:', err);
    return [];
  }
}

export async function saveJourneyToFirestore(uid: string, journey: ActiveJourney): Promise<void> {
  try {
    const journeyRef = doc(db, 'users', uid, 'journeys', journey.id);
    await setDoc(journeyRef, {
      id: journey.id,
      userId: uid,
      originName: journey.originName,
      destinationName: journey.destinationName,
      originCoords: {
        lat: journey.originCoords[0],
        lng: journey.originCoords[1],
      },
      destinationCoords: {
        lat: journey.destinationCoords[0],
        lng: journey.destinationCoords[1],
      },
      distanceKm: journey.route.distanceKm,
      durationMinutes: journey.route.durationMinutes,
      safetyScore: journey.route.safety.compositeSafetyScore,
      status: journey.status,
      checkInIntervalMinutes: journey.checkInIntervalMinutes,
      startedAt: journey.startedAt,
      completedAt: journey.status === 'completed' ? new Date().toISOString() : null,
      route: {
        id: journey.route.id,
        name: journey.route.name,
        distanceKm: journey.route.distanceKm,
        durationMinutes: journey.route.durationMinutes,
        safety: journey.route.safety,
      },
    });
  } catch (err) {
    console.warn('Failed to record journey in Firestore:', err);
  }
}
