"use client";

import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

// Configura Amplify una única vez en el cliente
Amplify.configure(outputs);

export default function AmplifyConfigurator() {
  return null;
}
