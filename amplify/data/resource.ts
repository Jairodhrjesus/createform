import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Workspace grouping surveys per owner
  Workspace: a.model({
    name: a.string().required(),
    description: a.string(),
    isDefault: a.boolean().default(false),
    surveys: a.hasMany('Survey', 'workspaceId'),
  }).authorization((allow) => [allow.owner()]),

  // 1. La Encuesta (Contenedor Principal)
  Survey: a.model({
    title: a.string().required(),
    description: a.string(),
    isActive: a.boolean().default(true),
    // Config de captura de leads (Email Gate)
    leadCaptureEnabled: a.boolean().default(true),
    leadCaptureRequireName: a.boolean().default(false),
    leadCaptureRequireEmail: a.boolean().default(true),
    leadCaptureCollectName: a.boolean().default(true),
    leadCaptureCollectEmail: a.boolean().default(true),
    leadCaptureTitle: a.string(),
    leadCaptureSubtitle: a.string(),
    leadCaptureCtaLabel: a.string(),
    leadCaptureDisclaimer: a.string(),
    leadCaptureFields: a.json(),

    // Opcional para no romper datos antiguos; el UI siempre asigna workspace
    workspaceId: a.id(),
    workspace: a.belongsTo('Workspace', 'workspaceId'),
    
    // Relaciones
    questions: a.hasMany('Question', 'surveyId'),
    outcomes: a.hasMany('Outcome', 'surveyId'),
    submissions: a.hasMany('Submission', 'surveyId'),
  }).authorization((allow) => [allow.owner()]), // Solo el dueno puede ver/editar su encuesta

  // 2. Resultados Posibles (Logica de Rangos)
  Outcome: a.model({
    surveyId: a.id().required(),
    survey: a.belongsTo('Survey', 'surveyId'),
    
    title: a.string().required(), 
    description: a.string(),
    minScore: a.integer().required(), 
    maxScore: a.integer().required(), 
    redirectUrl: a.string(),
  }).authorization((allow) => [
    allow.owner(), 
    allow.publicApiKey() // El frontend publico necesita leer esto para mostrar resultados
  ]),

  // 3. Preguntas
  Question: a.model({
    surveyId: a.id().required(),
    survey: a.belongsTo('Survey', 'surveyId'),
    
    text: a.string().required(),
    order: a.integer(),
    type: a.string().default('single_choice'), // Por si luego anades mas tipos
    
    options: a.hasMany('Option', 'questionId'),
  }).authorization((allow) => [
    allow.owner(), 
    allow.publicApiKey() // El publico debe poder leer las preguntas
  ]),

  // 4. Opciones (Donde vive el puntaje)
  Option: a.model({
    questionId: a.id().required(),
    question: a.belongsTo('Question', 'questionId'),
    
    text: a.string().required(),
    score: a.integer().default(0), 
  }).authorization((allow) => [
    allow.owner(), 
    allow.publicApiKey() // El publico debe leer las opciones para elegirlas
  ]),

  // 5. Envios de usuarios (Respuestas)
  Submission: a.model({
    surveyId: a.id().required(),
    survey: a.belongsTo('Survey', 'surveyId'),
    
    totalScore: a.integer().required(),
    outcomeTitle: a.string(), 
    answersContent: a.json(), // Guardamos el detalle como JSON
    respondentId: a.string(), // Opcional: para rastrear cookies/sesiones anonimas
    respondentName: a.string(), // Lead capture
    respondentEmail: a.string(), // Email opcional si el bloque lo remueve
    leadCaptureData: a.json(), // Datos completos del lead capture dinamico
  }).authorization((allow) => [
    allow.owner(), // Tu ves todas las respuestas
    allow.publicApiKey() // Cualquiera puede CREAR una respuesta
  ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    // IMPORTANTE: Cambiamos a 'userPool' como defecto para que funcione el Login de duenos
    defaultAuthorizationMode: 'userPool', 
    // Habilitamos API Key para que los usuarios anonimos puedan responder encuestas
    apiKeyAuthorizationMode: {
      expiresInDays: 30, // La API key rotara automaticamente
    },
  },
});
