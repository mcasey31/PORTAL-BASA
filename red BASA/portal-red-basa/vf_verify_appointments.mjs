import { getPatientAppointmentsFromHis } from "./src/server/services/his/vitalflow-adapter.ts";

const hisId = "8376a007-e9e6-455c-818e-a4cc41f46db1";

const future = await getPatientAppointmentsFromHis(hisId, { historial: false, page: 1, pageSize: 20 });
const past = await getPatientAppointmentsFromHis(hisId, { historial: true, page: 1, pageSize: 20 });

console.log("FUTURE", future.length);
console.log(JSON.stringify(future.map(a => ({ id: a.id, start: a.start, status: a.status, prof: a.professional.name })), null, 2));
console.log("PAST", past.length);
