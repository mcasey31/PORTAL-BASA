const fs = require('fs');
const signin = fs.readFileSync('/app/src/app/auth/signin/page.tsx','utf8');
const quantum = fs.readFileSync('/app/src/app/(tenant)/quantum-home/page.tsx','utf8');
console.log('signin_has_portal_medicos=', /Portal Medicos|Ir a Portal Medicos|\/staff\/login/.test(signin));
console.log('quantum_has_portal_medicos=', /Portal Medicos|Acceso Staff|\/staff\/login/.test(quantum));
