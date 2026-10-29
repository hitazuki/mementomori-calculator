import fs from 'node:fs'
// Windows can briefly hold generated JSON open (previewers/antivirus). Replace
// complete files instead of truncating a live file, with a bounded retry.
export function writeGeneratedFile(file,text) {
  const path=file instanceof URL?new URL(file.href+'.tmp'):file+'.tmp'
  fs.writeFileSync(path,text)
  for(let attempt=0;;attempt++) {
    try {fs.renameSync(path,file);return} catch(error) {
      if(attempt>=9||!['EPERM','EACCES','EBUSY','UNKNOWN'].includes(error.code))throw error
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100)
    }
  }
}
