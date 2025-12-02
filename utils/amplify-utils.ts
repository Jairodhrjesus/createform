import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

// Este 'client' es tu varita mágica para hacer CRUD (Create, Read, Update, Delete)
export const client = generateClient<Schema>();
