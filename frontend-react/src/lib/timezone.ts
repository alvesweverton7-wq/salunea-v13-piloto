const parts=(date:Date,timeZone:string)=>Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));

function offsetMs(date:Date,timeZone:string){const p=parts(date,timeZone);const asUtc=Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour),Number(p.minute),Number(p.second));return asUtc-date.getTime();}

export function zonedDateTimeToIso(dateText:string,timeText:string,timeZone:string){const [y,m,d]=dateText.split('-').map(Number);const [hh,mm]=timeText.split(':').map(Number);const wallUtc=Date.UTC(y,m-1,d,hh,mm,0);let instant=new Date(wallUtc);for(let i=0;i<2;i++)instant=new Date(wallUtc-offsetMs(instant,timeZone));return instant.toISOString();}

export function nextDateText(dateText:string){const [y,m,d]=dateText.split('-').map(Number);const x=new Date(Date.UTC(y,m-1,d));x.setUTCDate(x.getUTCDate()+1);return x.toISOString().slice(0,10);}

export function unitDateText(timeZone:string,date=new Date()){const p=parts(date,timeZone);return `${p.year}-${p.month}-${p.day}`;}

export function formatUnitTime(iso:string,timeZone:string){return new Intl.DateTimeFormat('pt-BR',{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(iso));}
