// Minimal public existence checks: exact SHA-256 keys, no identity fields.
import {doc} from 'firebase/firestore';
export async function directoryKeys(db,email,vendorId){
  const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
  email=String(email).trim().toLowerCase();vendorId=String(vendorId).trim().toUpperCase();
  return{email:doc(db,'accountEmails',await hash(email)),pair:doc(db,'accountPairs',await hash(vendorId+'\n'+email))};
}
export function writeDirectory(writer,keys){writer.set(keys.email,{registered:true});writer.set(keys.pair,{registered:true})}
