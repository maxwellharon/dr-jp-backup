import { db } from '../firebase/config'
import { setDoc, doc } from 'firebase/firestore'

export async function seedCollection(collectionName, records) {
  if (!records.length) return
  const promises = records.map(rec => {
    const id = rec.id || doc(collection(db, collectionName)).id
    return setDoc(doc(db, collectionName, id), rec)
  })
  await Promise.all(promises)
}