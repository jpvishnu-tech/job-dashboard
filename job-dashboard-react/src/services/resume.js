import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from 'firebase/storage';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../firebase/config';

export async function uploadResume(uid, file, onProgress) {
  const storageRef = ref(storage, `resumes/${uid}/resume.pdf`);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, { contentType: 'application/pdf' });
    task.on('state_changed',
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          await setDoc(doc(db, 'users', uid, 'resume', 'current'), {
            url,
            fileName: file.name,
            fileSize: file.size,
            uploadedAt: serverTimestamp(),
          });
          resolve(url);
        } catch (err) {
          reject(err);
        }
      },
    );
  });
}

export async function getResumeData(uid) {
  const snap = await getDoc(doc(db, 'users', uid, 'resume', 'current'));
  return snap.exists() ? snap.data() : null;
}

export async function deleteResume(uid) {
  try {
    const storageRef = ref(storage, `resumes/${uid}/resume.pdf`);
    await deleteObject(storageRef);
  } catch { /* ignore if file doesn't exist */ }
  await setDoc(doc(db, 'users', uid, 'resume', 'current'), {
    url: null, fileName: null, fileSize: null, uploadedAt: null,
  });
}
