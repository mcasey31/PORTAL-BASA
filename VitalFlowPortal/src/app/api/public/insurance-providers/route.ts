import { NextResponse } from "next/server";

import { getInsuranceCatalogForPublicSignup } from "~/server/services/his/vitalflow-adapter";

const exampleProviders = [
  {
    id: "osde",
    name: "OSDE",
    plans: [
      { id: "osde-basica", name: "Básica" },
      { id: "osde-plus", name: "Plus" },
      { id: "osde-oro", name: "Oro" },
    ],
  },
  {
    id: "swiss-medical",
    name: "Swiss Medical",
    plans: [
      { id: "swiss-standard", name: "Standard" },
      { id: "swiss-oro", name: "Oro" },
      { id: "swiss-platinum", name: "Platinum" },
    ],
  },
  {
    id: "galeno",
    name: "Galeno",
    plans: [
      { id: "galeno-club", name: "Club" },
      { id: "galeno-elite", name: "Elite" },
    ],
  },
  {
    id: "medicus",
    name: "Medicus",
    plans: [
      { id: "medicus-100", name: "100" },
      { id: "medicus-200", name: "200" },
    ],
  },
];

export async function GET() {
  try {
    const providers = await getInsuranceCatalogForPublicSignup();
    return NextResponse.json({ providers: providers.length > 0 ? providers : exampleProviders });
  } catch (error) {
    console.error("[PublicInsuranceProviders]", error);
    return NextResponse.json({ providers: exampleProviders, error: "No se pudo cargar catalogo del HIS; se usan ejemplos" });
  }
}
